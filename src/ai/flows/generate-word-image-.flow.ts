'use server';
/**
 * @fileOverview A flow for generating an image based on an English word.
 *
 * - generateWordImage - A function that takes an English word and returns a data URI for a generated image.
 */
import { ai } from '@/ai/genkit';
import { cache } from 'react';

export const generateWordImage = cache(
  async (word: string): Promise<string> => {
    return generateWordImageFlow(word);
  }
);

const generateWordImageFlow = ai.defineFlow(
  {
    name: 'generateWordImageFlow',
  },
  async (prompt: string) => {
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
