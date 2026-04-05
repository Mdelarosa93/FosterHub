import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { FosterApplicationsController } from './foster-applications.controller';
import { FosterApplicationsService } from './foster-applications.service';

@Module({
  imports: [PrismaModule],
  controllers: [FosterApplicationsController],
  providers: [FosterApplicationsService],
})
export class FosterApplicationsModule {}
