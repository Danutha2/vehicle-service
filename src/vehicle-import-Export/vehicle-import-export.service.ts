import { flatten, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { ReadStream } from 'fs';
import * as path from 'path';
import { ProducerService } from 'src/job/producer/producer.service';

@Injectable()
export class VehicleImportExportService {
  private readonly logger = new Logger(VehicleImportExportService.name);

  constructor(private readonly producerService: ProducerService) {}

  /**
   * Process uploaded file
   * @param file Uploaded file
   * @param email User email for notifications
   * This method passes the uploaded file and email to the job queue producer to add to the queue for background processing  
   */
  async processFile(file: Express.Multer.File, email: string) {
    this.logger.debug(`Received file: ${file.originalname}, Size: ${file.size} bytes`);
    this.logger.debug(`User email: ${email}`);
    try {
      const result = await this.producerService.addJob('importVehicle',{filePath:file.path,email:email} );
      this.logger.log(`Import job queued successfully for file: ${file.path} with notification to ${email}`);
      return { savedFilePath: file.path, jobResult: result };
    } catch (error) {
      throw error;
    }
  }





  async exportVehicles(minAge: number, email: string) {
    if (!minAge || !email) {
      throw new Error('Both minAge and email are required');
    }

    try {
      const job = await this.producerService.addJob('exportVehicle', { minAge, email });
      this.logger.log(`Export job queued successfully with ID ${job.id} for user ${email}`);
      return { jobId: job.id, data: { minAge, email } };
    } catch (error) {
      throw error;
    }
  }

 getExportedFileStream(fileName: string): ReadStream | null {
  const exportDir = path.join(process.cwd(), 'export');
  const filePath = path.join(exportDir, fileName);

  try {
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Requested file not found: ${filePath}`);
      throw new NotFoundException(`The requested file '${fileName}' does not exist`);
    }

    const stream = fs.createReadStream(filePath);

    stream.on('error', (err) => {
      this.logger.error(`Error reading file stream: ${err.message}`, err.stack);
      throw new InternalServerErrorException(`Error reading the file: ${err.message}`);
    });

    return stream;
  } catch (error) {
    if (error instanceof NotFoundException) throw error;
    this.logger.error(`Unexpected error while accessing file: ${error.message}`, error.stack);
    throw new InternalServerErrorException(
      `Failed to access exported file: ${error.message}`,
    );
  }
}
}
