import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CasesService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async list() {
    return this.prisma.case.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        child: true,
        assignments: {
          include: { user: true },
        },
      },
    });
  }

  async getById(id: string) {
    return this.prisma.case.findUnique({
      where: { id },
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

  async createRequest(caseId: string, title: string, description?: string) {
    return this.prisma.serviceRequest.create({
      data: {
        caseId,
        title,
        description,
        status: 'SUBMITTED',
      },
    });
  }

  async updateRequestStatus(requestId: string, status: 'APPROVED' | 'DENIED', note: string | undefined, currentUserEmail: string) {
    const user = await this.prisma.user.findUnique({ where: { email: currentUserEmail } });
    if (!user) throw new Error('Authenticated user not found');

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

  async assignWorker(caseId: string, workerEmail: string) {
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
