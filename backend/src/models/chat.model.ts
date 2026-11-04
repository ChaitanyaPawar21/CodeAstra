
import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  sessionId: string;
  questions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    userName: {
      type: String,
      required: true,
      trim: true,
    },

    sessionId: {
      type: String,
      required: true,
      unique: true,
    },

    questions: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "chats",
  }
);

const Chat = mongoose.model<IChat>("Chat", chatSchema);

export default Chat;
