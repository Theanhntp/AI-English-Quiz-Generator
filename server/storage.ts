import { users, materials, quizzes, attempts, type User, type InsertUser, type Material, type InsertMaterial, type Quiz, type InsertQuiz, type Attempt, type InsertAttempt } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  createMaterial(insertMaterial: InsertMaterial & { userId: string }): Promise<Material>;
  getMaterialsByUserId(userId: string): Promise<Material[]>;
  getMaterialById(id: string): Promise<Material | undefined>;
  updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined>;
  deleteMaterial(id: string): Promise<boolean>;
  
  createQuiz(insertQuiz: InsertQuiz & { userId: string }): Promise<Quiz>;
  getQuizzesByUserId(userId: string): Promise<Quiz[]>;
  getQuizById(id: string): Promise<Quiz | undefined>;
  updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;
  
  createAttempt(insertAttempt: InsertAttempt & { userId: string }): Promise<Attempt>;
  getAttemptsByUserId(userId: string): Promise<Attempt[]>;
  getAttemptsByQuizId(quizId: string): Promise<Attempt[]>;
  getAttemptById(id: string): Promise<Attempt | undefined>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ pool, createTableIfMissing: true });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createMaterial(materialData: InsertMaterial & { userId: string }): Promise<Material> {
    const [material] = await db.insert(materials).values(materialData).returning();
    return material;
  }

  async getMaterialsByUserId(userId: string): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.userId, userId)).orderBy(desc(materials.createdAt));
  }

  async getMaterialById(id: string): Promise<Material | undefined> {
    const [material] = await db.select().from(materials).where(eq(materials.id, id));
    return material || undefined;
  }

  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material | undefined> {
    const [material] = await db.update(materials).set(updates).where(eq(materials.id, id)).returning();
    return material || undefined;
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const result = await db.delete(materials).where(eq(materials.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createQuiz(quizData: InsertQuiz & { userId: string }): Promise<Quiz> {
    const [quiz] = await db.insert(quizzes).values(quizData).returning();
    return quiz;
  }

  async getQuizzesByUserId(userId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.userId, userId)).orderBy(desc(quizzes.createdAt));
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async updateQuiz(id: string, updates: Partial<Quiz>): Promise<Quiz | undefined> {
    const [quiz] = await db.update(quizzes).set(updates).where(eq(quizzes.id, id)).returning();
    return quiz || undefined;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const result = await db.delete(quizzes).where(eq(quizzes.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async createAttempt(attemptData: InsertAttempt & { userId: string }): Promise<Attempt> {
    const [attempt] = await db.insert(attempts).values(attemptData).returning();
    return attempt;
  }

  async getAttemptsByUserId(userId: string): Promise<Attempt[]> {
    return await db.select().from(attempts).where(eq(attempts.userId, userId)).orderBy(desc(attempts.completedAt));
  }

  async getAttemptsByQuizId(quizId: string): Promise<Attempt[]> {
    return await db.select().from(attempts).where(eq(attempts.quizId, quizId)).orderBy(desc(attempts.completedAt));
  }

  async getAttemptById(id: string): Promise<Attempt | undefined> {
    const [attempt] = await db.select().from(attempts).where(eq(attempts.id, id));
    return attempt || undefined;
  }
}

export const storage = new DatabaseStorage();
