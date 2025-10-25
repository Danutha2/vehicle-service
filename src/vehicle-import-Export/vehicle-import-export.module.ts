import { Module } from '@nestjs/common';
import { VehicleImportExportController } from './vehicle-import-export.controller';
import { VehicleImportExportService } from './vehicle-import-export.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from 'src/Entity/Vehicle';

@Module({
  imports:[HttpModule,TypeOrmModule.forFeature([Vehicle])],
  controllers: [VehicleImportExportController],
  providers: [VehicleImportExportService]
})
export class VehicleImportExportModule {}
