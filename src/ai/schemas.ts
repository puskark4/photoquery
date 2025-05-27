
/**
 * @fileOverview Defines Zod schemas for AI flows, shared between flow definitions and server actions.
 */
import {z} from 'genkit';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

const languageCodes = SUPPORTED_LANGUAGES.map(lang => lang.code) as [string, ...string[]]; // Type assertion for Zod enum

// Schemas for AnalyzePhoto flow
export const AnalyzePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  question: z.string().describe('The question to ask about the photo.'),
  userApiKey: z.string().optional().describe('User-provided API key for dynamic AI client initialization.'),
  language: z.enum(languageCodes).default('en').optional().describe('The language for the AI response (e.g., "en", "ne"). Defaults to "en".'),
});
export type AnalyzePhotoInput = z.infer<typeof AnalyzePhotoInputSchema>;

export const AnalyzePhotoOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the photo.'),
});
export type AnalyzePhotoOutput = z.infer<typeof AnalyzePhotoOutputSchema>;


// Schemas for EnhanceQuery flow
export const EnhanceQueryInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  query: z.string().describe('The user query about the photo.'),
  retryCount: z.number().default(0).describe('The number of times the query has been retried.'),
  previousResponse: z.string().optional().describe('The previous response from the AI.'),
  userApiKey: z.string().optional().describe('User-provided API key for dynamic AI client initialization.'),
  language: z.enum(languageCodes).default('en').optional().describe('The language for the AI response (e.g., "en", "ne"). Defaults to "en".'),
});
export type EnhanceQueryInput = z.infer<typeof EnhanceQueryInputSchema>;

export const EnhanceQueryOutputSchema = z.object({
  enhancedResponse: z.string().describe('The enhanced response to the query.'),
  retryCount: z.number().describe('The number of times the query has been retried.'),
});
export type EnhanceQueryOutput = z.infer<typeof EnhanceQueryOutputSchema>;
