import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AllExceptionsFilter } from './utils/http-exception.filter';
import * as dotenv from 'dotenv';
import * as path from 'path';

async function bootstrap() {
  // Load .env from root directory of backend
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
  
  const app = await NestFactory.create(AppModule);
  
  // Set payload limits for processing large base64 food images
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  
  // Register global exceptions filter for standardised responses
  app.useGlobalFilters(new AllExceptionsFilter());
  
  // Enable CORS so our mobile application can communicate with it
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  // Set global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces for mobile testing
  console.log(`FitFood backend is running on: http://localhost:${port}`);
}
bootstrap();
