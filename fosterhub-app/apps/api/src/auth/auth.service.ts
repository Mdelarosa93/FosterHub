import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import type { AuthSession } from '@fosterhub/types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly prisma: PrismaService;
  private readonly jwtService: JwtService;

  constructor(prisma: PrismaService, jwtService: JwtService) {
    this.prisma = prisma;
    this.jwtService = jwtService;
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roleAssignments: {
          where: { active: true },
          include: {
            roleTemplate: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        },
        permissionOverrides: {
          include: { permission: true }
        }
      }
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  buildPermissions(user: any) {
    const granted = new Set<string>();

    for (const assignment of user.roleAssignments ?? []) {
      for (const permissionLink of assignment.roleTemplate?.permissions ?? []) {
        granted.add(permissionLink.permission.key);
      }
    }

    for (const override of user.permissionOverrides ?? []) {
      if (override.overrideValue === 'ALLOW') granted.add(override.permission.key);
      if (override.overrideValue === 'DENY') granted.delete(override.permission.key);
    }

    return [...granted].sort();
  }

  buildSession(user: any): AuthSession {
    const firstAssignment = user.roleAssignments?.[0];
    const roleName = firstAssignment?.roleTemplate?.name ?? 'Worker';

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleName.toLowerCase().replace(/\s+/g, '_') as AuthSession['user']['role']
      },
      permissions: this.buildPermissions(user)
    };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const session = this.buildSession(user);

    const accessToken = await this.jwtService.signAsync(
      {
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role,
        permissions: session.permissions
      },
      {
        secret: process.env.JWT_SECRET || 'dev-only-secret-change-me'
      }
    );

    return {
      accessToken,
      session
    };
  }

  getNavigation(role: string) {
    const common = ['Dashboard', 'Messages'];
    const byRole: Record<string, string[]> = {
      admin: ['Users', 'Permissions', 'Cases', 'Requests', 'Vendors', 'Reports'],
      manager: ['Cases', 'Requests', 'Vendors', 'Reports'],
      worker: ['My Cases', 'Requests', 'Calendar'],
      resource_parent: ['Children', 'Requests', 'Approved Vendors'],
      vendor: ['Onboarding', 'Documents', 'Messages'],
      birth_parent: ['Child', 'Schedule', 'Messages'],
      youth: ['Schedule', 'Messages', 'Requests']
    };

    return [...common, ...(byRole[role] ?? [])];
  }
}
