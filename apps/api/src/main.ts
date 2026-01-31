import { config } from 'dotenv';
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          return `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`;
        });
        return new BadRequestException(messages);
      },
    }),
  );
  await app.listen(process.env.PORT || 4000);
}
bootstrap();
