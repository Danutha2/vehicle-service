import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { UpdateVehicleInfoInput } from './dto/update-vehicle-info.input';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Like, Repository } from 'typeorm';
import { PaginationInput } from './dto/paginationInput.dto';
import { Vehicle } from './entity/vehicle.entity.dto';

@Injectable()
export class VehicleInfoService {


  private readonly logger = new Logger(VehicleInfoService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) { }

  async findAll(): Promise<Vehicle[]> {
    this.logger.log('Fetching all vehicles');
    try {
      const vehicles = await this.vehicleRepository.find();
      this.logger.log(`Fetched ${vehicles.length} vehicles`);
      return vehicles;
    } catch (error) {
      this.logger.error('Failed to fetch vehicles', error.stack);
      throw new InternalServerErrorException('Failed to fetch vehicles');
    }
  }

  async findOne(identifier: number | string): Promise<Vehicle> {
    this.logger.log(`Finding vehicle by ${typeof identifier === 'number' ? 'ID' : 'VIN'}: ${identifier}`);
    try {
      let vehicle: Vehicle | null = null;

      if (typeof identifier === 'number') {
        vehicle = await this.vehicleRepository.findOne({ where: { id: identifier } });
      } else {
        vehicle = await this.vehicleRepository.findOne({ where: { vin: identifier } });
      }

      if (!vehicle) {
        this.logger.warn(`Vehicle with ${typeof identifier === 'number' ? 'ID' : 'VIN'} ${identifier} not found`);
        throw new NotFoundException(`Vehicle with ${typeof identifier === 'number' ? 'ID' : 'VIN'} ${identifier} not found`);
      }

      this.logger.log(`Vehicle found: ${JSON.stringify(vehicle)}`);
      return vehicle;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error('Error finding vehicle', error.stack);
      throw new InternalServerErrorException('Error finding vehicle');
    }
  }

  async update(vin: string, updateVehicleInfoInput: UpdateVehicleInfoInput): Promise<Vehicle> {
    this.logger.log(`Updating vehicle with VIN: ${vin}`);
    try {
      const vehicle = await this.findOne(vin);
      Object.assign(vehicle, updateVehicleInfoInput);
      const updatedVehicle = await this.vehicleRepository.save(vehicle);
      this.logger.log(`Vehicle updated successfully: ${JSON.stringify(updatedVehicle)}`);
      return updatedVehicle;
    } catch (error) {
      this.logger.error(`Failed to update vehicle with VIN ${vin}`, error.stack);
      throw new InternalServerErrorException(`Failed to update vehicle with VIN ${vin}`);
    }
  }

  async remove(id: number): Promise<Vehicle> {
    this.logger.log(`Removing vehicle with ID: ${id}`);
    try {
      const vehicle = await this.findOne(id);
      const deltedVehicle = await this.vehicleRepository.remove(vehicle);
      this.logger.log(`Vehicle with ID ${id} deleted successfully`);
      return deltedVehicle;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete vehicle with ID ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete vehicle with ID ${id}`);
    }
  }

  async findAllPaginated(paginationInput: PaginationInput) {
    const page = Number(paginationInput.page) || 1;
    const pageSize = Number(paginationInput.pageSize) || 2;

    const skip = (page - 1) * pageSize;

    const [vehicles, total] = await this.vehicleRepository.findAndCount({
      order: { manufactured_date: 'ASC' },
      take: pageSize,
      skip,
    });

    return {
      data: vehicles,
      total,
      page,
      pageSize,
    };
  }


  async searchByModel(keyword: string): Promise<Vehicle[]> {
    this.logger.log(`Searching vehicles by model with keyword: ${keyword}`);

    const searchPattern = keyword.replace('*', '%');
    this.logger.debug(`Search pattern ${searchPattern}`)

    const results = await this.vehicleRepository.find({
      where: { car_model: ILike(`${searchPattern}%`) }
    });

    this.logger.log(`Found ${results.length} matching vehicles`);
    return results;
  }

  forRecords(vin: string) {
    throw new Error("Method not implemented.");
  }

}
