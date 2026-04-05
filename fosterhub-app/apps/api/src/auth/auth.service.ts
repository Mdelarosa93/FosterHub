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
        organization: true,
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

  buildSession(user: any, scopedOrganization?: any): AuthSession {
    const firstAssignment = user.roleAssignments?.[0];
    const roleName = firstAssignment?.roleTemplate?.name ?? 'Worker';
    const activeOrganization = scopedOrganization ?? user.organization;

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: roleName.toLowerCase().replace(/\s+/g, '_') as AuthSession['user']['role'],
        organizationId: activeOrganization?.id ?? user.organizationId,
        organizationName: activeOrganization?.name,
        organizationType: activeOrganization?.type === 'STATE_AGENCY' ? 'state_agency' : 'county_agency',
        parentOrganizationId: activeOrganization?.parentOrganizationId ?? null,
      },
      permissions: this.buildPermissions(user)
    };
  }

  private async signSession(session: AuthSession) {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: session.user.id,
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        email: session.user.email,
        role: session.user.role,
        permissions: session.permissions,
        organizationId: session.user.organizationId,
        organizationName: session.user.organizationName,
        organizationType: session.user.organizationType,
        parentOrganizationId: session.user.parentOrganizationId,
      },
      {
        secret: process.env.JWT_SECRET || 'dev-only-secret-change-me'
      }
    );

    return { accessToken, session };
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    const session = this.buildSession(user);

    return this.signSession(session);
  }

  async switchOrganization(currentUser: any, organizationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        organization: true,
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

    if (!user) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const role = String(currentUser.role || 'worker');
    const canSwitchAcrossHierarchy = ['state_super_admin', 'admin'].includes(role);
    if (!canSwitchAcrossHierarchy) {
      throw new UnauthorizedException('This role cannot switch organization context');
    }

    const hierarchyRootId = currentUser.organizationType === 'county_agency'
      ? currentUser.parentOrganizationId ?? currentUser.organizationId
      : currentUser.organizationId;

    const accessibleOrganizations = await this.prisma.organization.findMany({
      where: {
        OR: [
          { id: hierarchyRootId },
          { parentOrganizationId: hierarchyRootId },
        ],
      },
    });

    const targetOrganization = accessibleOrganizations.find(item => item.id === organizationId);
    if (!targetOrganization) {
      throw new UnauthorizedException('Target organization is outside your allowed hierarchy');
    }

    const session = this.buildSession(user, targetOrganization);
    return this.signSession(session);
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
      youth: ['Schedule', 'Messages', 'Requests'],
      state_super_admin: ['Organizations', 'County Portals', 'Travel Approvals', 'Surveys', 'Reports'],
      county_admin: ['Organizations', 'Applications', 'Cases', 'Vendors', 'Surveys'],
      licensing_worker: ['Applications', 'Training', 'Documents', 'Messages']
    };

    return [...common, ...(byRole[role] ?? [])];
  }
}
