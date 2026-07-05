import { IsNumber, IsString, IsOptional, Min, IsArray } from 'class-validator';

export class RecommendPlanDto {
  @IsNumber()
  @Min(0)
  age: number;

  @IsNumber()
  @Min(0)
  height: number;

  @IsNumber()
  @Min(0)
  weightGoal: number;

  @IsOptional()
  @IsNumber()
  trainingDaysPerWeek?: number;

  @IsOptional()
  @IsString()
  trainingDurationPerSession?: string;

  @IsOptional()
  @IsString()
  goalsDescription?: string;

  @IsOptional()
  @IsArray()
  weightHistory?: { weight: number; loggedAt: string }[];
}
