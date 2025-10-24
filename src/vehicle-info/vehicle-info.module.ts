import { Module } from '@nestjs/common';
import { VehicleInfoService } from './vehicle-info.service';
import { VehicleInfoResolver } from './vehicle-info.resolver';
import { Vehicle } from 'src/Entity/Vehicle';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports:[TypeOrmModule.forFeature([Vehicle])],
  providers: [VehicleInfoResolver, VehicleInfoService],
})
export class VehicleInfoModule {}
