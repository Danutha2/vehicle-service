import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehicleImportExportService } from './vehicle-import-export.service';
import express from 'express';
import * as fs from 'fs';
import path from 'path';


@Controller('vehicle-service')
export class VehicleImportExportController {
  constructor(
    private readonly vehicleImportExportService: VehicleImportExportService,
  ) {}


  /**
   * Import endpoint now accepts both file and email
   */
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
  ) {
    if (!email) {
      throw new Error('Email is required for notifications');
    }
    return this.vehicleImportExportService.processFile(file, email);
  }

  @Post('export')
  async exportFile(
    @Body('minAge') minAge: number,
    @Body('email') email: string,
  ) {
    return this.vehicleImportExportService.exportVehicles(minAge, email);
  }

  @Get('download')
  async downloadFile(
    @Query('fileName') fileName: string,
    @Res() res: express.Response,
  ) {

    const exportDir = path.join(process.cwd(), 'export');
    const filePath = path.join(exportDir, fileName);

    const fileStream = await this.vehicleImportExportService.getExportedFileStream(fileName);

    if (!fileStream) {
      throw new NotFoundException(`File ${fileName} not found`);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'text/csv');

    fileStream.pipe(res);




  }
}
