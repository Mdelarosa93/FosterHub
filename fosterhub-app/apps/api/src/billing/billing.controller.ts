import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PermissionsGuard } from '../common/permissions.guard';
import { RequirePermissions } from '../common/permissions.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { UpdateBillingContactDto } from './dto/update-billing-contact.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { ChangeBillingPlanDto } from './dto/change-billing-plan.dto';
import { UpdateCountyAllocationDto } from './dto/update-county-allocation.dto';
import { UpdateSubscriptionModuleDto } from './dto/update-subscription-module.dto';

@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('portal')
  @RequirePermissions('billing.view')
  async getPortal(@CurrentUser() user: any) {
    return { data: await this.billingService.getPortal(user) };
  }

  @Patch('contact')
  @RequirePermissions('billing.manage')
  async updateContact(@CurrentUser() user: any, @Body() body: UpdateBillingContactDto) {
    return { data: await this.billingService.updateBillingContact(user, body) };
  }

  @Patch('payment-method')
  @RequirePermissions('billing.manage')
  async updatePaymentMethod(@CurrentUser() user: any, @Body() body: UpdatePaymentMethodDto) {
    return { data: await this.billingService.updatePaymentMethod(user, body) };
  }

  @Patch('plan')
  @RequirePermissions('billing.manage')
  async changePlan(@CurrentUser() user: any, @Body() body: ChangeBillingPlanDto) {
    return { data: await this.billingService.changePlan(user, body) };
  }

  @Put('allocations/:countyOrganizationId')
  @RequirePermissions('billing.manage')
  async updateCountyAllocation(@CurrentUser() user: any, @Param('countyOrganizationId') countyOrganizationId: string, @Body() body: UpdateCountyAllocationDto) {
    return { data: await this.billingService.updateCountyAllocation(user, countyOrganizationId, body) };
  }

  @Patch('modules/:billingModuleId')
  @RequirePermissions('billing.manage')
  async updateSubscriptionModule(@CurrentUser() user: any, @Param('billingModuleId') billingModuleId: string, @Body() body: UpdateSubscriptionModuleDto) {
    return { data: await this.billingService.updateSubscriptionModule(user, billingModuleId, body) };
  }
}
