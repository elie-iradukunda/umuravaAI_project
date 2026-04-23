import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, trim: true },
    roleId: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    talentProfile: { type: Schema.Types.Mixed, default: null },
    talentProfileUpdatedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const UserModel = models.User ?? model("User", userSchema);
