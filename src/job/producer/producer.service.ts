import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class ProducerService {
  private readonly logger = new Logger(ProducerService.name);

  constructor(@InjectQueue('vehicleQueue') private vehicleQueue: Queue) {}

  async addImportJobs(jobName: string, filePath: string, email: string) {
  this.logger.log(`Adding job '${jobName}' to queue with file: ${filePath} and email: ${email}`);

  try {
    const job = await this.vehicleQueue.add(jobName, { filePath, email });
    this.logger.log(`Job '${jobName}' added successfully with ID: ${job.id}`);
    return job;
  } catch (error) {
    this.logger.error(`Failed to add job '${jobName}' to queue`, error.stack);
    throw error;
  }
}


  async addExportJobs(jobName: string, data:{ minAge:number, email:string }) {
    this.logger.log(`Adding job '${jobName}' to queue with file: ${data}`);

    try {
      const job = await this.vehicleQueue.add(jobName,  data );
      this.logger.log(`Job '${jobName}' added successfully with ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job '${jobName}' to queue`, error.stack);
      throw error;
    }
  }


}
