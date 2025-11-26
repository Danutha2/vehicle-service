import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Vehicle } from '../entity/vehicle.entity';

@ObjectType()
export class PaginatedVehicleResponse {
  @Field(() => [Vehicle])
  data: Vehicle[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;
}
