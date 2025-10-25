import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VehicleImportExportService {

  private readonly logger = new Logger(VehicleImportExportService.name);

  constructor(private readonly httpService: HttpService) {}

  async processFile(file: Express.Multer.File) {
    this.logger.log('--- processFile started ---');
    this.logger.log(`Received file: ${file.originalname}, Size: ${file.size} bytes`);

    const uploadFolder = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
      this.logger.log(`Upload folder created at: ${uploadFolder}`);
    } else {
      this.logger.log(`Upload folder exists at: ${uploadFolder}`);
    }

    const fileName = Date.now() + '-' + file.originalname;
    const filePath = path.join(uploadFolder, fileName);
    fs.writeFileSync(filePath, file.buffer);
    this.logger.log(`File saved at: ${filePath}`);

    const jobServiceUrl = 'http://localhost:3000/job-service/import';
    const payload = { filePath };
    this.logger.log('Sending POST request to job-service with payload:', payload);

    try {
      const response = await firstValueFrom(
        this.httpService.post(jobServiceUrl, payload)
      );
      this.logger.log(`Job service response: ${JSON.stringify(response.data)}`);
      this.logger.log('--- processFile completed successfully ---');
      return { savedFilePath: filePath, jobServiceResponse: response.data };
    } catch (error) {
      this.logger.error('Error calling job-service:', error.message || error, error.stack);
      throw error;
    }
  }


      async exportVehicles(minAge: number, email: string) {
    if (!minAge || !email) {
      throw new HttpException(
        'Both minAge and email are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Call the Job Service to queue the export job
      const response = await axios.post(
        'http://localhost:3000/job-service/export',
        { minAge, email },
      );

      this.logger.log(`Export job requested successfully: ${JSON.stringify(response.data)}`);

      return {
        message: 'Export job requested successfully',
        jobServiceResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error(`Failed to request export job: ${error.message}`, error.stack);
      throw new HttpException(
        'Failed to request export job',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  }

