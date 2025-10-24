import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehicleImportService } from './vehicle-import.service';

@Controller('vehicle-service')
export class VehicleImportController {

    constructor(private readonly vehicleImportService:VehicleImportService){

    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
   async uploadFile(@UploadedFile() file: Express.Multer.File) {
       return this.vehicleImportService.processFile(file)
    }
}
