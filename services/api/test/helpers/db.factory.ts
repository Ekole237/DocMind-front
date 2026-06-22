import { PrismaClient } from '#prisma/client';
import * as bcrypt from 'bcrypt';
import { hashUserId } from '../../src/core/utils/hash.util';

export async function seedAdminUser(
  prisma: PrismaClient,
  overrides: { id?: string; email?: string; password?: string } = {},
) {
  const passwordHash = await bcrypt.hash(
    overrides.password ?? 'StrongPass1!',
    10,
  );

  return prisma.user.create({
    data: {
      id: overrides.id ?? 'admin-test-id',
      email: overrides.email ?? 'admin@entreprise.com',
      password: passwordHash,
      role: 'ADMIN',
      lastLogin: null,
    },
  });
}

export async function seedEmployeeUser(
  prisma: PrismaClient,
  overrides: { id?: string; email?: string } = {},
) {
  return prisma.user.create({
    data: {
      id: overrides.id ?? 'employee-test-id',
      email: overrides.email ?? 'employee@entreprise.com',
      password: null,
      role: 'EMPLOYEE',
      lastLogin: null,
    },
  });
}

export async function seedGuestToken(
  prisma: PrismaClient,
  overrides: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    token?: string;
    used?: boolean;
    expiresAt?: Date;
    createdBy?: string;
  } = {},
) {
  const future = new Date();
  future.setDate(future.getDate() + 30);

  return prisma.guestToken.create({
    data: {
      id: overrides.id ?? 'guest-token-id',
      firstName: overrides.firstName ?? 'Jean',
      lastName: overrides.lastName ?? 'Dupont',
      email: overrides.email ?? 'guest@gmail.com',
      token: overrides.token ?? '11111111-1111-4111-a111-111111111111',
      used: overrides.used ?? false,
      expiresAt: overrides.expiresAt ?? future,
      createdBy: overrides.createdBy ?? 'admin-test-id',
    },
  });
}

export async function seedMagicLink(
  prisma: PrismaClient,
  overrides: {
    id?: string;
    guestEmail?: string;
    token?: string;
    used?: boolean;
    expiresAt?: Date;
  } = {},
) {
  const future = new Date();
  future.setMinutes(future.getMinutes() + 15);

  return prisma.magicLink.create({
    data: {
      id: overrides.id ?? 'magic-link-id',
      guestEmail: overrides.guestEmail ?? 'guest@gmail.com',
      token: overrides.token ?? '22222222-2222-4222-a222-222222222222',
      used: overrides.used ?? false,
      expiresAt: overrides.expiresAt ?? future,
    },
  });
}

export async function seedDocument(
  prisma: PrismaClient,
  overrides: {
    id?: string;
    title?: string;
    filePath?: string;
    mimeType?: string;
    status?: 'PENDING' | 'INDEXED' | 'DISABLED' | 'ERROR';
    chunkCount?: number;
  } = {},
) {
  return prisma.document.create({
    data: {
      id: overrides.id ?? 'doc-test-id',
      title: overrides.title ?? 'Politique_Conges_2025.pdf',
      filePath: overrides.filePath ?? '/tmp/test-uploads/test.pdf',
      mimeType: overrides.mimeType ?? 'application/pdf',
      confidentiality: 'PUBLIC',
      status: overrides.status ?? 'PENDING',
      chunkCount: overrides.chunkCount ?? 0,
      lastModified: new Date(),
    },
  });
}

export async function seedChatSession(
  prisma: PrismaClient,
  overrides: {
    id?: string;
    userIdHash?: string;
    title?: string;
  } = {},
) {
  return prisma.chatSession.create({
    data: {
      id: overrides.id ?? 'session-test-id',
      userIdHash: overrides.userIdHash ?? hashUserId('employee-test-id'),
      title: overrides.title ?? 'Test session',
    },
  });
}

export async function seedQueryLog(
  prisma: PrismaClient,
  overrides: {
    id?: string;
    userIdHash?: string;
    question?: string;
    answer?: string;
    chatSessionId?: string;
    sourceDocId?: string;
    sourceDocName?: string;
    role?: string;
    isGuest?: boolean;
    isFlagged?: boolean;
    isIgnorance?: boolean;
    responseTimeMs?: number;
  } = {},
) {
  return prisma.queryLog.create({
    data: {
      id: overrides.id ?? 'query-log-id',
      userIdHash: overrides.userIdHash ?? hashUserId('employee-test-id'),
      question: overrides.question ?? 'Combien de jours de congés ?',
      answer: overrides.answer ?? '25 jours ouvrables par an.',
      chatSessionId: overrides.chatSessionId ?? 'session-test-id',
      sourceDocId: overrides.sourceDocId ?? 'doc-test-id',
      sourceDocName: overrides.sourceDocName ?? 'Politique_Conges_2025.pdf',
      role: overrides.role ?? 'EMPLOYEE',
      isGuest: overrides.isGuest ?? false,
      isFlagged: overrides.isFlagged ?? false,
      isIgnorance: overrides.isIgnorance ?? false,
      responseTimeMs: overrides.responseTimeMs ?? 1200,
    },
  });
}

export async function seedFeedback(
  prisma: PrismaClient,
  overrides: {
    id?: string;
    queryLogId?: string;
    comment?: string;
    status?: 'PENDING' | 'RESOLVED';
  } = {},
) {
  return prisma.feedback.create({
    data: {
      id: overrides.id ?? 'feedback-id',
      queryLogId: overrides.queryLogId ?? 'query-log-id',
      comment: overrides.comment ?? 'Réponse incorrecte',
      status: overrides.status ?? 'PENDING',
    },
  });
}

export async function cleanDatabase(prisma: PrismaClient) {
  await prisma.feedback.deleteMany();
  await prisma.queryLog.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.document.deleteMany();
  await prisma.magicLink.deleteMany();
  await prisma.guestToken.deleteMany();
  await prisma.user.deleteMany();
}
