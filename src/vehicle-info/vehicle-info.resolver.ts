import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { VehicleInfoService } from './vehicle-info.service';
import { VehicleObject } from './dto/vehicle.dto';
import { UpdateVehicleInfoInput } from './dto/update-vehicle-info.input';
import { PaginationInput } from './dto/paginationInput.dto';
import { PaginatedVehicleResponse } from './dto/paginationResponse';

@Resolver(() => VehicleObject)
export class VehicleInfoResolver {
  constructor(private readonly vehicleInfoService: VehicleInfoService) { }

  @Query(() => [VehicleObject], { name: 'vehicleInfo' })
  findAll() {
    return this.vehicleInfoService.findAll();
  }

  @Query(() => VehicleObject, { name: 'vehicleInfo' })
  findOne(@Args('vin') vin: string) {
    return this.vehicleInfoService.findOne(vin);
  }

  @Mutation(() => VehicleObject)
  updateVehicleInfo(@Args('updateVehicleInfoInput') updateVehicleInfoInput: UpdateVehicleInfoInput) {
    return this.vehicleInfoService.update(updateVehicleInfoInput.vin, updateVehicleInfoInput);
  }

  @Mutation(() => VehicleObject)
  removeVehicleInfo(@Args('id', { type: () => Int }) id: number) {
    return this.vehicleInfoService.remove(id);
  }

  @Query(() => PaginatedVehicleResponse)
  getVehiclesPaginated(@Args('paginationInput') paginationInput: PaginationInput) {
    return this.vehicleInfoService.findAllPaginated(paginationInput);
  }

  @Query(() => [VehicleObject], { name: 'searchVehicleByModel' })
  async searchVehicleByModel(@Args('keyword') keyword: string) {
    return this.vehicleInfoService.searchByModel(keyword);
  }

}
