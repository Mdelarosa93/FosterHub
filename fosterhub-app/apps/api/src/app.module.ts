import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { PermissionsGuard } from './common/permissions.guard';
import { RequirePermissions } from './common/permissions.decorator';
import { JwtAuthGuard } from './common/jwt-auth.guard';
import { IntakeModule } from './intake/intake.module';
import { CasesModule } from './cases/cases.module';
import { WorkerDashboardModule } from './worker-dashboard/worker-dashboard.module';
import { DocumentsModule } from './documents/documents.module';

@Controller()
class AppController {
  @Get('health')
  health() {
    return {
      ok: true,
      service: 'fosterhub-api',
      stage: 'jwt-protected-modules'
    };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('users.manage')
  adminOnly() {
    return {
      data: {
        message: 'You have users.manage permission.'
      }
    };
  }
}

@Module({
  imports: [PrismaModule, AuthModule, IntakeModule, CasesModule, WorkerDashboardModule, DocumentsModule],
  controllers: [AppController],
  providers: [PermissionsGuard],
})
export class AppModule {}
