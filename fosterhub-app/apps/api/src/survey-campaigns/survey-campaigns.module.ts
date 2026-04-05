import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SurveyCampaignsController } from './survey-campaigns.controller';
import { SurveyCampaignsService } from './survey-campaigns.service';

@Module({
  imports: [PrismaModule],
  controllers: [SurveyCampaignsController],
  providers: [SurveyCampaignsService],
})
export class SurveyCampaignsModule {}
