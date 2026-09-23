import { GoogleGenAI } from "@google/genai";
import { RoastError } from "@/lib/ai/domain";

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    throw new RoastError("GEMINI_API_KEY is required.", "CONFIG_ERROR");
  }

  return new GoogleGenAI({ apiKey: apiKey.trim() });
}
