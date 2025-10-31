import { IsString, IsEmail, IsDate, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsEmail()
  email: string;

  @IsString()
  car_make: string;

  @IsString()
  car_model: string;

  @IsString()
  vin: string;

  @IsDate()
  manufactured_date: Date;

  @IsOptional()
  age_of_vehicle?: number;
}
