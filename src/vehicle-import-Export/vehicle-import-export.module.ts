import { Module } from '@nestjs/common';
import { VehicleImportExportController } from './vehicle-import-export.controller';
import { VehicleImportExportService } from './vehicle-import-export.service';
import { HttpModule, HttpService } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from 'src/vehicle-info/entity/vehicle.entity.dto';
import { ProducerService } from 'src/job/producer/producer.service';
import { JobModule } from 'src/job/job.module';
import { VehicleCleanupService } from './clean-up-service';

@Module({
  imports:[HttpModule,TypeOrmModule.forFeature([Vehicle]),JobModule],
  controllers: [VehicleImportExportController],
  providers: [VehicleImportExportService,VehicleCleanupService]
})
export class VehicleImportExportModule {}
