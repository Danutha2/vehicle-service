import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { VehicleImportModule } from './vehicle-import/vehicle-import.module';
import { VehicleInfoModule } from './vehicle-info/vehicle-info.module';


@Module({
  // imports: [GraphQLModule.forRoot<ApolloDriverConfig>({
  //   driver: ApolloDriver,
  //   playground: false,
  //   autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  //   sortSchema: true,

  // }), ,],

  imports:[VehicleImportModule, VehicleInfoModule,
     GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground:true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule { }
