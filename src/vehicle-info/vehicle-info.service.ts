import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { UpdateVehicleInfoInput } from './dto/update-vehicle-info.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from 'src/Entity/Vehicle';
import { Repository } from 'typeorm';

@Injectable()
export class VehicleInfoService {
  private readonly logger = new Logger(VehicleInfoService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

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

  async remove(id: number): Promise<{ message: string }> {
    this.logger.log(`Removing vehicle with ID: ${id}`);
    try {
      const vehicle = await this.findOne(id);
      await this.vehicleRepository.remove(vehicle);
      this.logger.log(`Vehicle with ID ${id} deleted successfully`);
      return { message: `Vehicle with ID ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete vehicle with ID ${id}`, error.stack);
      throw new InternalServerErrorException(`Failed to delete vehicle with ID ${id}`);
    }
  }
}
