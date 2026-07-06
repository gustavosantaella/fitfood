import { Controller, Post, UseInterceptors, UploadedFile, HttpCode, HttpStatus, HttpException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { ApiResponse } from '../utils/api-response';
import { RecommendPlanDto } from './dto/recommend-plan.dto';
import { RecommendRoutineDto } from './dto/recommend-routine.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze-food')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async analyzeFood(@UploadedFile() file: any) {
    if (!file) {
      throw new HttpException('No se proporcionó ningún archivo de imagen en la petición.', HttpStatus.BAD_REQUEST);
    }

    const base64Data = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';

    const result = await this.aiService.analyzeFood(base64Data, mimeType);

    return ApiResponse.success('Análisis de comida completado con éxito con Gemini SDK', result);
  }

  @Post('recommend-plan')
  @HttpCode(HttpStatus.OK)
  async recommendPlan(@Body() recommendPlanDto: RecommendPlanDto) {
    const result = await this.aiService.recommendPlan(recommendPlanDto);
    return ApiResponse.success('Plan de metas recomendado con éxito por la IA', result);
  }

  @Post('recommend-routine')
  @HttpCode(HttpStatus.OK)
  async recommendRoutine(@Body() recommendRoutineDto: RecommendRoutineDto) {
    const result = await this.aiService.recommendRoutine(recommendRoutineDto);
    return ApiResponse.success('Rutina de entrenamiento generada con éxito por la IA', result);
  }
}

