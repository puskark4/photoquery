
// src/ai/flows/analyze-photo.ts
'use server';
/**
 * @fileOverview An AI agent that analyzes a photo and answers questions about it.
 *
 * - analyzePhoto - A function that handles the photo analysis process.
 * - AnalyzePhotoInput (type) - The input type for the analyzePhoto function.
 * - AnalyzePhotoOutput (type) - The return type for the analyzePhoto function.
 */

import {ai} from '@/ai/genkit';
import { AnalyzePhotoInputSchema, AnalyzePhotoOutputSchema, type AnalyzePhotoInput as AnalyzePhotoInputType, type AnalyzePhotoOutput as AnalyzePhotoOutputType } from '@/ai/schemas';

// Export TypeScript types
export type AnalyzePhotoInput = AnalyzePhotoInputType;
export type AnalyzePhotoOutput = AnalyzePhotoOutputType;


export async function analyzePhoto(input: Omit<AnalyzePhotoInput, 'userApiKey' | 'language'>): Promise<AnalyzePhotoOutput> {
  // This function now assumes the global 'ai' instance is configured correctly (e.g. via .env.local)
  // For user-provided API keys or language, the logic will be in actions.ts
  
  const ANALYZE_PHOTO_PROMPT_TEMPLATE_FOR_GLOBAL_KEY = `You are an AI expert in analyzing photos. A user has provided a photo and is asking a question about it. You must answer their question accurately and concisely.
Please provide your answer in English.

Here is the photo:
{{media url=photoDataUri}}

Here is the question:
{{question}}
`;

  const analyzePhotoPromptWithGlobalKey = ai.definePrompt({
    name: 'analyzePhotoPromptGlobalKey',
    input: {schema: AnalyzePhotoInputSchema.omit({ userApiKey: true, language: true })},
    output: {schema: AnalyzePhotoOutputSchema},
    prompt: ANALYZE_PHOTO_PROMPT_TEMPLATE_FOR_GLOBAL_KEY,
  });
  
  const {output} = await analyzePhotoPromptWithGlobalKey(input);
  return output!;
}


const analyzePhotoFlow = ai.defineFlow(
  {
    name: 'analyzePhotoFlow',
    inputSchema: AnalyzePhotoInputSchema.omit({ userApiKey: true, language: true }),
    outputSchema: AnalyzePhotoOutputSchema,
  },
  async (input) => {
    const ANALYZE_PHOTO_PROMPT_TEMPLATE_FLOW_INTERNAL = `You are an AI expert in analyzing photos. A user has provided a photo and is asking a question about it. You must answer their question accurately and concisely.
Please provide your answer in English.

Here is the photo:
{{media url=photoDataUri}}

Here is the question:
{{question}}
`;
    const analyzePhotoPrompt = ai.definePrompt({
        name: 'analyzePhotoPromptInFlow',
        input: {schema: AnalyzePhotoInputSchema.omit({ userApiKey: true, language: true })},
        output: {schema: AnalyzePhotoOutputSchema},
        prompt: ANALYZE_PHOTO_PROMPT_TEMPLATE_FLOW_INTERNAL,
    });

    const {output} = await analyzePhotoPrompt(input);
    return output!;
  }
);
