import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(@InjectQueue('vehicleQueue') private vehicleQueue: Queue) {}

  /**
   * Add any type of job to the queue.
   * @param jobName - The job type name (e.g., 'importVehicle', 'exportVehicle')
   * @param payload - The job data (file info, filters, email, etc.)
   */
  async addJob(jobName: string, payload: Record<string, any>) {
    this.logger.log(`Adding job '${jobName}' to queue with payload: ${JSON.stringify(payload)}`);

    try {
      const job = await this.vehicleQueue.add(jobName, payload);
      this.logger.log(` Job '${jobName}' added successfully with ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(` Failed to add job '${jobName}' to queue`, error.stack);
      throw error;
    }
  }
}
