import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import * as Joi from 'joi';
import { join } from 'path';
import configuration from 'config/configuration';
import { User } from './users/entities/users.entity';

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
            // autoSchemaFile: true,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            // formatError: (error) => {
            //     console.dir('error Message: ' + error.message, { depth: null });
            //     return error;
            // },
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            envFilePath:
                process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.prod',
            ignoreEnvFile: process.env.NODE_ENV === 'prod',
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
                PORT: Joi.number(),
                DATABASE_HOST: Joi.string().required(),
                DATABASE_PORT: Joi.number(),
                DATABASE_USERNAME: Joi.string().required(),
                DATABASE_PASSWORD: Joi.string().required(),
                DATABASE_NAME: Joi.string().required(),
            }),
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get('database.host'),
                port: configService.get('database.port'),
                username: configService.get('database.username'),
                password: configService.get('database.password'),
                database: configService.get('database.name'),
                entities: [User], //autoLoadEntities
                synchronize: process.env.NODE_ENV !== 'prod',
            }),
            inject: [ConfigService],
        }),
        UsersModule,
        CommonModule,
    ],
})
export class AppModule {}
