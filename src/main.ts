import { NestFactory } from '@nestjs/core';
import { CrudConfigService } from '@dataui/crud';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

CrudConfigService.load({
  query: {
    alwaysPaginate: true,
    maxLimit: 100,
    limit: 25,
    cache: 2000,
  },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
  },
  routes: {
    updateOneBase: {
      allowParamsOverride: true,
    },
    deleteOneBase: {
      returnDeleted: true,
    },
  },
});

import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.setGlobalPrefix('api/v1')
  const config = new DocumentBuilder()
    .setTitle('Service Routing API')
    .setDescription('API de roteirização de serviços técnicos')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
