
"use server";

import { genkit, z } from 'genkit'; // Modified import
import { googleAI, type SafetySettings } from '@genkit-ai/googleai';
import { DEFAULT_AI_MODEL, SUPPORTED_LANGUAGES } from '@/lib/constants';

import {
  type AnalyzePhotoInput,
  type AnalyzePhotoOutput,
  AnalyzePhotoInputSchema,
  AnalyzePhotoOutputSchema
} from "@/ai/schemas";

import {
  type EnhanceQueryInput,
  type EnhanceQueryOutput,
  EnhanceQueryInputSchema,
  EnhanceQueryOutputSchema
} from "@/ai/schemas";


// Define templates and safety settings directly in actions.ts
const ANALYZE_PHOTO_PROMPT_TEMPLATE = `You are an AI expert in analyzing photos. A user has provided a photo and is asking a question about it. You must answer their question accurately and concisely.
Please provide your answer in {{language_name}}.

Here is the photo:
{{media url=photoDataUri}}

Here is the question:
{{question}}
`;
const ANALYZE_PHOTO_SAFETY_SETTINGS: SafetySettings[] = [
  // Add specific safety settings if needed, otherwise an empty array or undefined
];


const ENHANCE_QUERY_PROMPT_TEMPLATE = `You are an AI assistant that analyzes images and answers user queries.
The user has provided a photo and a question about it. Your goal is to provide an accurate and contextually relevant answer.
Please provide your answer in {{language_name}}.

Photo: {{media url=photoDataUri}}
Query: {{{query}}}

{{#if previousResponse}}
The previous response was: {{{previousResponse}}}
This response was not accurate or relevant. Please try again with a different approach.
Consider the previous response and identify potential issues such as hallucination or lack of context. Rephrase the query or adjust your reasoning to address these issues.
{{/if}}

Response:
`;
const ENHANCE_QUERY_SAFETY_SETTINGS: SafetySettings[] = [
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_ONLY_HIGH',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_NONE',
  },
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_LOW_AND_ABOVE',
  },
];


interface AnalyzePhotoActionResult extends Partial<AnalyzePhotoOutput> {
  error?: string;
}

export async function handleAnalyzePhotoAction(
  input: AnalyzePhotoInput
): Promise<AnalyzePhotoActionResult> {
  try {
    if (input.userApiKey) {
      const dynamicAI = genkit({
        plugins: [googleAI({ apiKey: input.userApiKey })],
        model: DEFAULT_AI_MODEL
      });

      const templateInputSchema = AnalyzePhotoInputSchema.omit({ userApiKey: true, language: true }); // Schema for template variables

      const languageCode = input.language || 'en';
      const languageObj = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || SUPPORTED_LANGUAGES[0];
      const languageName = languageObj.name;

      const promptInput = {
        photoDataUri: input.photoDataUri,
        question: input.question,
        language_name: languageName, // Pass the full language name for the template
      };

      const dynamicPromptRunner = dynamicAI.definePrompt({
          name: 'dynamicAnalyzePhotoPrompt',
          input: { schema: templateInputSchema.extend({ language_name: z.string() }) }, // Changed genkit.z.string() to z.string()
          output: { schema: AnalyzePhotoOutputSchema },
          prompt: ANALYZE_PHOTO_PROMPT_TEMPLATE,
          config: {
            safetySettings: ANALYZE_PHOTO_SAFETY_SETTINGS.length > 0 ? ANALYZE_PHOTO_SAFETY_SETTINGS : undefined
          }
      });

      // @ts-ignore  We know promptInput matches the extended schema implicitly
      const { output } = await dynamicPromptRunner(promptInput);
      if (!output) {
        return { error: "AI returned no response using user-provided key." };
      }
      return output;

    } else {
      // This case should ideally not be hit if UI forces API key input
      return { error: "API Key not provided by the client." };
    }
  } catch (error) {
    console.error("Error in handleAnalyzePhotoAction:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred during AI analysis." };
  }
}


interface EnhanceQueryActionResult extends Partial<EnhanceQueryOutput> {
  error?: string;
}

export async function handleEnhanceQueryAction(
  input: EnhanceQueryInput
): Promise<EnhanceQueryActionResult> {
  try {
    if (input.userApiKey) {
      const dynamicAI = genkit({
        plugins: [googleAI({ apiKey: input.userApiKey })],
        model: DEFAULT_AI_MODEL
      });

      const templateInputSchema = EnhanceQueryInputSchema.omit({ userApiKey: true, language: true }); // Schema for template variables

      const languageCode = input.language || 'en';
      const languageObj = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode) || SUPPORTED_LANGUAGES[0];
      const languageName = languageObj.name;

      const promptInput = {
        photoDataUri: input.photoDataUri,
        query: input.query,
        previousResponse: input.previousResponse,
        retryCount: input.retryCount,
        language_name: languageName, // Pass the full language name for the template
      };

      const dynamicPromptRunner = dynamicAI.definePrompt({
        name: 'dynamicEnhanceQueryPrompt',
        input: { schema: templateInputSchema.extend({ language_name: z.string() }) }, // Changed genkit.z.string() to z.string()
        output: { schema: EnhanceQueryOutputSchema },
        prompt: ENHANCE_QUERY_PROMPT_TEMPLATE,
        config: {
          safetySettings: ENHANCE_QUERY_SAFETY_SETTINGS
        }
      });

      // @ts-ignore We know promptInput matches the extended schema implicitly
      const { output } = await dynamicPromptRunner(promptInput);
       if (!output) {
        return { error: "AI returned no enhanced response using user-provided key." };
      }
      return output;

    } else {
      // This case should ideally not be hit if UI forces API key input
      return { error: "API Key not provided by the client for enhancing query." };
    }
  } catch (error) {
    console.error("Error in handleEnhanceQueryAction:", error);
    return { error: error instanceof Error ? error.message : "An unknown error occurred while enhancing the query." };
  }
}
