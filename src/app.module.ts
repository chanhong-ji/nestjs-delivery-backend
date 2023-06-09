import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLFormattedError } from 'graphql';
import { Context } from 'graphql-ws';
import * as Joi from 'joi';
import { join } from 'path';
import configuration from './config/configuration';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { OrdersModule } from './orders/orders.module';

@Module({
    imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
            // autoSchemaFile: true,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            context: ({ req, extra }) => {
                return {
                    authorization: req
                        ? req.headers.authorization
                        : extra.authorization,
                };
            },
            subscriptions: {
                'graphql-ws': {
                    onConnect: (
                        context: Context<any, { authorization: any }>,
                    ) => {
                        const { connectionParams, extra } = context;
                        extra.authorization = connectionParams.Authorization;
                    },
                },
            },
            formatError(error: GraphQLFormattedError) {
                // console.log('---------------------------------graqphl error');
                // console.log(error);
                return error;
            },
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            envFilePath:
                process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env.test',
            ignoreEnvFile: process.env.NODE_ENV === 'prod',
            validationSchema: Joi.object({
                NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
                PORT: Joi.number(),
                DATABASE_HOST: Joi.string().required(),
                DATABASE_PORT: Joi.number(),
                DATABASE_USERNAME: Joi.string().required(),
                DATABASE_PASSWORD: Joi.string().required(),
                DATABASE_NAME: Joi.string().required(),
                JWT_SECRET: Joi.string().required(),
                JWT_EXPIRESIN: Joi.number(),
                MAILGUN_API_KEY: Joi.string().required(),
                MAILGUN_DOMAIN_NAME: Joi.string().required(),
                ...(process.env.NODE_ENV === 'test' && {
                    TEST_EMAIL_1: Joi.string().required(),
                }),
                ...(process.env.NODE_ENV === 'test' && {
                    TEST_EMAIL_2: Joi.string().required(),
                }),
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
                autoLoadEntities: true,
                synchronize: process.env.NODE_ENV !== 'prod',
                dropSchema: process.env.NODE_ENV === 'test',
            }),
            inject: [ConfigService],
        }),
        UsersModule,
        CommonModule,
        AuthModule,
        MailModule,
        RestaurantsModule,
        OrdersModule,
    ],
})
export class AppModule {}
