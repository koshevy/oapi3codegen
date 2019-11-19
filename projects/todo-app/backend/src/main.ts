import * as session from 'express-session';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(session({
      resave: true,
      saveUninitialized: true,
      secret: 'S2D0MK1DV',
      cookie: {
          credentials: true,
          secure: false,
          maxAge: 600000,
      },
  }));
  app.enableCors({
      allowedHeaders: '*',
      credentials: true,
      maxAge: 600000,
      methods: ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'],
  });
  await app.listen(3000);
}
bootstrap();
