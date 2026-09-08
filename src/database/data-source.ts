import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from '../config/config';

export default new DataSource(databaseOptions());