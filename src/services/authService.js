import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { sendVerificationEmail } from "./mailer.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_\.]{3,30}$/;
export const PASSWORD_MIN_LENGTH = 6;

const VERIFICATION_CODE_TTL_MS = 15 * 60 * 1000;
const VERIFICATION_SEND_COOLDOWN_MS = 60 * 1000;
const VERIFICATION_SEND_WINDOW_MS = 60 * 60 * 1000;
const VERIFICATION_MAX_SENDS_PER_WINDOW = 5;
const VERIFICATION_ATTEMPT_WINDOW_MS = 60 * 60 * 1000;
const VERIFICATION_MAX_ATTEMPTS_PER_WINDOW = 10;

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

export function isValidUsername(username) {
  return USERNAME_REGEX.test(username);
}

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= PASSWORD_MIN_LENGTH;
}

export function hashVerificationCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export function createToken(user) {
  return jwt.sign(
    {
      id: String(user._id),
      username: user.username,
      email: user.email,
      provider: user.provider,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

async function enforceSendLimits(user) {
  const now = new Date();

  if (user.verificationCodeSentAt) {
    const elapsed = now.getTime() - user.verificationCodeSentAt.getTime();
    if (elapsed < VERIFICATION_SEND_COOLDOWN_MS) {
      throw Object.assign(
        new Error("Please wait before requesting another code"),
        {
          statusCode: 429,
        },
      );
    }
  }

  if (
    !user.verificationCodeWindowStart ||
    now.getTime() - user.verificationCodeWindowStart.getTime() >
      VERIFICATION_SEND_WINDOW_MS
  ) {
    user.verificationCodeWindowStart = now;
    user.verificationCodeSendCount = 0;
  }

  if (user.verificationCodeSendCount >= VERIFICATION_MAX_SENDS_PER_WINDOW) {
    throw Object.assign(new Error("Too many verification emails requested"), {
      statusCode: 429,
    });
  }

  user.verificationCodeSendCount += 1;
}

export async function enforceVerifyLimits(user) {
  const now = new Date();

  if (user.verificationLockedUntil && user.verificationLockedUntil > now) {
    throw Object.assign(new Error("Verification temporarily locked"), {
      statusCode: 429,
    });
  }

  if (
    !user.verificationAttemptWindowStart ||
    now.getTime() - user.verificationAttemptWindowStart.getTime() >
      VERIFICATION_ATTEMPT_WINDOW_MS
  ) {
    user.verificationAttemptWindowStart = now;
    user.verificationAttemptCount = 0;
  }

  if (user.verificationAttemptCount >= VERIFICATION_MAX_ATTEMPTS_PER_WINDOW) {
    user.verificationLockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
    throw Object.assign(new Error("Too many invalid verification attempts"), {
      statusCode: 429,
    });
  }
}

export async function sendNewVerificationCode(user) {
  await enforceSendLimits(user);

  const code = generateVerificationCode();
  user.verificationCodeHash = hashVerificationCode(code);
  user.verificationCodeExpiresAt = new Date(
    Date.now() + VERIFICATION_CODE_TTL_MS,
  );
  user.verificationCodeSentAt = new Date();

  await sendVerificationEmail({ to: user.email, code });
  await user.save();
}

export async function generateUniqueUsername(seed) {
  const baseRaw = String(seed || "user").toLowerCase();
  const base =
    baseRaw
      .replace(/[^a-z0-9_.]/g, "")
      .replace(/^[_.]+/, "")
      .slice(0, 20) || "user";

  let candidate = base;
  let counter = 0;

  while (await User.exists({ username: candidate })) {
    counter += 1;
    candidate = `${base}${counter}`.slice(0, 30);
  }

  return candidate;
}
