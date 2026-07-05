import { Config } from '@/constants/Config';

export interface AIAnalysisResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Simulates calling Gemini API or another vision model to analyze a food photo.
 * In a real application, you would send the image base64/formdata to a backend endpoint.
 */
export const analyzeFoodPhoto = async (imageUri: string): Promise<AIAnalysisResult> => {
  return new Promise((resolve) => {
    // Simulate a network delay of 3 seconds for the AI computation
    setTimeout(() => {
      // Pick a random mock food item from config
      const items = Config.ai.mockFoods;
      const randomIndex = Math.floor(Math.random() * items.length);
      resolve(items[randomIndex]);
    }, 3000);
  });
};
