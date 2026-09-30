import { ChatOpenAI } from "@langchain/openai";
import { config }     from "../config/config.js";

const BASE_URL = "https://integrate.api.nvidia.com/v1";

// M1 — simple folder classification, fast
export const M1Model = new ChatOpenAI({
  model:         "nvidia/nemotron-3-nano-30b-a3b",
  temperature:   0,
  apiKey:        config.NVIDIA_API_KEY,
  configuration: { baseURL: BASE_URL },
});

// M2 — entry point + execution flow reasoning
export const M2Model = new ChatOpenAI({
  model:         "nvidia/nemotron-3-super-120b-a12b",
  temperature:   0,
  apiKey:        config.NVIDIA_API_KEY,
  configuration: { baseURL: BASE_URL },
});

// M3 — dependency graph, structured JSON output — Nemotron best for this
export const M3Model = new ChatOpenAI({
  model:         "nvidia/nemotron-3-super-120b-a12b",
  temperature:   0,
  apiKey:        config.NVIDIA_API_KEY,
  configuration: { baseURL: BASE_URL },
});
