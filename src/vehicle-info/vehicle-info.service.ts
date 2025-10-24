import { Injectable } from '@nestjs/common';
import { CreateVehicleInfoInput } from './dto/create-vehicle-info.input';
import { UpdateVehicleInfoInput } from './dto/update-vehicle-info.input';

@Injectable()
export class VehicleInfoService {
  create(createVehicleInfoInput: CreateVehicleInfoInput) {
    return 'This action adds a new vehicleInfo';
  }

  findAll() {
    return `This action returns all vehicleInfo`;
  }

  findOne(id: number) {
    return `This action returns a #${id} vehicleInfo`;
  }

  update(id: number, updateVehicleInfoInput: UpdateVehicleInfoInput) {
    return `This action updates a #${id} vehicleInfo`;
  }

  remove(id: number) {
    return `This action removes a #${id} vehicleInfo`;
  }
}
