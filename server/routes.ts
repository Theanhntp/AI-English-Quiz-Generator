import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import { extractTextFromFile, validateFileType } from "./services/fileProcessor";
import { generateQuiz, gradeQuizAttempt } from "./services/openai";
import { insertMaterialSchema, insertQuizSchema, insertAttemptSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (validateFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Material routes
  app.post("/api/materials/upload", requireAuth, upload.single("file"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const material = await storage.createMaterial({
        userId: req.user!.id,
        name: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });

      // Process file in background
      try {
        const extractedText = await extractTextFromFile(req.file.path, req.file.mimetype);
        await storage.updateMaterial(material.id, {
          extractedText,
          status: "processed"
        });
      } catch (error) {
        await storage.updateMaterial(material.id, {
          status: "failed"
        });
      }

      res.status(201).json(material);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/materials", requireAuth, async (req, res, next) => {
    try {
      const materials = await storage.getMaterialsByUserId(req.user!.id);
      res.json(materials);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/materials/:id", requireAuth, async (req, res, next) => {
    try {
      const success = await storage.deleteMaterial(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Material not found" });
      }
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  // Quiz routes
  app.post("/api/quiz/generate", requireAuth, async (req, res, next) => {
    try {
      const { materialId, questionCount, questionTypes, difficultyLevel, title } = req.body;

      const material = await storage.getMaterialById(materialId);
      if (!material || material.userId !== req.user!.id) {
        return res.status(404).json({ message: "Material not found" });
      }

      if (!material.extractedText) {
        return res.status(400).json({ message: "Material not processed yet" });
      }

      const questions = await generateQuiz({
        material: material.extractedText,
        questionCount: parseInt(questionCount) || 10,
        questionTypes: questionTypes || ["multiple_choice"],
        difficultyLevel: difficultyLevel || "intermediate",
        title: title || "Generated Quiz"
      });

      const quiz = await storage.createQuiz({
        userId: req.user!.id,
        materialId: material.id,
        title: title || "Generated Quiz",
        questions: questions,
        difficultyLevel: difficultyLevel || "intermediate",
        timeLimit: 30, // 30 minutes default
      });

      res.status(201).json(quiz);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/quizzes", requireAuth, async (req, res, next) => {
    try {
      const quizzes = await storage.getQuizzesByUserId(req.user!.id);
      res.json(quizzes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/quiz/:id", requireAuth, async (req, res, next) => {
    try {
      const quiz = await storage.getQuizById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/quiz/:id/submit", requireAuth, async (req, res, next) => {
    try {
      const { answers, timeSpent } = req.body;
      const quiz = await storage.getQuizById(req.params.id);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const gradingResult = await gradeQuizAttempt(quiz.questions as any[], answers);

      const attempt = await storage.createAttempt({
        userId: req.user!.id,
        quizId: quiz.id,
        answers: answers,
        score: gradingResult.score.toString(),
        totalQuestions: gradingResult.totalQuestions,
        correctAnswers: gradingResult.correctAnswers,
        timeSpent: timeSpent || 0,
      });

      res.status(201).json({
        attempt,
        feedback: gradingResult.feedback
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/quiz/:id/publish", requireAuth, async (req, res, next) => {
    try {
      const quiz = await storage.getQuizById(req.params.id);
      if (!quiz || quiz.userId !== req.user!.id) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const updatedQuiz = await storage.updateQuiz(req.params.id, { isPublished: true });
      res.json(updatedQuiz);
    } catch (error) {
      next(error);
    }
  });

  // Results routes
  app.get("/api/results", requireAuth, async (req, res, next) => {
    try {
      const attempts = await storage.getAttemptsByUserId(req.user!.id);
      res.json(attempts);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/result/:id", requireAuth, async (req, res, next) => {
    try {
      const attempt = await storage.getAttemptById(req.params.id);
      if (!attempt) {
        return res.status(404).json({ message: "Result not found" });
      }
      res.json(attempt);
    } catch (error) {
      next(error);
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", requireAuth, async (req, res, next) => {
    try {
      const materials = await storage.getMaterialsByUserId(req.user!.id);
      const quizzes = await storage.getQuizzesByUserId(req.user!.id);
      const attempts = await storage.getAttemptsByUserId(req.user!.id);

      const totalAttempts = attempts.length;
      const avgScore = totalAttempts > 0 
        ? attempts.reduce((sum, attempt) => sum + parseFloat(attempt.score.toString()), 0) / totalAttempts
        : 0;

      res.json({
        totalMaterials: materials.length,
        totalQuizzes: quizzes.length,
        totalAttempts,
        avgScore: Math.round(avgScore * 100) / 100
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
