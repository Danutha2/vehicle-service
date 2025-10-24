import { Field, Int, ObjectType } from "@nestjs/graphql";
@ObjectType()
export class VehicleObject {

    @Field({nullable:false})
    first_name: string;

    @Field({nullable:false})
    last_name: string;

    @Field({nullable:false})
    email: string;

    @Field({nullable:false})
    car_make: string;

    @Field({nullable:false})
    car_model: string;

    @Field({nullable:false})
    vin: string;

    @Field({nullable:false})
    manufactured_date: Date;

    @Field()
    age_of_vehicle?: number;
}
