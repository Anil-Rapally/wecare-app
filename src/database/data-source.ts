import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Collection } from '../collections/entity/collection.entity';
import { Report } from '../reports/entity/report.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,

  entities: [Collection, Report],

  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
});