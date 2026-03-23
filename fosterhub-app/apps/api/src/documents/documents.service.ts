import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByCase(caseId: string) {
    return this.prisma.document.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: true },
    });
  }

  async create(currentUserEmail: string, data: { caseId: string; title: string; fileName: string; contentType?: string; notes?: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: currentUserEmail } });
    if (!user) throw new Error('Authenticated user not found');

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
