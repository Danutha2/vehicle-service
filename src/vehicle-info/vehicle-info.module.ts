import { Module } from '@nestjs/common';
import { VehicleInfoService } from './vehicle-info.service';
import { VehicleInfoResolver } from './vehicle-info.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entity/vehicle.entity';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginInlineTrace } from '@apollo/server/plugin/inlineTrace';

@Module({
  imports:[TypeOrmModule.forFeature([Vehicle]),GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        path: './src/schema.gql',
        federation: 2,
      },
      plugins: [ApolloServerPluginInlineTrace()],
    }),],
  providers: [VehicleInfoResolver, VehicleInfoService],
})
export class VehicleInfoModule {}
