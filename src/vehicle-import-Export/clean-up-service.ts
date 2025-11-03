import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VehicleCleanupService {
  private readonly logger = new Logger(VehicleCleanupService.name);

  @Cron(CronExpression.EVERY_MINUTE)
  handleExportCleanup() {
    const exportDir = path.join(process.cwd(), 'export');
    const uploadDir = path.join(process.cwd(), 'uploads');

    this.cleanupDirectory(exportDir, 'export');
    this.cleanupDirectory(uploadDir, 'uploads');

    this.logger.log(' Cleanup completed for export and uploads folders');
  }

  private cleanupDirectory(dirPath: string, folderName: string) {
    if (!fs.existsSync(dirPath)) {
      this.logger.warn(`${folderName} folder does not exist. Skipping cleanup.`);
      return;
    }

    const files = fs.readdirSync(dirPath);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      // Calculate file age in seconds
      const fileAgeSeconds = (now - stats.mtimeMs) / 1000;

      // Delete files older than 300 seconds (5 minutes)
      if (fileAgeSeconds >300) {
        try {
          fs.unlinkSync(filePath);
          this.logger.log(`🧹 Deleted old ${folderName} file: ${file}`);
        } catch (error) {
          this.logger.error(`Failed to delete ${folderName} file ${file}: ${error.message}`);
        }
      }
    }
  }
}
