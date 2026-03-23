import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkerDashboardService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async summary(currentUser: any) {
    const email = currentUser.email;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Authenticated user not found');

    const [assignedCases, intakeRecords, pendingRequests] = await Promise.all([
      this.prisma.caseAssignment.count({ where: { userId: user.id } }),
      this.prisma.intakeRecord.count({ where: { assignedWorkerUserId: user.id } }),
      this.prisma.serviceRequest.count({ where: { status: 'SUBMITTED' } }),
    ]);

    return {
      assignedCases,
      assignedIntakeRecords: intakeRecords,
      pendingRequests,
    };
  }

  async myCases(currentUser: any) {
    const email = currentUser.email;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Authenticated user not found');

    const assignments = await this.prisma.caseAssignment.findMany({
      where: { userId: user.id },
      include: {
        case: {
          include: {
            child: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map(assignment => ({
      assignmentId: assignment.id,
      roleLabel: assignment.roleLabel,
      caseId: assignment.case.id,
      caseStatus: assignment.case.status,
      childFirstName: assignment.case.child.firstName,
      childLastName: assignment.case.child.lastName,
    }));
  }

  async pendingRequests() {
    const requests = await this.prisma.serviceRequest.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        case: {
          include: {
            child: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(request => ({
      id: request.id,
      title: request.title,
      status: request.status,
      caseId: request.caseId,
      childFirstName: request.case.child.firstName,
      childLastName: request.case.child.lastName,
    }));
  }
}
