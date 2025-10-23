import { NestFactory } from '@nestjs/core';
import * as morgan from 'morgan';

import { AppModule } from './app.module';
import { config } from './config/config';
import { logInfoMessage } from './utils/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Add morgan logging middleware
  app.use(
    morgan(':method :url :status :res[content-length] - :response-time ms', {
      stream: {
        write: message => logInfoMessage(message.replace('\n', '')),
      },
    }),
  );

  await app.listen(config.port);
}

bootstrap();
