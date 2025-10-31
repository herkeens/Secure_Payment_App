import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import rateLimit from "express-rate-limit";
import { RateLimiterRedis, RateLimiterMemory } from "rate-limiter-flexible";
import Redis from "ioredis";
import User from "../models/User.js";
import sanitize from "mongo-sanitize";

const router = express.Router();

// ---- Validation regex ----
const nameRe = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,80}$/; 
const usernameRe = /^[a-zA-Z0-9_.-]{3,32}$/;
const idNumberRe = /^[0-9A-Za-z\-]{6,32}$/;
const accountRe = /^[0-9]{6,20}$/;
const passwordRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// ---- Lightweight per-route rate limits ----
const registerLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

// ---- Strong brute-force guard (per ip + username + accountNumber) ----
let bruteLimiter;
if (process.env.REDIS_URL) {
  const redis = new Redis(process.env.REDIS_URL);
  bruteLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "login_bf",
    points: 5,
    duration: 600,
    blockDuration: 900,
  });
} else {
  bruteLimiter = new RateLimiterMemory({
    keyPrefix: "login_bf",
    points: 5,
    duration: 600,
    blockDuration: 900,
  });
}
const loginKey = (req) =>
  `${req.ip}:${(req.body?.username || "").toLowerCase().trim()}:${(
    req.body?.accountNumber || ""
  ).trim()}`;
const loginBruteMiddleware = async (req, res, next) => {
  try {
    await bruteLimiter.consume(loginKey(req));
    next();
  } catch {
    res.status(429).json({ error: "Too many attempts. Try again later." });
  }
};
const recordLoginFailure = async (req) => {
  try {
    await bruteLimiter.penalty(loginKey(req));
  } catch {}
};
const resetLoginFailures = async (req) => {
  try {
    await bruteLimiter.delete(loginKey(req));
  } catch {}
};

// ---- Routes ----
router.post(
  "/register",
  registerLimiter,
  [
    body("name").trim().matches(nameRe),
    body("email").optional().trim().isEmail(),
    body("username").trim().matches(usernameRe),
    body("idNumber").trim().matches(idNumberRe),
    body("accountNumber").trim().matches(accountRe),
    body("password").matches(passwordRe),
    body("confirmPassword").custom((v, { req }) => v === req.body.password),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ ok: false, errors: errors.array() });

    try {
      const name = sanitize(req.body.name);
      const email = req.body.email
        ? sanitize(req.body.email.toLowerCase())
        : undefined;
      const username = sanitize(req.body.username);
      const idNumber = sanitize(req.body.idNumber);
      const accountNumber = sanitize(req.body.accountNumber);
      const password = req.body.password;

      // unique constraints check
      const exists = await User.findOne({
        $or: [{ username }, { accountNumber }, ...(email ? [{ email }] : [])],
      }).lean();
      if (exists)
        return res.status(409).json({
          ok: false,
          error: "Username, account number, or email already in use.",
        });

      const hash = await argonHash(password, {
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
        hashLength: 32,
        type: 2,
      });

      const created = await User.create({
        name,
        email,
        username,
        idNumber,
        accountNumber,
        password: hash,
      });

      return res.status(201).json({
        ok: true,
        user: {
          id: created._id,
          name: created.name,
          username: created.username,
          accountNumber: created.accountNumber,
        },
      });
    } catch (e) {
      console.error("register error:", e);
      return res.status(500).json({ ok: false, error: "Registration failed." });
    }
  }
);

router.post(
  "/login",
  loginLimiter,
  loginBruteMiddleware,
  [
    body("username").trim().matches(usernameRe),
    body("accountNumber").trim().matches(accountRe),
    body("password").isString().isLength({ min: 1 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ ok: false, errors: errors.array() });

    try {
      const username = sanitize(req.body.username);
      const accountNumber = sanitize(req.body.accountNumber);
      const password = req.body.password;

      const user = await User.findOne({ username, accountNumber });
      if (!user) {
        await recordLoginFailure(req);
        return res
          .status(401)
          .json({ ok: false, error: "Invalid credentials." });
      }

      const ok = await argonVerify(user.password, password);
      if (!ok) {
        await recordLoginFailure(req);
        return res
          .status(401)
          .json({ ok: false, error: "Invalid credentials." });
      }

      await resetLoginFailures(req);

      const token = jwt.sign(
        {
          sub: user._id.toString(),
          email: user.email || null,
          name: user.name || null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.cookie("session", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
      });

      return res.json({
        ok: true,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          accountNumber: user.accountNumber,
        },
      });
    } catch (e) {
      console.error("login error:", e);
      return res.status(500).json({ ok: false, error: "Login failed." });
    }
  }
);

router.get("/me", (req, res) => {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ ok: false });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({
      ok: true,
      sub: payload.sub,
      email: payload.email || null,
      name: payload.name || null,
    });
  } catch {
    return res.status(401).json({ ok: false });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie("session", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  res.json({ ok: true });
});

export default router;
