import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, default: null },
    googleId: { type: String, default: null, sparse: true, unique: true },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isEmailVerified: { type: Boolean, default: false },
    verificationCodeHash: { type: String, default: null },
    verificationCodeExpiresAt: { type: Date, default: null },
    verificationCodeSentAt: { type: Date, default: null },
    verificationCodeSendCount: { type: Number, default: 0 },
    verificationCodeWindowStart: { type: Date, default: null },
    verificationAttemptCount: { type: Number, default: 0 },
    verificationAttemptWindowStart: { type: Date, default: null },
    verificationLockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

UserSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.verificationCodeHash;
    delete ret.verificationCodeExpiresAt;
    delete ret.verificationCodeSentAt;
    delete ret.verificationCodeSendCount;
    delete ret.verificationCodeWindowStart;
    delete ret.verificationAttemptCount;
    delete ret.verificationAttemptWindowStart;
    delete ret.verificationLockedUntil;
    return ret;
  },
});

UserSchema.set("toObject", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.verificationCodeHash;
    delete ret.verificationCodeExpiresAt;
    delete ret.verificationCodeSentAt;
    delete ret.verificationCodeSendCount;
    delete ret.verificationCodeWindowStart;
    delete ret.verificationAttemptCount;
    delete ret.verificationAttemptWindowStart;
    delete ret.verificationLockedUntil;
    return ret;
  },
});

export default mongoose.model("User", UserSchema);
