import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { VehicleImportExportModule } from './vehicle-import-Export/vehicle-import-export.module';
import { VehicleInfoModule } from './vehicle-info/vehicle-info.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './vehicle-info/entity/vehicle.entity';
import { BullModule } from '@nestjs/bullmq';
import { JobModule } from './job/job.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';


@Module({
  imports: [
    ScheduleModule.forRoot()
    ,
    VehicleImportExportModule,
    VehicleInfoModule,


    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '9727',
      database: 'vehicle',
      entities: [Vehicle],
      synchronize: true,
    }),

    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    JobModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
