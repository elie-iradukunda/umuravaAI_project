import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const notificationReadSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, trim: true, index: true },
    notificationId: { type: String, required: true, trim: true },
    readAt: { type: Date, required: true },
  },
  { timestamps: true }
);

notificationReadSchema.index({ userId: 1, notificationId: 1 }, { unique: true });

export const NotificationReadModel =
  models.NotificationRead ?? model("NotificationRead", notificationReadSchema);
