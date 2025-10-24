import { Module } from '@nestjs/common';
import { VehicleImportController } from './vehicle-import.controller';
import { VehicleImportService } from './vehicle-import.service';
import { HttpModule, HttpService } from '@nestjs/axios';

@Module({
  imports:[HttpModule],
  controllers: [VehicleImportController],
  providers: [VehicleImportService]
})
export class VehicleImportModule {}
