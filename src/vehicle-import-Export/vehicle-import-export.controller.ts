import { Body, Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehicleImportExportService } from './vehicle-import-export.service';

@Controller('vehicle-service')
export class VehicleImportExportController {

    constructor(private readonly vehicleImportExportService:VehicleImportExportService){

    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
   async uploadFile(@UploadedFile() file: Express.Multer.File) {
       return this.vehicleImportExportService.processFile(file)
    }

    @Post('export')
  async exportFile(
    @Body('minAge') minAge: number,
    @Body('email') email: string,
  ) {
    return this.vehicleImportExportService.exportVehicles(minAge, email);
  }
}
