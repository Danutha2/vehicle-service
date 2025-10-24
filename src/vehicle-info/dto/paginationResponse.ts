import { ObjectType, Field, Int } from '@nestjs/graphql';
import { VehicleObject } from './vehicle.dto';

@ObjectType()
export class PaginatedVehicleResponse {
  @Field(() => [VehicleObject])
  data: VehicleObject[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;
}
