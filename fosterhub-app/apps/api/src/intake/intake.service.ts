import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIntakeDto } from './dto/create-intake.dto';

@Injectable()
export class IntakeService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async list() {
    return this.prisma.intakeRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        assignedWorker: true,
      },
    });
  }

  async create(dto: CreateIntakeDto, currentUser: any) {
    const email = currentUser.email;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Authenticated user not found');

    return this.prisma.intakeRecord.create({
      data: {
        organizationId: user.organizationId,
        childFirstName: dto.childFirstName,
        childLastName: dto.childLastName,
        notes: dto.notes,
        createdByUserId: user.id,
      },
    });
  }

  async convertToCase(intakeId: string, currentUser: any) {
    const email = currentUser.email;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Authenticated user not found');

    const intake = await this.prisma.intakeRecord.findUnique({ where: { id: intakeId } });
    if (!intake) throw new Error('Intake record not found');

    if (intake.status === 'CONVERTED') {
      throw new Error('Intake record already converted');
    }

    return this.prisma.$transaction(async tx => {
      const child = await tx.child.create({
        data: {
          organizationId: intake.organizationId,
          firstName: intake.childFirstName,
          lastName: intake.childLastName,
        },
      });

      const createdCase = await tx.case.create({
        data: {
          organizationId: intake.organizationId,
          childId: child.id,
          status: 'INTAKE',
        },
        include: {
          child: true,
        },
      });

      await tx.intakeRecord.update({
        where: { id: intake.id },
        data: { status: 'CONVERTED' },
      });

      await tx.caseAssignment.create({
        data: {
          caseId: createdCase.id,
          userId: user.id,
          roleLabel: 'Worker',
        },
      });

      return createdCase;
    });
  }
}
