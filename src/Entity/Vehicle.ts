import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  first_name: string; 

  @Column()
  last_name: string;

  @Column()
  email: string;

  @Column()
  car_make: string;

  @Column()
  car_model: string;

  @Column()
  vin: string;

  @Column()
  manufactured_date: Date;

  @Column() 
  age_of_vehicle?: number;
}
