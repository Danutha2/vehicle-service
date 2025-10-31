import { Resolver, Query, Mutation, Args, Int, ResolveReference } from '@nestjs/graphql';
import { VehicleInfoService } from './vehicle-info.service';
import { Vehicle } from './entity/vehicle.entity.dto';
import { UpdateVehicleInfoInput } from './dto/update-vehicle-info.input';
import { PaginationInput } from './dto/paginationInput.dto';
import { PaginatedVehicleResponse } from './dto/paginationResponse';
import { Logger } from '@nestjs/common';

@Resolver(() => Vehicle)
export class VehicleInfoResolver {
  private readonly logger = new Logger(VehicleInfoResolver.name);

  constructor(private readonly vehicleInfoService: VehicleInfoService) {}

  @Query(() => [Vehicle], { name: 'allVehicleInfo' })
  async findAll() {
    this.logger.log('Start: Fetching all vehicles');
    try {
      const result = await this.vehicleInfoService.findAll();
      this.logger.log(`Success: Fetched ${result.length} vehicles`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch all vehicles', error.stack);
      throw error;
    }
  }

  @Query(() => Vehicle, { name: 'vehicleInfo' })
  async findOne(@Args('vin') vin: string) {
    this.logger.log(`Start: Fetching vehicle with VIN: ${vin}`);
    try {
      const vehicle = await this.vehicleInfoService.findOne(vin);
      if (!vehicle) {
        this.logger.warn(`Vehicle with VIN ${vin} not found`);
      } else {
        this.logger.log(`Success: Fetched vehicle with VIN: ${vin}`);
      }
      return vehicle;
    } catch (error) {
      this.logger.error(`Failed to fetch vehicle with VIN: ${vin}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Vehicle)
  async updateVehicleInfo(@Args('updateVehicleInfoInput') updateVehicleInfoInput: UpdateVehicleInfoInput) {
    this.logger.log(`Start: Updating vehicle info for VIN: ${updateVehicleInfoInput.vin}`);
    this.logger.debug(`Update input: ${JSON.stringify(updateVehicleInfoInput)}`);
    try {
      const updatedVehicle = await this.vehicleInfoService.update(updateVehicleInfoInput.vin, updateVehicleInfoInput);
      this.logger.log(`Success: Updated vehicle info for VIN: ${updateVehicleInfoInput.vin}`);
      return updatedVehicle;
    } catch (error) {
      this.logger.error(`Failed to update vehicle with VIN: ${updateVehicleInfoInput.vin}`, error.stack);
      throw error;
    }
  }

  @Mutation(() => Vehicle)
  async removeVehicleInfo(@Args('id', { type: () => Int }) id: number) {
    this.logger.log(`Start: Removing vehicle with ID: ${id}`);
    try {
      const removedVehicle = await this.vehicleInfoService.remove(id);
      this.logger.log(`Success: Removed vehicle with ID: ${id}`);
      return removedVehicle;
    } catch (error) {
      this.logger.error(`Failed to remove vehicle with ID: ${id}`, error.stack);
      throw error;
    }
  }

  @Query(() => PaginatedVehicleResponse)
  async getVehiclesPaginated(@Args('paginationInput') paginationInput: PaginationInput) {
    this.logger.log(`Start: Fetching paginated vehicles - Page: ${paginationInput.page}, Limit: ${paginationInput.pageSize}`);
    try {
      const paginatedResult = await this.vehicleInfoService.findAllPaginated(paginationInput);
      this.logger.log(`Success: Fetched paginated vehicles - Total: ${paginatedResult.total}`);
      return paginatedResult;
    } catch (error) {
      this.logger.error('Failed to fetch paginated vehicles', error.stack);
      throw error;
    }
  }

  @Query(() => [Vehicle], { name: 'searchVehicleByModel' })
  async searchVehicleByModel(@Args('keyword') keyword: string) {
    this.logger.log(`Start: Searching vehicles by model with keyword: "${keyword}"`);
    try {
      const vehicles = await this.vehicleInfoService.searchByModel(keyword);
      this.logger.log(`Success: Found ${vehicles.length} vehicles for keyword "${keyword}"`);
      return vehicles;
    } catch (error) {
      this.logger.error(`Failed to search vehicles by model with keyword: "${keyword}"`, error.stack);
      throw error;
    }
  }

  @ResolveReference()
  async resolveReference(reference: { __typename: string; vin: string }): Promise<Vehicle> {
    this.logger.log(`Start: Resolving reference for vehicle with VIN: ${reference.vin}`);
    try {
      const vehicle = await this.vehicleInfoService.findOne(reference.vin);
      if (!vehicle) {
        this.logger.warn(`Reference resolution failed for VIN: ${reference.vin}`);
      } else {
        this.logger.log(`Success: Resolved reference for VIN: ${reference.vin}`);
      }
      return vehicle;
    } catch (error) {
      this.logger.error(`Failed to resolve reference for VIN: ${reference.vin}`, error.stack);
      throw error;
    }
  }
}
