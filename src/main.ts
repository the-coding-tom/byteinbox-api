import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { API_PATHS } from './common/constants/validation.constant';
import { config } from './config/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(API_PATHS.BASE);

  await app.listen(config.port);
}

bootstrap();
