import { config } from "../config/config.js";
import { ChatGroq } from "@langchain/groq";

export const M1Model = new ChatGroq({
  model:       "llama-3.3-70b-versatile",  // fastest, free
  temperature: 0,
  apiKey:      config.GROQ_API_KEY,
})

// m2EntryPoint.node.ts
export const M2Model = new ChatGroq({
  model:       "llama-3.3-70b-versatile",
  temperature: 0,
  apiKey:      config.GROQ_API_KEY,
})

// m3Dependency.node.ts
export const M3Model = new ChatGroq({
  model:       "llama-3.3-70b-versatile",
  temperature: 0,
  apiKey:      config.GROQ_API_KEY,
})