import { CreateVehicleInfoInput } from './create-vehicle-info.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateVehicleInfoInput extends PartialType(CreateVehicleInfoInput) {
  @Field()
  vin: string;
}
