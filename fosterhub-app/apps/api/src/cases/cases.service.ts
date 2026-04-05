import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CasesService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async list(currentUser: any) {
    return this.prisma.case.findMany({
      where: currentUser.organizationId ? { organizationId: currentUser.organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        child: true,
        assignments: {
          include: { user: true },
        },
      },
    });
  }

  async getById(id: string, currentUser: any) {
    return this.prisma.case.findFirst({
      where: {
        id,
        ...(currentUser.organizationId ? { organizationId: currentUser.organizationId } : {}),
      },
      include: {
        child: true,
        assignments: {
          include: { user: true },
        },
        requests: {
          include: {
            decidedBy: true,
          },
        },
      },
    });
  }

  async createRequest(caseId: string, title: string, description: string | undefined, currentUser: any) {
    const existingCase = await this.prisma.case.findFirst({
      where: {
        id: caseId,
        ...(currentUser.organizationId ? { organizationId: currentUser.organizationId } : {}),
      },
    });

    if (!existingCase) {
      throw new Error('Case not found in the active organization context');
    }

    return this.prisma.serviceRequest.create({
      data: {
        caseId,
        title,
        description,
        status: 'SUBMITTED',
      },
    });
  }

  async updateRequestStatus(requestId: string, status: 'APPROVED' | 'DENIED', note: string | undefined, currentUser: any) {
    const user = await this.prisma.user.findUnique({ where: { email: currentUser.email } });
    if (!user) throw new Error('Authenticated user not found');

    const existingRequest = await this.prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        case: currentUser.organizationId ? { organizationId: currentUser.organizationId } : undefined,
      },
    });

    if (!existingRequest) {
      throw new Error('Request not found in the active organization context');
    }

    return this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status,
        decisionNote: note,
        decidedAt: new Date(),
        decidedByUserId: user.id,
      },
    });
  }

  async assignWorker(caseId: string, workerEmail: string, currentUser: any) {
    const existingCase = await this.prisma.case.findFirst({
      where: {
        id: caseId,
        ...(currentUser.organizationId ? { organizationId: currentUser.organizationId } : {}),
      },
    });
    if (!existingCase) throw new Error('Case not found in the active organization context');

    const worker = await this.prisma.user.findUnique({ where: { email: workerEmail } });
    if (!worker) throw new Error('Worker not found');

    const existing = await this.prisma.caseAssignment.findFirst({
      where: {
        caseId,
        roleLabel: 'Worker',
      },
    });

    if (existing) {
      return this.prisma.caseAssignment.update({
        where: { id: existing.id },
        data: { userId: worker.id },
        include: { user: true },
      });
    }

    return this.prisma.caseAssignment.create({
      data: {
        caseId,
        userId: worker.id,
        roleLabel: 'Worker',
      },
      include: { user: true },
    });
  }
}
