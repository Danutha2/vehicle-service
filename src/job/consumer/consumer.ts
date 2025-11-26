import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { MoreThanOrEqual, Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { CreateVehicleDto } from '../../vehicle-import-Export/DTO/createVehicleDTO';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { Vehicle } from 'src/vehicle-info/entity/vehicle.entity';
import { ConfigService } from '@nestjs/config';

@Processor('vehicleQueue')
export class VehicleConsumer extends WorkerHost {
  private readonly logger = new Logger(VehicleConsumer.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<any>) {
    this.logger.log(`[JOB RECEIVED] ${job.name} | ID: ${job.id}`);

    try {
      switch (job.name) {
        case 'importVehicle':
          return await this.handleImportVehicle(job.data);
        case 'exportVehicle':
          return await this.handleExportVehicle(job.data);
        default:
          this.logger.warn(`[UNKNOWN JOB] Job name: ${job.name} | ID: ${job.id}`);
          return null;
      }
    } catch (error) {
      this.logger.error(`[JOB ERROR] ${job.name} | ID: ${job.id}`, error.stack);
      throw error;
    }
  }

  private async handleImportVehicle(data: { filePath: string; email: string }) {
    const filePath = data.filePath;
    const email = data.email;
    this.logger.log(`[IMPORT VEHICLE] Processing file: ${filePath}`);

    const ext = path.extname(filePath).toLowerCase();
    //To store rows extracted from the file
    let parsedData: any[] = [];

    try {
      //  Read file
      if (ext === '.csv') {
        this.logger.debug(`[IMPORT VEHICLE] Parsing CSV file: ${filePath}`);
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = require('papaparse').parse(fileContent, {
          header: true,
          skipEmptyLines: true,
        });
        parsedData = parsed.data;
      } else if (ext === '.xlsx' || ext === '.xls') {
        this.logger.debug(`[IMPORT VEHICLE] Parsing Excel file: ${filePath}`);
        const workbook = XLSX.readFile(filePath);
        parsedData = [];

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet);
          parsedData.push(...sheetData);
        });
      } else {
        throw new Error('Unsupported file type');
      }

      let importedCount = 0;
      let skippedCount = 0;

      for (const row of parsedData) {
        const manufacturedDate = new Date(row.manufactured_date);
        const age_of_vehicle = this.calculateAge(manufacturedDate);

        const vehicleDto: CreateVehicleDto = {
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          car_make: row.car_make,
          car_model: row.car_model,
          vin: row.vin,
          manufactured_date: manufacturedDate,
          age_of_vehicle: age_of_vehicle,
        };

        try {
        const vehicle = this.vehicleRepository.create(vehicleDto);
        await this.vehicleRepository.save(vehicle);
        importedCount++;
      } catch (error) {
        // Handle duplicate VIN
        if (error.code === '23505') {
          skippedCount++;
          continue;
        }
        this.logger.error(`[IMPORT VEHICLE] Failed to import VIN: ${row.vin}`, error.stack);
      }
      }

      //  Construct message for user
      let message = '';
      if (importedCount > 0 && skippedCount > 0) {
        message = `🎉 Import Successful! ${importedCount} new vehicles added, ${skippedCount} duplicates skipped. 🚗`;
      } else if (importedCount > 0) {
        message = `🎉 Import Successful! ${importedCount} new vehicles added. 🚗`;
      } else if (skippedCount > 0) {
        message = `⚠️ No new vehicles were added because ${skippedCount} duplicates were skipped.`;
      } else {
        message = `ℹ️ No vehicles to import. Your data is already up to date.`;
      }

      this.logger.log(`[IMPORT VEHICLE] ${message}`);
      
      await this.notifyUser(email, message, path.basename(filePath));

      return { importedCount, skippedCount };
    } catch (error) {
      
      this.logger.error(`[IMPORT VEHICLE ERROR] File: ${filePath}`, error.stack);
      await this.notifyUser(email, `❌ Import failed for file ${path.basename(filePath)}.`, null);
      throw error;
    }
  }

  private async handleExportVehicle(data: { minAge: number; email: string }) {
    const { minAge, email } = data;
    this.logger.log(`[EXPORT VEHICLE] Job received | minAge=${minAge}, email=${email}`);

    try {
      const vehicles = await this.vehicleRepository.find({ where: { age_of_vehicle: MoreThanOrEqual(minAge) } })
      if (vehicles.length === 0) {
        this.logger.warn(`[EXPORT VEHICLE] No vehicles found older than ${minAge} years`);
        await this.notifyUser(email, `No vehicles found older than ${minAge} years.`, null);
        return { exportedCount: 0 };
      }

      const csvHeaders = [
        'id', 'first_name', 'last_name', 'email',
        'car_make', 'car_model', 'vin', 'manufactured_date', 'age_of_vehicle'
      ];

      const csvData = vehicles.map(v => ({
        id: v.id,
        first_name: v.first_name,
        last_name: v.last_name,
        email: v.email,
        car_make: v.car_make,
        car_model: v.car_model,
        vin: v.vin,
        manufactured_date: v.manufactured_date,
        age_of_vehicle: v.age_of_vehicle,
      }));

      const exportDir = path.join(process.cwd(), 'export');
      if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

      const fileName = `export_vehicles_${Date.now()}.csv`;
      const exportPath = path.join(exportDir, fileName);

      const worksheet = XLSX.utils.json_to_sheet(csvData, { header: csvHeaders });
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles');
      XLSX.writeFile(workbook, exportPath);

      this.logger.log(`[EXPORT VEHICLE] Exported ${vehicles.length} vehicles to ${exportPath}`);
      await this.notifyUser(email, `Export complete! ${vehicles.length} vehicles exported.`, fileName);

      return { exportedCount: vehicles.length, filePath: exportPath };
    } catch (error) {
      this.logger.error(`[EXPORT VEHICLE ERROR] minAge=${minAge}, email=${email}`, error.stack);
      throw error;
    }
  }

  private async notifyUser(email: string, message: string, fileName: string | null) {
    const notificationServiceUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL');

    if (!notificationServiceUrl) {
      this.logger.error(`[NOTIFICATION] Environment variable NOTIFICATION_SERVICE_URL is not defined`);
      throw new Error('NOTIFICATION_SERVICE_URL is not defined');
    }

    try {
      await axios.post(notificationServiceUrl, { email, message, fileName });
      this.logger.log(`[NOTIFICATION] Sent to ${email}: ${message}`);
    } catch (err) {
      this.logger.error(`[NOTIFICATION ERROR] Failed to send to ${email}: ${err.message}`);
    }
  }

  private calculateAge(manufacturedDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - manufacturedDate.getFullYear();
    return age;
  }
}
