import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("student"), // teacher | student
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const materials = pgTable("materials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  status: text("status").notNull().default("processing"), // processing | processed | failed
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  materialId: varchar("material_id").references(() => materials.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(), // Array of question objects
  difficultyLevel: text("difficulty_level").notNull(), // beginner | intermediate | advanced | mixed
  timeLimit: integer("time_limit"), // in minutes
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull(), // Array of answer objects
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  completedAt: timestamp("completed_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  materials: many(materials),
  quizzes: many(quizzes),
  attempts: many(attempts),
}));

export const materialsRelations = relations(materials, ({ one, many }) => ({
  user: one(users, {
    fields: [materials.userId],
    references: [users.id],
  }),
  quizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, {
    fields: [quizzes.userId],
    references: [users.id],
  }),
  material: one(materials, {
    fields: [quizzes.materialId],
    references: [materials.id],
  }),
  attempts: many(attempts),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [attempts.quizId],
    references: [quizzes.id],
  }),
  user: one(users, {
    fields: [attempts.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
});

export const insertMaterialSchema = createInsertSchema(materials).pick({
  name: true,
  originalName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  materialId: true,
  title: true,
  description: true,
  questions: true,
  difficultyLevel: true,
  timeLimit: true,
});

export const insertAttemptSchema = createInsertSchema(attempts).pick({
  quizId: true,
  answers: true,
  score: true,
  totalQuestions: true,
  correctAnswers: true,
  timeSpent: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type Material = typeof materials.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attempts.$inferSelect;

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: string;
}

export interface QuizAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
}
