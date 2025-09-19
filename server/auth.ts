import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

/** Tạo hash mới: định dạng "salt:hash" để thống nhất với DB */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");            // 16 bytes -> 32 hex
  const buf = (await scryptAsync(password, salt, 64)) as Buffer; // 64 bytes -> 128 hex
  const hashHex = buf.toString("hex");
  return `${salt}:${hashHex}`;
}

/** So khớp mật khẩu: hỗ trợ cả "hash.salt" (legacy) và "salt:hash" (chuẩn mới) */
async function comparePasswords(supplied: string, stored: string) {
  if (!stored) return false;

  let salt: string | undefined;
  let hashHex: string | undefined;

  if (stored.includes(":")) {
    // "salt:hash" (chuẩn mới và đúng với DB hiện tại)
    const [a, b] = stored.split(":");
    // đoán vị trí phòng trường hợp dữ liệu bị đảo
    if (a && b) {
      // salt (32 hex) vs hash (>=64 hex). Ta ưu tiên a là salt nếu có độ dài 32.
      if (/^[0-9a-f]+$/i.test(a) && a.length === 32) {
        salt = a;
        hashHex = b;
      } else {
        // fallback: giả định b là salt
        salt = b;
        hashHex = a;
      }
    }
  } else if (stored.includes(".")) {
    // "hash.salt" (legacy theo code cũ)
    const [hashed, s] = stored.split(".");
    hashHex = hashed;
    salt = s;
  } else {
    // format lạ -> fail an toàn
    return false;
  }

  if (!salt || !hashHex) return false;

  const derived = (await scryptAsync(supplied, salt, 64)) as Buffer;
  const storedBuf = Buffer.from(hashHex, "hex");
  if (storedBuf.length !== derived.length) return false; // tránh timing leak
  return timingSafeEqual(storedBuf, derived);
}


export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
