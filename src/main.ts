import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = app.get(ConfigService).get('service.port');
    const serviceUrl = app.get(ConfigService).get('service.url');
    // app.enableCors({ origin: serviceUrl });
    app.enableCors();
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(port);
}
bootstrap();
