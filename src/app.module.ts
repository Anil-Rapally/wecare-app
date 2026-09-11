import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { CollectionModule } from './collections/collection.module';
import { ReportModule } from './reports/report.module';

import{I18nModule,QueryResolver} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
      path: path.join(__dirname, 'i18n'),
      watch: true,
    },
    resolvers: [
      { use: QueryResolver, options: ['lang'] },
    ],
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,

      autoLoadEntities: true,
      synchronize: false,
    }),

    UserModule,

    CollectionModule,

    ReportModule,
  ],

  controllers: [AppController, UserController],

  providers: [AppService, UserService],
})
export class AppModule {}
