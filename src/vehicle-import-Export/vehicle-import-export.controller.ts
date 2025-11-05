import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehicleImportExportService } from './vehicle-import-export.service';
import express from 'express';
import * as fs from 'fs';
import path from 'path';
import { diskStorage } from 'multer';

@Controller('vehicle-service')
export class VehicleImportExportController {
  constructor(
    private readonly vehicleImportExportService: VehicleImportExportService,
  ) {}

  /**
   * To receive and queue a vehicle import file for processing
   * - Uses FileInterceptor to handle file uploads automatically
   * - Validates email to ensure notifications can be sent
   */
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        // Ensures upload directory exists before saving the file
        destination: (req, file, callback) => {
          const uploadPath = './uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },

        // Adds timestamp to filename to prevent overwriting
        filename: (req, file, callback) => {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.originalname}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
  ) {
    // Ensures an email is provided for notification purposes
    if (!email) {
      throw new BadRequestException('Email is required for notifications');
    }

    try {
      return await this.vehicleImportExportService.processFile(file, email);
    } catch (error) {
      throw new InternalServerErrorException(
        `File import failed: ${error.message}`,
      );
    }
  }

  /**
   * To queue a vehicle export task based on criteria
   */
  @Post('export')
  async exportFile(
    @Body('minAge') minAge: number,
    @Body('email') email: string,
  ) {
    try {
      return await this.vehicleImportExportService.exportVehicles(minAge, email);
    } catch (error) {
      throw new InternalServerErrorException(
        `Export job could not be created: ${error.message}`,
      );
    }
  }

  /**
   *  allow downloading a previously exported CSV file
   * - Uses streaming for efficient file transfer
   */
  @Get('download')
  async downloadFile(
    @Query('fileName') fileName: string,
    @Res() res: express.Response,
  ) {
    try {
      const fileStream =
        await this.vehicleImportExportService.getExportedFileStream(fileName);

      // Ensures . actually exists before responding
      if (!fileStream) {
        throw new NotFoundException(`File ${fileName} not found`);
      }

      // Sets headers to force browser to download instead of display
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Type', 'text/csv');

      // Streams file directly to client
      fileStream.pipe(res);
    } catch (error) {

      if( error instanceof NotFoundException){
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to download file: ${error.message}`,
      );
    }
  }
}
