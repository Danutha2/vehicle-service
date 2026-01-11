import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import { ReadStream } from 'fs';
import * as path from 'path';
import { ProducerService } from 'src/job/producer/producer.service';

/**
 * VehicleImportExportService
 * ------------------------------------------------
 * Handles business logic related to:
 * - Importing vehicle data from uploaded files
 * - Exporting vehicle data based on criteria
 * - Providing streams for exported CSV files
 *
 * This service communicates with a background
 * job queue via ProducerService to ensure
 * long-running tasks are processed asynchronously.
 */
@Injectable()
export class VehicleImportExportService {
  private readonly logger = new Logger(VehicleImportExportService.name);

  /**
   * Creates an instance of VehicleImportExportService
   *
   * @param producerService Service responsible for queueing background jobs
   */
  constructor(private readonly producerService: ProducerService) {}

  /**
   * Queue a vehicle import job for background processing
   *
   * Responsibilities:
   * - Receives uploaded file metadata
   * - Passes file path and email to the job queue
   * - Enables asynchronous processing of large files
   *
   * @param file Uploaded CSV file containing vehicle data
   * @param email Email address to notify import status
   * @returns Object containing stored file path and job details
   *
   * @throws InternalServerErrorException If job queueing fails
   */
  async processFile(file: Express.Multer.File, email: string) {
    this.logger.debug(
      `Received file: ${file.originalname}, Size: ${file.size} bytes`,
    );
    this.logger.debug(`User email: ${email}`);

    try {
      const result = await this.producerService.addJob('importVehicle', {
        filePath: file.path,
        email: email,
      });

      this.logger.log(
        `Import job queued successfully for file: ${file.path} with notification to ${email}`,
      );

      return {
        savedFilePath: file.path,
        jobResult: result,
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue import job for ${email}: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Failed to queue import job: ${error.message}`,
      );
    }
  }

  /**
   * Queue a vehicle export job based on minimum vehicle age
   *
   * Responsibilities:
   * - Accepts filtering criteria
   * - Queues an export job for asynchronous processing
   * - Sends notification to user upon completion
   *
   * @param minAge Minimum vehicle age for export
   * @param email Email address to notify export completion
   * @returns Export job metadata
   *
   * @throws InternalServerErrorException If job creation fails
   */
  async exportVehicles(minAge: number, email: string) {
    try {
      const job = await this.producerService.addJob('exportVehicle', {
        minAge,
        email,
      });

      this.logger.log(
        `Export job queued successfully with ID ${job.id} for user ${email}`,
      );

      return {
        jobId: job.id,
        data: { minAge, email },
      };
    } catch (error) {
      this.logger.error(
        `Failed to queue export job for ${email}: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Failed to queue export job: ${error.message}`,
      );
    }
  }

  /**
   * Retrieve a readable stream for an exported CSV file
   *
   * Responsibilities:
   * - Validates file existence
   * - Streams the file efficiently to avoid high memory usage
   * - Handles file system and stream errors gracefully
   *
   * @param fileName Name of the exported CSV file
   * @returns ReadStream for the requested file
   *
   * @throws NotFoundException If file does not exist
   * @throws InternalServerErrorException If file access fails
   */
  getExportedFileStream(fileName: string): ReadStream {
    const exportDir = path.join(process.cwd(), 'export');
    const filePath = path.join(exportDir, fileName);

    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Requested file not found: ${filePath}`);
        throw new NotFoundException(
          `The requested file '${fileName}' does not exist`,
        );
      }

      const stream = fs.createReadStream(filePath);

      stream.on('error', (err) => {
        this.logger.error(
          `Error reading file stream: ${err.message}`,
          err.stack,
        );
        throw new InternalServerErrorException(
          `Error reading the file: ${err.message}`,
        );
      });

      return stream;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Unexpected error while accessing file: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Failed to access exported file: ${error.message}`,
      );
    }
  }
}
