import { Module } from '@nestjs/common';
import { VehicleImportController } from './vehicle-import.controller';
import { VehicleImportService } from './vehicle-import.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from 'src/Entity/Vehicle';

@Module({
  imports:[HttpModule,TypeOrmModule.forFeature([Vehicle])],
  controllers: [VehicleImportController],
  providers: [VehicleImportService]
})
export class VehicleImportModule {}
