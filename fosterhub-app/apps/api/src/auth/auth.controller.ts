import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { SwitchOrganizationDto } from './dto/switch-organization.dto';

@Controller('auth')
export class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return { data: await this.authService.login(body.email, body.password) };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: any) {
    return { data: user };
  }

  @Get('my-permissions')
  @UseGuards(JwtAuthGuard)
  myPermissions(@CurrentUser() user: any) {
    return { data: user.permissions ?? [] };
  }

  @Get('my-navigation')
  @UseGuards(JwtAuthGuard)
  myNavigation(@Req() req: any) {
    return { data: this.authService.getNavigation(req.user.role) };
  }

  @Post('switch-organization')
  @UseGuards(JwtAuthGuard)
  async switchOrganization(@CurrentUser() user: any, @Body() body: SwitchOrganizationDto) {
    return { data: await this.authService.switchOrganization(user, body.organizationId) };
  }
}
