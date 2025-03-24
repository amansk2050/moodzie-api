import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import * as csurf from 'csurf';
import * as xssClean from 'xss-clean';
import * as hpp from 'hpp';
import { AppModule } from './app.module';
/**
 * function for bootstraping the nest application
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('/api/v1');
  app.enableCors({
    origin: 'http://localhost:8081',
    credentials: true,
  });
  app.use(cookieParser());
  app.use(compression());
  app.use(
    csurf({
      cookie: { httpOnly: true, secure: true },
      ignoreMethods: [
        'GET',
        'HEAD',
        'OPTIONS',
        'POST',
        'PUT',
        'DELETE',
        'PATCH',
      ],
    }),
  );
  app.use(
    helmet({
      hsts: {
        includeSubDomains: true,
        preload: true,
        maxAge: 63072000,
      },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: [
            "'self'",
            // "data:",
            // "blob:",
            'https://polyfill.io',
            'https://*.cloudflare.com',
            'http://127.0.0.1:3000/',
            // "ws:",
          ],
          baseUri: ["'self'"],
          scriptSrc: [
            "'self'",
            'http://127.0.0.1:3000/',
            'https://*.cloudflare.com',
            'https://polyfill.io',
            // "http:",
            // "data:",
          ],
          styleSrc: ["'self'", 'https:', 'http:', "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          childSrc: ["'self'", 'blob:'],
          styleSrcAttr: ["'self'", "'unsafe-inline'", 'http:'],
          frameSrc: ["'self'"],
        },
      },
    }),
  );
  app.use(xssClean());
  app.use(hpp());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // NOTE: Setup Swagger docs
  if (['dev', 'staging', 'uat'].includes(process.env.STAGE)) {
    const config = new DocumentBuilder()
      .addBearerAuth()
      .addOAuth2()
      .setTitle('Moodzie')
      .setDescription(
        'Moodzie is a mood tracking application that allows users to track their moods',
      )
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      ignoreGlobalPrefix: false,
    });
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, () => {
    console.log('Server started on port: ' + port);
  });
}
bootstrap();
