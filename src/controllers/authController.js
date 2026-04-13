import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.js";
import {
  PASSWORD_MIN_LENGTH,
  createToken,
  enforceVerifyLimits,
  generateUniqueUsername,
  hashVerificationCode,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  normalizeEmail,
  normalizeUsername,
  sendNewVerificationCode,
} from "../services/authService.js";

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

export async function register(req, res) {
  try {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!isValidUsername(username)) {
      return res.status(400).json({
        error:
          "Username must be 3-30 chars and only include letters, numbers, underscore, dot",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }

    let user = await User.findOne({ email });
    const existingUsernameUser = await User.findOne({ username });

    if (
      existingUsernameUser &&
      String(existingUsernameUser._id) !== String(user?._id)
    ) {
      return res.status(409).json({ error: "Username already exists" });
    }

    if (user?.isEmailVerified) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (!user) {
      user = new User({
        username,
        email,
        name: username,
        passwordHash,
        provider: "local",
        isEmailVerified: false,
      });
    } else {
      user.username = username;
      user.name = user.name || username;
      user.passwordHash = passwordHash;
      user.provider = "local";
    }

    await sendNewVerificationCode(user);

    return res.status(201).json({
      message: "Verification code sent to email",
      email: user.email,
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal server error",
    });
  }
}

export async function resendCode(req, res) {
  try {
    const email = normalizeEmail(req.body.email);

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    await sendNewVerificationCode(user);

    return res.json({ message: "Verification code resent" });
  } catch (error) {
    console.error("❌ Resend code error:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal server error",
    });
  }
}

export async function verifyEmail(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").trim();

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (!/^\d{6}$/.test(code)) {
      return res
        .status(400)
        .json({ error: "Verification code must be 6 digits" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.json({ message: "Email already verified" });
    }

    await enforceVerifyLimits(user);

    if (!user.verificationCodeHash || !user.verificationCodeExpiresAt) {
      return res.status(400).json({ error: "Verification code not found" });
    }

    if (user.verificationCodeExpiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "Verification code expired" });
    }

    if (hashVerificationCode(code) !== user.verificationCodeHash) {
      user.verificationAttemptCount += 1;
      await user.save();
      return res.status(400).json({ error: "Invalid verification code" });
    }

    user.isEmailVerified = true;
    user.verificationCodeHash = null;
    user.verificationCodeExpiresAt = null;
    user.verificationCodeSentAt = null;
    user.verificationCodeSendCount = 0;
    user.verificationCodeWindowStart = null;
    user.verificationAttemptCount = 0;
    user.verificationAttemptWindowStart = null;
    user.verificationLockedUntil = null;
    await user.save();

    const token = createToken(user);

    return res.json({
      message: "Email verified successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("❌ Verify email error:", error);
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal server error",
    });
  }
}

export async function login(req, res) {
  try {
    const identifierRaw =
      req.body.identifier || req.body.email || req.body.username;
    const identifier = String(identifierRaw || "").trim();
    const password = req.body.password;

    if (!identifier) {
      return res.status(400).json({ error: "Email or username is required" });
    }

    if (typeof password !== "string" || !password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const normalizedEmail = normalizeEmail(identifier);
    const normalizedUsername = normalizeUsername(identifier);

    const user = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res
        .status(400)
        .json({ error: "Please sign in with Google for this account" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        error: "Email not verified",
        resendRequired: true,
      });
    }

    const token = createToken(user);
    return res.json({ token, user });
  } catch (error) {
    console.error("❌ Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function googleLogin(req, res) {
  try {
    if (!googleClient) {
      return res.status(500).json({ error: "Google auth is not configured" });
    }

    const idToken = req.body.idToken;
    if (!idToken) {
      return res.status(400).json({ error: "Missing Google idToken" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const googleId = payload?.sub;
    const name = payload?.name || payload?.given_name || "";

    if (!email || !googleId || !payload?.email_verified) {
      return res.status(400).json({ error: "Invalid Google account" });
    }

    const emailName = email.split("@")[0];

    let user = await User.findOne({ email });

    if (!user) {
      const generatedUsername = await generateUniqueUsername(emailName);
      user = new User({
        username: generatedUsername,
        email,
        name,
        googleId,
        provider: "google",
        isEmailVerified: true,
      });
    } else {
      user.name = user.name || name;
      user.googleId = user.googleId || googleId;
      user.isEmailVerified = true;
      if (!user.username) {
        user.username = await generateUniqueUsername(emailName);
      }
      if (!user.provider) {
        user.provider = "google";
      }
    }

    await user.save();

    const token = createToken(user);
    return res.json({ token, user });
  } catch (error) {
    console.error("❌ Google login error:", error);
    return res.status(401).json({ error: "Google login failed" });
  }
}

export async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user });
}
