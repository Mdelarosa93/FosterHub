import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByCase(caseId: string, currentUser: any) {
    return this.prisma.document.findMany({
      where: {
        caseId,
        case: currentUser.organizationId ? { organizationId: currentUser.organizationId } : undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: true },
    });
  }

  async create(currentUser: any, data: { caseId: string; title: string; fileName: string; contentType?: string; notes?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: currentUser.email } });
    if (!user) throw new Error('Authenticated user not found');

    const existingCase = await this.prisma.case.findFirst({
      where: {
        id: data.caseId,
        ...(currentUser.organizationId ? { organizationId: currentUser.organizationId } : {}),
      },
    });

    if (!existingCase) {
      throw new Error('Case not found in the active organization context');
    }

    return this.prisma.document.create({
      data: {
        caseId: data.caseId,
        title: data.title,
        fileName: data.fileName,
        contentType: data.contentType,
        notes: data.notes,
        uploadedByUserId: user.id,
      },
    });
  }
}
