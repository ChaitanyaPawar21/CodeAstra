import mongoose, { Schema, Document } from "mongoose";

export type AuthProvider = "local" | "google";

export interface IUser extends Document {
  name: string;
  email: string;
  /** bcrypt hash. Absent for Google-only accounts. Never selected by default. */
  password?: string;
  googleId?: string;
  provider: AuthProvider;
  /** Tokens issued before this instant are rejected (set when credentials are invalidated). */
  tokensValidAfter?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true, // creates the unique index
      lowercase: true,
      trim: true,
    },
    // select:false → the hash is only loaded when explicitly requested
    // (login). It can therefore never leak through a normal query.
    password: { type: String, required: false, select: false },
    googleId: { type: String, required: false, unique: true, sparse: true },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
      required: true,
    },
    tokensValidAfter: { type: Date, required: false, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      // Defence in depth: strip secrets/internals from any serialised user.
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        delete ret.tokensValidAfter;
        delete ret.__v;
        return ret;
      },
    },
  },
);

const userModel =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);

export default userModel;
