import { Config } from '@/constants/Config';

export interface AIAnalysisResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  is_beverage: boolean;
  beverage_volume: number;
}

export class FoodService {
  private static instance: FoodService;
  private backendUrl = Config.api.backendUrl;

  private constructor() {}

  /**
   * Retrieves the singleton instance of the FoodService.
   */
  public static getInstance(): FoodService {
    if (!FoodService.instance) {
      FoodService.instance = new FoodService();
    }
    return FoodService.instance;
  }

  /**
   * Sends image file as a multipart request to the NestJS backend for Gemini AI food analysis.
   * @param imageUri The local file uri of the selected image
   * @param mimeType The file mime type (e.g. image/jpeg, image/png)
   */
  public async analyzeFoodPhoto(imageUri: string, mimeType: string): Promise<AIAnalysisResult> {
    try {
      const formData = new FormData();
      
      // Determine file name from URI
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      
      formData.append('file', {
        uri: imageUri,
        name: filename,
        type: mimeType,
      } as any);

      const response = await fetch(`${this.backendUrl}/ai/analyze-food`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || `Código de respuesta API: ${response.status}`);
      }

      return json.data as AIAnalysisResult;
    } catch (error: any) {
      console.error('Error querying backend food scan API:', error);
      throw error;
    }
  }

  /**
   * Requests an AI recommendation plan based on user metrics
   */
  public async recommendPlan(dto: {
    age: number;
    height: number;
    weightGoal: number;
    trainingDaysPerWeek?: number | null;
    trainingDurationPerSession?: string | null;
    goalsDescription?: string | null;
    weightHistory?: { weight: number; loggedAt: string }[] | null;
  }): Promise<{
    daily_calorie_goal: number;
    daily_protein_goal: number;
    daily_carbs_goal: number;
    daily_fat_goal: number;
    daily_water_goal: number;
    daily_sugar_limit: number;
    justification: string;
  }> {
    try {
      const response = await fetch(`${this.backendUrl}/ai/recommend-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dto),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.message || `Código de respuesta API: ${response.status}`);
      }

      return json.data;
    } catch (error: any) {
      console.error('Error querying backend recommendation API:', error);
      throw error;
    }
  }
}
