import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { VehicleImportModule } from './vehicle-import/vehicle-import.module';
import { VehicleInfoModule } from './vehicle-info/vehicle-info.module';
import { Vehicle } from './Entity/Vehicle';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports:[VehicleImportModule, VehicleInfoModule,
     GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground:true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '9727',
      database: 'vehicle',
      entities: [Vehicle],
      synchronize: true,
    })
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule { }
