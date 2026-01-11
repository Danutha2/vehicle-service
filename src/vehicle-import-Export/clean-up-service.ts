import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';

/**
 * VehicleCleanupService
 * -----------------------------------
 * Handles automatic cleanup of temporary vehicle files.
 *
 * Responsibilities:
 * - Periodically deletes old files from 'export' and 'uploads' directories
 * - Runs on a scheduled cron job (every 10 minutes)
 * - Logs all cleanup actions, warnings, and errors
 *
 * Note:
 * This service does not expose HTTP endpoints; it runs as a background process.
 */
@Injectable()
export class VehicleCleanupService {
  private readonly logger = new Logger(VehicleCleanupService.name);

  /**
   * Scheduled cleanup job
   *
   * Cron Expression: EVERY_10_MINUTES
   *
   * Tasks:
   * - Cleans up the 'export' directory
   * - Cleans up the 'uploads' directory
   *
   * Logging:
   * - Warns if a folder does not exist
   * - Logs deleted files
   * - Logs errors during deletion
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  handleExportCleanup() {
    const exportDir = path.join(process.cwd(), 'export');
    const uploadDir = path.join(process.cwd(), 'uploads');

    this.cleanupDirectory(exportDir, 'export');
    this.cleanupDirectory(uploadDir, 'uploads');

    this.logger.log('🧹 Cleanup completed for export and uploads folders');
  }

  /**
   * Deletes files older than a specific age from a directory
   *
   * @param dirPath Absolute path of the directory to clean
   * @param folderName Name of the folder (for logging purposes)
   *
   * Behavior:
   * - Skips cleanup if folder does not exist
   * - Calculates file age based on last modified time
   * - Deletes files older than 5 minutes (300 seconds)
   * - Logs deleted files and errors
   */
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
      if (fileAgeSeconds > 300) {
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
