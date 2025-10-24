import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class VehicleImportService {
  private readonly logger = new Logger(VehicleImportService.name);

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

    const jobServiceUrl = 'http://localhost:3000/job-service/import/processFile';
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
}
