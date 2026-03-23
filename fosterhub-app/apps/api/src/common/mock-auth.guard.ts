import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { getRolePermissions } from '@fosterhub/auth';

@Injectable()
export class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const role = request.headers['x-demo-role'] || 'admin';

    request.user = {
      id: 'demo-user-1',
      firstName: 'Mike',
      lastName: 'De La Rosa Garcia',
      email: 'mike@example.com',
      role,
      permissions: getRolePermissions(role),
    };

    return true;
  }
}
