import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        cors: { origin: 'http://localhost:3000', credentials: true },
    });
    const port = app.get(ConfigService).get('port');
    app.useGlobalPipes(new ValidationPipe());
    await app.listen(port);
}
bootstrap();
