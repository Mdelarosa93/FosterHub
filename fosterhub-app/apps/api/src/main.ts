import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);

      const allowed = [
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ];

      const isVercelPreview = origin.endsWith('.vercel.app');
      const isFosterHubDomain = origin.includes('fosterhub.biz');

      if (allowed.includes(origin) || isVercelPreview || isFosterHubDomain) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 4000);
}

bootstrap();
