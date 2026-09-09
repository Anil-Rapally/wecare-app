import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from '../common/config/environment.config';

export default new DataSource(databaseOptions());
