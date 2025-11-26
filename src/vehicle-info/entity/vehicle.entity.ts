import { Directive, Field, ID, Int, ObjectType } from "@nestjs/graphql";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
@Directive('@key(fields: "vin")')
export class Vehicle {

    @Field()
    @PrimaryGeneratedColumn()
    id: number

    @Field({ nullable: false })
    @Column()
    first_name: string;

    @Column()
    @Field({ nullable: false })
    last_name: string;

    @Column()
    @Field({ nullable: false })
    email: string;

    @Column()
    @Field({ nullable: false })
    car_make: string;

    @Column()
    @Field({ nullable: false })
    car_model: string;

    @Column({unique:true})
    @Field({ nullable: false })
    vin: string;

    @Column()
    @Field({ nullable: false })
    manufactured_date: Date;

    @Column()
    @Field()
    age_of_vehicle?: number;

}
