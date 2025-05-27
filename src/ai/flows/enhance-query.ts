
'use server';

/**
 * @fileOverview Implements a Genkit flow to enhance query accuracy by retrying with different prompt wordings.
 *
 * - enhanceQuery - A function that enhances the query for accuracy.
 * - EnhanceQueryInput (type) - The input type for the enhanceQuery function.
 * - EnhanceQueryOutput (type) - The return type for the enhanceQuery function.
 */

import {ai} from '@/ai/genkit';
import { EnhanceQueryInputSchema, EnhanceQueryOutputSchema, type EnhanceQueryInput as EnhanceQueryInputType, type EnhanceQueryOutput as EnhanceQueryOutputType } from '@/ai/schemas';


// Export TypeScript types
export type EnhanceQueryInput = EnhanceQueryInputType;
export type EnhanceQueryOutput = EnhanceQueryOutputType;


const ENHANCE_QUERY_SAFETY_SETTINGS_FOR_GLOBAL_KEY = [
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


export async function enhanceQuery(input: Omit<EnhanceQueryInput, 'userApiKey' | 'language'>): Promise<EnhanceQueryOutput> {
  const ENHANCE_QUERY_PROMPT_TEMPLATE_FOR_GLOBAL_KEY = `You are an AI assistant that analyzes images and answers user queries.
The user has provided a photo and a question about it. Your goal is to provide an accurate and contextually relevant answer.
Please provide your answer in English.

Photo: {{media url=photoDataUri}}
Query: {{{query}}}

{{#if previousResponse}}
The previous response was: {{{previousResponse}}}
This response was not accurate or relevant. Please try again with a different approach.
Consider the previous response and identify potential issues such as hallucination or lack of context. Rephrase the query or adjust your reasoning to address these issues.
{{/if}}

Response:
`;
  const promptWithGlobalKey = ai.definePrompt({
    name: 'enhanceQueryPromptGlobalKey',
    input: {schema: EnhanceQueryInputSchema.omit({ userApiKey: true, language: true })},
    output: {schema: EnhanceQueryOutputSchema},
    prompt: ENHANCE_QUERY_PROMPT_TEMPLATE_FOR_GLOBAL_KEY,
    config: {
      safetySettings: ENHANCE_QUERY_SAFETY_SETTINGS_FOR_GLOBAL_KEY,
    },
  });
  
  const {retryCount = 0} = input;
  if (retryCount > 3) {
    return {
      enhancedResponse: 'Failed to get a reliable response after multiple retries.',
      retryCount,
    };
  }
  const {output} = await promptWithGlobalKey(input);
  if (!output) {
      return {
          enhancedResponse: 'AI returned no response.',
          retryCount: retryCount +1,
      }
  }
  return {
    enhancedResponse: output.enhancedResponse,
    retryCount: retryCount + 1,
  };
}


const enhanceQueryFlow = ai.defineFlow(
  {
    name: 'enhanceQueryFlow',
    inputSchema: EnhanceQueryInputSchema.omit({ userApiKey: true, language: true }),
    outputSchema: EnhanceQueryOutputSchema,
  },
  async input => {
    const {retryCount = 0} = input;

    if (retryCount > 3) {
      return {
        enhancedResponse: 'Failed to get a reliable response after multiple retries.',
        retryCount,
      };
    }
    
    const ENHANCE_QUERY_PROMPT_TEMPLATE_FLOW_INTERNAL = `You are an AI assistant that analyzes images and answers user queries.
The user has provided a photo and a question about it. Your goal is to provide an accurate and contextually relevant answer.
Please provide your answer in English.

Photo: {{media url=photoDataUri}}
Query: {{{query}}}

{{#if previousResponse}}
The previous response was: {{{previousResponse}}}
This response was not accurate or relevant. Please try again with a different approach.
Consider the previous response and identify potential issues such as hallucination or lack of context. Rephrase the query or adjust your reasoning to address these issues.
{{/if}}

Response:
`;
    const prompt = ai.definePrompt({
        name: 'enhanceQueryPromptInFlow',
        input: {schema: EnhanceQueryInputSchema.omit({ userApiKey: true, language: true })},
        output: {schema: EnhanceQueryOutputSchema},
        prompt: ENHANCE_QUERY_PROMPT_TEMPLATE_FLOW_INTERNAL,
        config: {
            safetySettings: ENHANCE_QUERY_SAFETY_SETTINGS_FOR_GLOBAL_KEY, 
        },
    });


    const {output} = await prompt(input);

    if (!output) {
        return {
            enhancedResponse: 'AI returned no response.',
            retryCount: retryCount +1,
        }
    }

    return {
      enhancedResponse: output.enhancedResponse,
      retryCount: retryCount + 1,
    };
  }
);
