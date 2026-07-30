import dotenv from "dotenv";
dotenv.config();

if (!process.env.PORT) {
  throw new Error("PORT is not defined in environment variables");
}

if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is not defined in environment variables");
}

if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is not defined in environment variables");
}

if(!process.env.GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY is not defined in environment variables")
}

export const config = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
}