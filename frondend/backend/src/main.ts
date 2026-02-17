import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS - Handle multiple origins properly
  const corsOrigin = configService.get('cors.origin');
  const allowedOrigins = corsOrigin === '*'
    ? '*'
    : corsOrigin.split(',').map((origin: string) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    credentials: configService.get('cors.credentials'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'x-tenant-id'],
  });

  // Validation pipe - with proper error handling
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      // Disable aborting early to get all validation errors
      stopAtFirstError: false,
      // Return detailed validation errors
      disableErrorMessages: false,
      // Handle validation errors gracefully
      exceptionFactory: (errors) => {
        const messages = errors.map((error) => {
          // Get the first constraint message
          const constraints = error.constraints;
          return constraints ? Object.values(constraints)[0] : 'Validation failed';
        });

        // Return BadRequestException with array of error messages
        const { BadRequestException } = require('@nestjs/common');
        return new BadRequestException(messages);
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger setup
  if (configService.get('swagger.enabled')) {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('swagger.title') ?? 'E-Commerce API')
      .setDescription(configService.get<string>('swagger.description') ?? 'White-label multi-tenant e-commerce backend')
      .setVersion(configService.get<string>('swagger.version') ?? '1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Tenant-ID', in: 'header' }, 'X-Tenant-ID')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(configService.get<string>('swagger.path') ?? 'api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    console.log(
      `Swagger documentation available at: http://localhost:${configService.get('port')}/${configService.get('swagger.path')}`,
    );
  }

  const port = configService.get('port');
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
