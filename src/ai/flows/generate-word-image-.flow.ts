'use server';
/**
 * @fileOverview A flow for generating an image based on an English word.
 *
 * - generateWordImage - A function that takes an English word and returns a data URI for a generated image.
 * - GenerateWordImageInput - The input type for the generateWordImage function.
 * - GenerateWordImageOutput - The return type for the generateWordImage function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { cache } from 'react';

const GenerateWordImageInputSchema = z.string().describe('An English word to generate an image for.');
export type GenerateWordImageInput = z.infer<typeof GenerateWordImageInputSchema>;

const GenerateWordImageOutputSchema = z.string().describe('A data URI of the generated image.');
export type GenerateWordImageOutput = z.infer<typeof GenerateWordImageOutputSchema>;

export const generateWordImage = cache(
  async (input: GenerateWordImageInput): Promise<GenerateWordImageOutput> => {
    return generateWordImageFlow(input);
  }
);

const generateWordImageFlow = ai.defineFlow(
  {
    name: 'generateWordImageFlow',
    inputSchema: GenerateWordImageInputSchema,
    outputSchema: GenerateWordImageOutputSchema,
  },
  async (prompt) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a photorealistic image of a ${prompt}. The image should be simple, on a clean background, and clearly represent the object.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media.url) {
        throw new Error('Image generation failed to return a data URL.');
    }
    
    return media.url;
  }
);
