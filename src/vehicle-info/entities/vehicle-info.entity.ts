import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class VehicleInfo {
  @Field(() => Int, { description: 'Example field (placeholder)' })
  exampleField: number;
}
