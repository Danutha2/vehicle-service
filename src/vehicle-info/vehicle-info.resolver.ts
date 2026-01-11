import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { VehicleInfoService } from './vehicle-info.service';
import { Vehicle } from './entity/vehicle.entity';
import { UpdateVehicleInfoInput } from './dto/update-vehicle-info.input';
import { PaginationInput } from './dto/paginationInput.dto';
import { PaginatedVehicleResponse } from './dto/paginationResponse';
import { InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

/**
 * VehicleInfoResolver
 * -----------------------------------
 * Handles GraphQL queries and mutations for Vehicle entities.
 *
 * Responsibilities:
 * - Fetch all vehicles or a single vehicle by VIN
 * - Update vehicle information
 * - Remove a vehicle
 * - Fetch paginated vehicles
 * - Search vehicles by model keyword
 */
@Resolver(() => Vehicle)
export class VehicleInfoResolver {
  private readonly logger = new Logger(VehicleInfoResolver.name);

  constructor(private readonly vehicleInfoService: VehicleInfoService) {}

  /**
   * Fetch all vehicles
   *
   * @returns Array of Vehicle entities
   * @throws InternalServerErrorException if fetching fails
   *
   * GraphQL Query: allVehicleInfo
   */
  @Query(() => [Vehicle], { name: 'allVehicleInfo' })
  async findAll() {
    this.logger.log('Start: Fetching all vehicles');
    try {
      const result = await this.vehicleInfoService.findAll();
      this.logger.log(`Success: Fetched ${result.length} vehicles`);
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch all vehicles', error.stack);
      throw new InternalServerErrorException('Failed to fetch vehicles');
    }
  }

  /**
   * Fetch a single vehicle by VIN
   *
   * @param vin Vehicle Identification Number
   * @returns Vehicle entity if found
   * @throws NotFoundException if vehicle does not exist
   * @throws InternalServerErrorException if fetching fails
   *
   * GraphQL Query: vehicleInfo
   */
  @Query(() => Vehicle, { name: 'vehicleInfo' })
  async findVehicle(@Args('vin') vin: string) {
    this.logger.log(`Start: Fetching vehicle with VIN: ${vin}`);
    try {
      const vehicle = await this.vehicleInfoService.findVehicle(vin);
      if (!vehicle) {
        this.logger.warn(`Vehicle with VIN ${vin} not found`);
      } else {
        this.logger.log(`Success: Fetched vehicle with VIN: ${vin}`);
      }
      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.error(`Vehicle Not found for vin ${vin}`);
        throw error;
      }

      this.logger.error(`Failed to fetch vehicle with VIN: ${vin}`, error.stack);
      throw new InternalServerErrorException('Failed to fetch vehicles');
    }
  }

  /**
   * Update vehicle information
   *
   * @param updateVehicleInfoInput Data to update vehicle
   * @returns Updated Vehicle entity
   * @throws NotFoundException if vehicle does not exist
   * @throws InternalServerErrorException if update fails
   *
   * GraphQL Mutation: updateVehicleInfo
   */
  @Mutation(() => Vehicle)
  async updateVehicleInfo(
    @Args('updateVehicleInfoInput') updateVehicleInfoInput: UpdateVehicleInfoInput,
  ) {
    this.logger.log(`Start: Updating vehicle info for VIN: ${updateVehicleInfoInput.vin}`);
    this.logger.debug(`Update input: ${JSON.stringify(updateVehicleInfoInput)}`);
    try {
      const updatedVehicle = await this.vehicleInfoService.update(updateVehicleInfoInput);
      this.logger.log(`Success: Updated vehicle info for VIN: ${updateVehicleInfoInput.vin}`);
      return updatedVehicle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.error(`Vehicle not found for update (VIN: ${updateVehicleInfoInput.vin})`);
        throw new NotFoundException(`Vehicle with VIN ${updateVehicleInfoInput.vin} not found`);
      }
      this.logger.error(
        `Error while updating vehicle (VIN: ${updateVehicleInfoInput.vin}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error while updating vehicle with VIN ${updateVehicleInfoInput.vin}`,
      );
    }
  }

  /**
   * Remove a vehicle by ID
   *
   * @param id Vehicle database ID
   * @returns Deleted Vehicle entity
   * @throws NotFoundException if vehicle does not exist
   * @throws InternalServerErrorException if deletion fails
   *
   * GraphQL Mutation: removeVehicleInfo
   */
  @Mutation(() => Vehicle)
  async removeVehicleInfo(@Args('id', { type: () => Int }) id: number) {
    this.logger.log(`Start: Removing vehicle with ID: ${id}`);
    try {
      const removedVehicle = await this.vehicleInfoService.remove(id);
      this.logger.log(`Success: Removed vehicle with ID: ${id}`);
      return removedVehicle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.error(`Vehicle not found for Delete (ID: ${id})`);
        throw new NotFoundException(`Vehicle with ID ${id} not found`);
      }
      this.logger.error(`Error while Deleting vehicle (ID: ${id}`, error.stack);
      throw new InternalServerErrorException(`Error while delete vehicle with ID ${id}`);
    }
  }

  /**
   * Fetch vehicles with pagination
   *
   * @param paginationInput Pagination info: page number and page size
   * @returns PaginatedVehicleResponse
   * @throws InternalServerErrorException if fetching fails
   *
   * GraphQL Query: getVehiclesPaginated
   */
  @Query(() => PaginatedVehicleResponse)
  async getVehiclesPaginated(@Args('paginationInput') paginationInput: PaginationInput) {
    this.logger.log(
      `Start: Fetching paginated vehicles - Page: ${paginationInput.page}, Limit: ${paginationInput.pageSize}`,
    );
    try {
      const paginatedResult = await this.vehicleInfoService.findAllPaginated(paginationInput);
      this.logger.log(`Success: Fetched paginated vehicles - Total: ${paginatedResult.total}`);
      return paginatedResult;
    } catch (error) {
      this.logger.error('Failed to fetch paginated vehicles', error.stack);
      throw new InternalServerErrorException(`Error while loading page`);
    }
  }

  /**
   * Search vehicles by model keyword
   *
   * @param keyword Model keyword to search for
   * @returns Array of Vehicle entities matching the keyword
   * @throws InternalServerErrorException if search fails
   *
   * GraphQL Query: searchVehicleByModel
   */
  @Query(() => [Vehicle], { name: 'searchVehicleByModel' })
  async searchVehicleByModel(@Args('keyword') keyword: string) {
    this.logger.log(`Start: Searching vehicles by model with keyword: "${keyword}"`);
    try {
      const vehicles = await this.vehicleInfoService.searchByModel(keyword);
      this.logger.log(`Success: Found ${vehicles.length} vehicles for keyword "${keyword}"`);
      return vehicles;
    } catch (error) {
      this.logger.error(
        `Failed to search vehicles by model with keyword: "${keyword}"`,
        error.stack,
      );
      throw new InternalServerErrorException(`Error while searching model`);
    }
  }
}
