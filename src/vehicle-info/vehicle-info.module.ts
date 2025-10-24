import { Module } from '@nestjs/common';
import { VehicleInfoService } from './vehicle-info.service';
import { VehicleInfoResolver } from './vehicle-info.resolver';

@Module({
  providers: [VehicleInfoResolver, VehicleInfoService],
})
export class VehicleInfoModule {}
