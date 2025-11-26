import { Module } from '@nestjs/common';
import { ProducerService } from './producer/producer.service';
import { BullModule } from '@nestjs/bullmq';
import { VehicleConsumer } from './consumer/consumer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Vehicle } from 'src/vehicle-info/entity/vehicle.entity';

@Module({
    imports: [
    BullModule.registerQueue({
      name: 'vehicleQueue',
    }),
    TypeOrmModule.forFeature([Vehicle]),
    HttpModule 
  ],
  providers: [ProducerService,VehicleConsumer],
  exports: [ProducerService], 
})
export class JobModule {
   

}
