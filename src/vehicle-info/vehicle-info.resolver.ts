import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { VehicleInfoService } from './vehicle-info.service';
import { VehicleInfo } from './entities/vehicle-info.entity';
import { CreateVehicleInfoInput } from './dto/create-vehicle-info.input';
import { UpdateVehicleInfoInput } from './dto/update-vehicle-info.input';

@Resolver(() => VehicleInfo)
export class VehicleInfoResolver {
  constructor(private readonly vehicleInfoService: VehicleInfoService) {}

  @Mutation(() => VehicleInfo)
  createVehicleInfo(@Args('createVehicleInfoInput') createVehicleInfoInput: CreateVehicleInfoInput) {
    return this.vehicleInfoService.create(createVehicleInfoInput);
  }

  @Query(() => [VehicleInfo], { name: 'vehicleInfo' })
  findAll() {
    return this.vehicleInfoService.findAll();
  }

  @Query(() => VehicleInfo, { name: 'vehicleInfo' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.vehicleInfoService.findOne(id);
  }

  @Mutation(() => VehicleInfo)
  updateVehicleInfo(@Args('updateVehicleInfoInput') updateVehicleInfoInput: UpdateVehicleInfoInput) {
    return this.vehicleInfoService.update(updateVehicleInfoInput.id, updateVehicleInfoInput);
  }

  @Mutation(() => VehicleInfo)
  removeVehicleInfo(@Args('id', { type: () => Int }) id: number) {
    return this.vehicleInfoService.remove(id);
  }
}
