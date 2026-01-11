import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { UpdateVehicleInfoInput } from './dto/update-vehicle-info.input';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PaginationInput } from './dto/paginationInput.dto';
import { Vehicle } from './entity/vehicle.entity';

/**
 * VehicleInfoService
 * -----------------------------------
 * Handles all business logic for Vehicle entities.
 *
 * Responsibilities:
 * - Fetch all vehicles or a single vehicle by ID or VIN
 * - Update vehicle information
 * - Remove a vehicle
 * - Paginate vehicles
 * - Search vehicles by model keyword
 *
 * This service is used by VehicleInfoResolver to implement GraphQL queries and mutations.
 */
@Injectable()
export class VehicleInfoService {
  private readonly logger = new Logger(VehicleInfoService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  /**
   * Fetch all vehicles from the database
   *
   * @returns Array of Vehicle entities
   * @throws InternalServerErrorException if query fails
   */
  async findAll(): Promise<Vehicle[]> {
    this.logger.log('Fetching all vehicles');
    try {
      const vehicles = await this.vehicleRepository.find();
      this.logger.log(`Fetched ${vehicles.length} vehicles`);
      return vehicles;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch all vehicles');
    }
  }

  /**
   * Find a single vehicle by ID or VIN
   *
   * @param identifier Vehicle ID (number) or VIN (string)
   * @returns Vehicle entity
   * @throws NotFoundException if vehicle does not exist
   * @throws InternalServerErrorException if query fails
   */
  async findVehicle(identifier: number | string): Promise<Vehicle> {
    this.logger.log(
      `Finding vehicle by ${typeof identifier === 'number' ? 'ID' : 'VIN'}: ${identifier}`,
    );
    try {
      let vehicle: Vehicle | null = null;

      if (typeof identifier === 'number') {
        vehicle = await this.vehicleRepository.findOne({ where: { id: identifier } });
      } else {
        vehicle = await this.vehicleRepository.findOne({ where: { vin: identifier } });
      }

      if (!vehicle) {
        this.logger.warn(
          `Vehicle with ${typeof identifier === 'number' ? 'ID' : 'VIN'} ${identifier} not found`,
        );
        throw new NotFoundException(
          `Vehicle with ${typeof identifier === 'number' ? 'ID' : 'VIN'} ${identifier} not found`,
        );
      }

      this.logger.log(`Vehicle found: ${JSON.stringify(vehicle)}`);
      return vehicle;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update vehicle information
   *
   * @param updateVehicleInfoInput Input object containing VIN and updated fields
   * @returns Updated Vehicle entity
   * @throws NotFoundException if vehicle does not exist
   * @throws InternalServerErrorException if update fails
   */
  async update(updateVehicleInfoInput: UpdateVehicleInfoInput): Promise<Vehicle> {
    this.logger.log(`Updating vehicle with VIN: ${updateVehicleInfoInput.vin}`);

    const result = await this.vehicleRepository.update(
      { vin: updateVehicleInfoInput.vin },
      updateVehicleInfoInput,
    );

    if (result.affected === 0) {
      throw new NotFoundException(`Vehicle with VIN ${updateVehicleInfoInput.vin} not found`);
    }

    return this.findVehicle(updateVehicleInfoInput.vin);
  }

  /**
   * Remove a vehicle by ID
   *
   * @param id Vehicle database ID
   * @returns Deleted Vehicle entity
   * @throws NotFoundException if vehicle does not exist
   * @throws InternalServerErrorException if deletion fails
   */
  async remove(id: number): Promise<Vehicle> {
    this.logger.log(`Removing vehicle with ID: ${id}`);
    try {
      const vehicle = await this.findVehicle(id);
      const deletedVehicle = await this.vehicleRepository.remove(vehicle);
      this.logger.log(`Vehicle with ID ${id} deleted successfully`);
      return deletedVehicle;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Fetch vehicles with pagination
   *
   * @param paginationInput Pagination parameters: page number and page size
   * @returns Paginated vehicle data with total count, page, and pageSize
   * @throws InternalServerErrorException if query fails
   */
  async findAllPaginated(paginationInput: PaginationInput) {
    this.logger.log('Fetching paginated vehicles');
    try {
      const page = Number(paginationInput.page) || 1;
      const pageSize = Number(paginationInput.pageSize) || 100;
      const skip = (page - 1) * pageSize;

      this.logger.debug(`Pagination params - page: ${page}, pageSize: ${pageSize}, skip: ${skip}`);

      const [vehicles, total] = await this.vehicleRepository.findAndCount({
        order: { manufactured_date: 'ASC' },
        take: pageSize,
        skip,
      });

      this.logger.log(`Fetched ${vehicles.length} vehicles out of total ${total}`);
      return {
        data: vehicles,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search vehicles by car model keyword
   *
   * @param keyword Partial or full model name
   * @returns Array of Vehicle entities matching the keyword
   * @throws InternalServerErrorException if query fails
   */
  async searchByModel(keyword: string): Promise<Vehicle[]> {
    this.logger.log(`Searching vehicles by model with keyword: ${keyword}`);
    const searchPattern = keyword.replace('*', '%');
    this.logger.debug(`Search pattern ${searchPattern}`);

    const results = await this.vehicleRepository.find({
      where: { car_model: ILike(`${searchPattern}%`) },
    });

    this.logger.log(`Found ${results.length} matching vehicles`);
    return results;
  }
}
