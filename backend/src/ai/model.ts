import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { config } from "../config/config.js"

export const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    temperature: 0,
    apiKey: config.GOOGLE_API_KEY,
})

export default geminiModel;