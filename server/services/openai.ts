import OpenAI from "openai";
import { QuizQuestion } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "default_key"
});

export interface QuizGenerationOptions {
  material: string;
  questionCount: number;
  questionTypes: string[];
  difficultyLevel: string;
  title: string;
}

export async function generateQuiz(options: QuizGenerationOptions): Promise<QuizQuestion[]> {
  const { material, questionCount, questionTypes, difficultyLevel, title } = options;

  const sanitizedText = material.slice(0, 4000).replace(/[\r\n]+/g, " ").trim(); // 🔧 Clean text

  const prompt = `
You are an expert in English quiz generation for IELTS and academic learners.

Your task:
- ONLY use the material provided below (a vocabulary list of synonyms for 4 skills: Reading, Listening, Speaking, Writing).
- DO NOT invent extra grammar questions, general trivia, or unrelated content.

Instructions:
- Generate exactly ${questionCount} questions.
- Question types allowed: ${questionTypes.join(", ")}.
- Difficulty level: ${difficultyLevel} (A1–C2).
- Quiz title: "${title}"
- All questions must test **synonym meaning**, **formal/informal use**, **contextual replacement**, or **collocations** found in the material.

Return a valid JSON object in this format:

{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Which word is a formal synonym of 'help'?",
      "options": ["assist", "play", "delay", "fix"],
      "correctAnswer": "assist",
      "explanation": "'Assist' is a more formal synonym for 'help' used in academic writing.",
      "difficulty": "beginner"
    }
  ]
}

Material content:
"""
${sanitizedText}
"""
`.trim();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that generates academic English quiz questions based only on provided material."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const raw = response.choices?.[0]?.message?.content || "";

    // ✅ Clean markdown if present
    const cleaned = raw.replace(/```json|```/g, "").trim();

    console.log("📦 GPT raw output:\n", raw); // (Tùy chọn) để debug
    console.log("✅ Cleaned JSON:\n", cleaned);

    const result = JSON.parse(cleaned);
    return result.questions || [];
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

export async function gradeQuizAttempt(questions: QuizQuestion[], answers: any[]): Promise<{
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  feedback: string[];
}> {
  let correctAnswers = 0;
  const feedback: string[] = [];

  questions.forEach((question, index) => {
    const userAnswer = answers[index]?.answer;
    const isCorrect = userAnswer === question.correctAnswer;
    
    if (isCorrect) {
      correctAnswers++;
    }

    feedback.push(
      isCorrect 
        ? `Question ${index + 1}: Correct! ${question.explanation || ""}`
        : `Question ${index + 1}: Incorrect. The correct answer is "${question.correctAnswer}". ${question.explanation || ""}`
    );
  });

  const score = (correctAnswers / questions.length) * 100;

  return {
    score,
    correctAnswers,
    totalQuestions: questions.length,
    feedback
  };
}
