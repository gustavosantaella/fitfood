import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

export interface FoodAnalysisResult {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  is_beverage: boolean;
  beverage_volume: number;
}

export interface PlanRecommendation {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
  daily_water_goal: number;
  daily_sugar_limit: number;
  justification: string;
}

@Injectable()
export class AiService {
  private getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new HttpException(
        'La API Key de Gemini (GEMINI_API_KEY) no está configurada en las variables de entorno del servidor.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return apiKey.replace(/['"]/g, '').trim(); // Strip any single or double quotes
  }

  async analyzeFood(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<FoodAnalysisResult> {
    const apiKey = this.getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
      Analiza detalladamente la foto del plato de comida adjunto. 
      Identifica el alimento o preparación, y realiza una estimación lo más realista y precisa posible de sus macronutrientes y calorías totales.
      Debes retornar obligatoriamente el resultado de acuerdo con el esquema JSON suministrado:
      - food_name: Nombre comercial o descriptivo del plato (ej: 'Pechuga de pollo con arroz y brócoli').
      - calories: Total estimado de calorías en kilocalorías (kcal) (ej: 450).
      - protein: Total estimado de proteínas en gramos (g) (ej: 35).
      - carbs: Total estimado de carbohidratos en gramos (g) (ej: 40).
      - fat: Total estimado de grasas en gramos (g) (ej: 12).
      - description: Una breve explicación de 1 o 2 frases que resuma los ingredientes detectados y la base del cálculo (ej: 'Se observa una porción de pechuga a la plancha de aprox. 150g, una taza de arroz blanco cocido y brócoli al vapor sin aderezos grasos').
      - is_beverage: true si el elemento principal analizado es una bebida líquida (ej: jugo, agua, refresco, café, té, cerveza, etc.), false en caso contrario.
      - beverage_volume: Volumen estimado de la bebida en mililitros (ml) (ej: 250, 330, 500, o 0 si no es una bebida).
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64,
            },
          },
          promptText,
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              food_name: { type: 'string' },
              calories: { type: 'integer' },
              protein: { type: 'number' },
              carbs: { type: 'number' },
              fat: { type: 'number' },
              description: { type: 'string' },
              is_beverage: { type: 'boolean' },
              beverage_volume: { type: 'integer' },
            },
            required: ['food_name', 'calories', 'protein', 'carbs', 'fat', 'description', 'is_beverage', 'beverage_volume'],
          },
        },
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new HttpException(
          'La API de Gemini no retornó una respuesta válida para la imagen.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const parsedResult: FoodAnalysisResult = JSON.parse(jsonText);

      return {
        food_name: parsedResult.food_name || 'Alimento desconocido',
        calories: Number(parsedResult.calories) || 0,
        protein: Number(parsedResult.protein) || 0,
        carbs: Number(parsedResult.carbs) || 0,
        fat: Number(parsedResult.fat) || 0,
        description: parsedResult.description || 'Sin descripción disponible',
        is_beverage: !!parsedResult.is_beverage,
        beverage_volume: Number(parsedResult.beverage_volume) || 0,
      };
    } catch (error: any) {
      console.error('Error in AiService calling Gemini SDK:', error.message || error);
      throw new HttpException(
        `Error al procesar la imagen con Gemini SDK: ${error.message || 'Error desconocido'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async recommendPlan(dto: any): Promise<PlanRecommendation> {
    const apiKey = this.getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const weightHistoryStr = dto.weightHistory && dto.weightHistory.length > 0
      ? dto.weightHistory.map((h: any) => `${h.weight} kg en fecha ${h.logged_at}`).join(', ')
      : 'Sin registros históricos';

    const promptText = `
      Basándote en los siguientes datos del usuario:
      - Edad: ${dto.age} años.
      - Estatura: ${dto.height} cm.
      - Peso Objetivo: ${dto.weightGoal} kg.
      - Días de entrenamiento a la semana: ${dto.trainingDaysPerWeek || 'No especificado'}.
      - Duración promedio por entrenamiento: ${dto.trainingDurationPerSession || 'No especificado'}.
      - Metas/Descripción de lo que quiere alcanzar (escrito por el usuario): "${dto.goalsDescription || 'No especificada'}"
      - Historial de peso reciente (para evaluar la tendencia): ${weightHistoryStr}

      Realiza los cálculos metabólicos necesarios y determina las metas diarias idóneas para el usuario para iniciar o ajustar con éxito su plan nutricional.
      Analiza de forma inteligente si la tendencia de peso es al alza o a la baja y adecúa el consumo calórico y de macronutrientes en base al objetivo escrito por el usuario (ej: si escribe que quiere ganar fuerza, incrementa ligeramente la proteína y calorías; si busca definición estricta, reduce grasas/carbohidratos; etc.).
      Debes retornar obligatoriamente el resultado de acuerdo con el esquema JSON suministrado:
      - daily_calorie_goal: Límite óptimo de calorías diarias (kcal).
      - daily_protein_goal: Meta diaria de proteínas en gramos (g).
      - daily_carbs_goal: Meta diaria de carbohidratos en gramos (g).
      - daily_fat_goal: Meta diaria de grasas en gramos (g).
      - daily_water_goal: Consumo diario sugerido de agua en mililitros (ml) (ej: 2500).
      - daily_sugar_limit: Límite diario recomendado de azúcar refinado en gramos (g).
      - justification: Una explicación breve (2-3 frases) explicando la fórmula o razones científicas aplicadas, haciendo mención explícita a sus objetivos o tendencia histórica (ej: 'Dado que buscas definición muscular y entrenas 4 días, se estableció un déficit calórico moderado de 1800 kcal con 140g de proteína...').
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              daily_calorie_goal: { type: 'integer' },
              daily_protein_goal: { type: 'integer' },
              daily_carbs_goal: { type: 'integer' },
              daily_fat_goal: { type: 'integer' },
              daily_water_goal: { type: 'integer' },
              daily_sugar_limit: { type: 'integer' },
              justification: { type: 'string' },
            },
            required: [
              'daily_calorie_goal',
              'daily_protein_goal',
              'daily_carbs_goal',
              'daily_fat_goal',
              'daily_water_goal',
              'daily_sugar_limit',
              'justification',
            ],
          },
        },
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new HttpException(
          'La API de Gemini no retornó una respuesta válida para la recomendación.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const parsedResult: PlanRecommendation = JSON.parse(jsonText);
      console.log('Gemini recommendation raw JSON:', jsonText);
      console.log('Gemini recommendation parsed:', parsedResult);

      return {
        daily_calorie_goal: Math.round(Number(parsedResult.daily_calorie_goal)) || 2000,
        daily_protein_goal: Math.round(Number(parsedResult.daily_protein_goal)) || 130,
        daily_carbs_goal: Math.round(Number(parsedResult.daily_carbs_goal)) || 220,
        daily_fat_goal: Math.round(Number(parsedResult.daily_fat_goal)) || 65,
        daily_water_goal: Math.round(Number(parsedResult.daily_water_goal)) || 2000,
        daily_sugar_limit: Math.round(Number(parsedResult.daily_sugar_limit)) || 50,
        justification: parsedResult.justification || 'Sin justificación disponible',
      };
    } catch (error: any) {
      console.error('Error in AiService calling Gemini for recommendations:', error.message || error);
      throw new HttpException(
        `Error al calcular plan con Gemini: ${error.message || 'Error desconocido'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async recommendRoutine(dto: any): Promise<any> {
    const apiKey = this.getApiKey();
    const ai = new GoogleGenAI({ apiKey });

    const promptText = `
      Eres un entrenador personal certificado experto en diseño de rutinas.
      Basándote en los siguientes datos del usuario:
      - Edad: ${dto.age} años.
      - Estatura: ${dto.height} cm.
      - Peso Objetivo: ${dto.weightGoal} kg.
      - Días de entrenamiento a la semana: ${dto.trainingDaysPerWeek || 'No especificado (asume 4 días)'}.
      - Duración promedio por sesión: ${dto.trainingDurationPerSession || 'No especificada (asume 1 hora)'}.
      - Metas/Objetivos del usuario: "${dto.goalsDescription || 'Mantenimiento general y ganancia de fuerza'}"
      - Equipamiento disponible: ${dto.availableEquipment && dto.availableEquipment.length > 0 ? dto.availableEquipment.join(', ') : 'Gym completo con todos los equipos'}

      Diseña una rutina de entrenamiento semanal personalizada y óptima.
      
      REGLAS:
      1. Cada día debe enfocarse en grupos musculares específicos con una distribución inteligente (push/pull/legs, upper/lower, o similar).
      2. Incluye entre 4-6 ejercicios por día.
      3. Para cada ejercicio, recomienda sets y reps apropiados según el objetivo (fuerza: 3-5x3-6, hipertrofia: 3-4x8-12, resistencia: 2-3x15-20).
      4. Los nombres de ejercicios DEBEN estar en español y ser de la siguiente lista cuando sea posible:
         Pecho: Press Banca, Press Inclinado, Press Declinado, Press Mancuernas Plano, Press Mancuernas Inclinado, Aperturas con Mancuernas, Aperturas en Polea, Fondos en Paralelas, Pec Deck (Máquina), Flexiones de Brazos.
         Espalda: Dominadas, Jalón al Pecho, Remo con Barra, Remo con Mancuerna, Remo en Polea Baja, Remo T-Bar, Peso Muerto, Pullover, Face Pull, Hiperextensiones.
         Piernas: Sentadilla con Barra, Sentadilla Frontal, Sentadilla Búlgara, Prensa de Piernas, Peso Muerto Rumano, Extensión de Cuádriceps, Curl Femoral, Hip Thrust, Zancadas, Elevación de Talones, Sentadilla Hack, Abductores (Máquina), Aductores (Máquina).
         Hombros: Press Militar con Barra, Press con Mancuernas, Elevaciones Laterales, Elevaciones Frontales, Pájaros (Deltoides Posterior), Press Arnold, Remo al Mentón, Encogimientos (Trapecios).
         Brazos: Curl con Barra, Curl con Mancuernas, Curl Martillo, Curl en Banco Scott, Curl en Polea, Extensión de Tríceps en Polea, Press Francés, Fondos para Tríceps, Patada de Tríceps, Curl de Muñecas.
         Core: Crunch Abdominal, Plancha, Plancha Lateral, Russian Twist, Elevación de Piernas, Ab Wheel (Rueda), Mountain Climbers, Cable Crunch, Dead Bug, Hollow Hold.
         Cardio: Caminadora, Bicicleta Estática, Elíptica, Remo (Máquina), Saltar la Cuerda, HIIT, Escaladora.
         Full Body: Burpees, Thrusters, Clean & Press, Snatch con Mancuerna, Kettlebell Swing, Turkish Get Up, Battle Ropes.
      5. El campo muscle_groups DEBE usar exactamente estos IDs: chest, back, legs, shoulders, arms, core, cardio, fullbody.
      6. Incluye una justificación explicando la lógica de la distribución.

      Debes retornar un JSON con el esquema exacto:
      - routine_name: Nombre creativo para la rutina (ej: "Push Pull Legs Avanzado").
      - days: Array de objetos, cada uno con:
        - day_of_week: Día de la semana recomendado (ej: "Lunes", "Miércoles").
        - day_name: Nombre descriptivo (ej: "Push - Pecho y Tríceps").
        - muscle_groups: Array de IDs de grupos musculares (ej: ["chest", "arms"]).
        - exercises: Array de objetos con:
          - name: Nombre del ejercicio (en español).
          - muscle_group: ID del grupo muscular principal.
          - sets: Número recomendado de sets.
          - reps: Número recomendado de reps (string, ej: "8-12", "5", "15-20").
      - estimated_minutes_per_day: Minutos estimados por sesión.
      - justification: Explicación de 2-3 frases de la lógica aplicada.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              routine_name: { type: 'string' },
              days: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day_of_week: { type: 'string' },
                    day_name: { type: 'string' },
                    muscle_groups: { type: 'array', items: { type: 'string' } },
                    exercises: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          muscle_group: { type: 'string' },
                          sets: { type: 'integer' },
                          reps: { type: 'string' },
                        },
                        required: ['name', 'muscle_group', 'sets', 'reps'],
                      },
                    },
                  },
                  required: ['day_of_week', 'day_name', 'muscle_groups', 'exercises'],
                },
              },
              estimated_minutes_per_day: { type: 'integer' },
              justification: { type: 'string' },
            },
            required: ['routine_name', 'days', 'estimated_minutes_per_day', 'justification'],
          },
        },
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new HttpException(
          'La API de Gemini no retornó una respuesta válida para la rutina.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      const parsedResult = JSON.parse(jsonText);
      console.log('Gemini routine recommendation raw JSON:', jsonText);

      return parsedResult;
    } catch (error: any) {
      console.error('Error in AiService calling Gemini for routine:', error.message || error);
      throw new HttpException(
        `Error al generar rutina con Gemini: ${error.message || 'Error desconocido'}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}

