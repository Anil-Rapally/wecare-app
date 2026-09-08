import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Collection } from '../../collections/entity/collection.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  report_name!: string;

  @Column()
  report_type!: string;

  @Column({ type: 'date' })
  report_date!: Date;

  @Column()
  hospital_or_diagnostic_center!: string;

  @Column()
  doctor_name!: string;

  @Column({ nullable: true })
  tags!: string;

  @Column()
  file_name!: string;

  @Column()
  file_type!: string;

  @Column()
  file_size!: number;

  @Column({ type: 'longblob' })
  file_data!: Buffer;

  @Column()
  collection_id!: number;

  @ManyToOne(() => Collection, (collection) => collection.reports)
  @JoinColumn({ name: 'collection_id' })
  collection!: Collection;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
