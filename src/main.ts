import { NestFactory } from '@nestjs/core';
import { Request, Response, NextFunction } from 'express';
import * as morgan from 'morgan';

import { AppModule } from './app.module';
import { config } from './config/config';
import { logInfoMessage } from './utils/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Middleware to handle AWS SNS messages
  // AWS SNS sends JSON with Content-Type: text/plain, so we override it to application/json
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (req.headers['x-amz-sns-message-type']) {
      req.headers['content-type'] = 'application/json;charset=UTF-8';
    }
    next();
  });

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
