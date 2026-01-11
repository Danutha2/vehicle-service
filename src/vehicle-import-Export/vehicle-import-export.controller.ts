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
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { VehicleImportExportService } from './vehicle-import-export.service';
import express from 'express';
import * as fs from 'fs';
import { diskStorage } from 'multer';

/**
 * VehicleImportExportController
 * -----------------------------------
 * Handles vehicle import and export operations.
 *
 * Responsibilities:
 * - Accept CSV file uploads for vehicle imports
 * - Queue background processing jobs
 * - Trigger export jobs based on criteria
 * - Allow downloading of exported CSV files
 *
 * Base Route: /vehicle-service
 */
@Controller('vehicle-service')
export class VehicleImportExportController {
  private readonly logger = new Logger(VehicleImportExportController.name);

  /**
   * Creates an instance of VehicleImportExportController
   *
   * @param vehicleImportExportService Service responsible for business logic
   */
  constructor(
    private readonly vehicleImportExportService: VehicleImportExportService,
  ) {}

  /**
   * Upload and queue a vehicle import file for processing
   *
   * Endpoint:
   * POST /vehicle-service/import
   *
   * Features:
   * - Accepts multipart/form-data file upload
   * - Stores file locally using Multer disk storage
   * - Validates email for notifications
   * - Queues the file for background processing
   *
   * @param file Uploaded CSV file containing vehicle data
   * @param email Email address to notify processing status
   * @returns Result of queued import job
   *
   * @throws BadRequestException If email or file is missing
   * @throws InternalServerErrorException If processing fails
   */
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        /**
         * Destination directory for uploaded files.
         * Ensures upload folder exists before saving.
         */
        destination: (req, file, callback) => {
          const uploadPath = './uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          callback(null, uploadPath);
        },

        /**
         * Generates a unique filename using timestamp
         * to avoid overwriting existing files.
         */
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
    this.logger.log(`Received file upload request for email: ${email}`);

    if (!email) {
      this.logger.warn('Upload failed — missing email address.');
      throw new BadRequestException('Email is required for notifications');
    }

    if (!file) {
      this.logger.warn(`Upload failed — no file provided for ${email}`);
      throw new BadRequestException('No file uploaded');
    }

    this.logger.debug(
      `Uploading file: ${file.originalname}, size: ${file.size} bytes`,
    );

    try {
      const result = await this.vehicleImportExportService.processFile(
        file,
        email,
      );

      this.logger.log(
        `File ${file.filename} queued successfully for processing for ${email}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `File import failed for ${email}: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `File import failed: ${error.message}`,
      );
    }
  }

  /**
   * Queue a vehicle export job based on age criteria
   *
   * Endpoint:
   * POST /vehicle-service/export
   *
   * Features:
   * - Validates input parameters
   * - Creates a background export job
   * - Sends notification to provided email
   *
   * @param minAge Minimum vehicle age for export
   * @param email Email address to notify export completion
   * @returns Result of export job creation
   *
   * @throws BadRequestException If input is invalid
   * @throws InternalServerErrorException If job creation fails
   */
  @Post('export')
  async exportFile(
    @Body('minAge') minAge: number,
    @Body('email') email: string,
  ) {
    if (!minAge || !email) {
      this.logger.error('Min age and Email are required to export');
      throw new BadRequestException('Both minAge and email are required');
    }

    if (minAge < 0) {
      this.logger.error('Min age cannot be negative');
      throw new BadRequestException('Min age cannot be negative');
    }

    this.logger.log(
      `Export request received — email: ${email}, minAge: ${minAge}`,
    );

    try {
      const result = await this.vehicleImportExportService.exportVehicles(
        minAge,
        email,
      );

      this.logger.log(`Export task created successfully for ${email}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Export job creation failed for ${email}: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Export job could not be created: ${error.message}`,
      );
    }
  }

  /**
   * Download a previously exported CSV file
   *
   * Endpoint:
   * GET /vehicle-service/download?fileName=<file>
   *
   * Features:
   * - Streams file for efficient memory usage
   * - Sets appropriate headers for CSV download
   *
   * @param fileName Name of the exported CSV file
   * @param res Express response object
   *
   * @throws NotFoundException If file does not exist
   * @throws InternalServerErrorException If streaming fails
   */
  @Get('download')
  async downloadFile(
    @Query('fileName') fileName: string,
    @Res() res: express.Response,
  ) {
    this.logger.log(`Download request received for file: ${fileName}`);

    try {
      const fileStream =
        await this.vehicleImportExportService.getExportedFileStream(fileName);

      if (!fileStream) {
        this.logger.warn(`Download failed — file not found: ${fileName}`);
        throw new NotFoundException(`File ${fileName} not found`);
      }

      this.logger.debug(`Streaming file to client: ${fileName}`);

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Type', 'text/csv');

      fileStream.pipe(res);

      fileStream.on('end', () => {
        this.logger.log(`File download completed: ${fileName}`);
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to download file ${fileName}: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Failed to download file: ${error.message}`,
      );
    }
  }
}
