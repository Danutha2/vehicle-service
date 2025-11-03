import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { ReadStream } from 'fs';
import * as path from 'path';
import { ProducerService } from 'src/job/producer/producer.service';

@Injectable()
export class VehicleImportExportService {
  private readonly logger = new Logger(VehicleImportExportService.name);

  constructor(private readonly producerService: ProducerService) {}

  /**
   * Process uploaded file, save it locally, and enqueue import job
   * @param file Uploaded file
   * @param email User email for notifications
   */
  async processFile(file: Express.Multer.File, email: string) {
    this.logger.log('--- processFile started ---');
    this.logger.log(`Received file: ${file.originalname}, Size: ${file.size} bytes`);
    this.logger.log(`Notification email: ${email}`);

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

    // Queue import job using ProducerService and attach email for notification
    try {
      const result = await this.producerService.addImportJobs('importVehicle', filePath, email);
      this.logger.log(`Import job queued successfully for file: ${filePath} with notification to ${email}`);
      return { savedFilePath: filePath, jobResult: result };
    } catch (error) {
      this.logger.error(`Failed to queue import job: ${error.message}`, error.stack);
      throw error;
    }
  }

  async exportVehicles(minAge: number, email: string) {
    if (!minAge || !email) {
      throw new Error('Both minAge and email are required');
    }

    try {
      const job = await this.producerService.addExportJobs('exportVehicle', { minAge, email });
      this.logger.log(`Export job queued successfully with ID ${job.id} for user ${email}`);
      return { jobId: job.id, data: { minAge, email } };
    } catch (error) {
      this.logger.error(`Failed to queue export job: ${error.message}`, error.stack);
      throw error;
    }
  }

  getExportedFileStream(fileName: string): ReadStream | null {
    const exportDir = path.join(process.cwd(), 'export');
    const filePath = path.join(exportDir, fileName);

    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Requested file not found: ${filePath}`);
      return null;
    }

    const stream = fs.createReadStream(filePath);

    return stream;
  }
}
