import { ClassifyDocumentDto } from '#admin/application/dtos/classify-document.dto';
import { CreateGuestTokenDto } from '#admin/application/dtos/create-guest-token.dto';
import { ExtendGuestTokenDto } from '#admin/application/dtos/extend-guest-token.dto';
import { ClassifyDocumentUseCase } from '#admin/application/use-cases/classify-document.use-case';
import { CreateGuestTokenUseCase } from '#admin/application/use-cases/create-guest-token.use-case';
import { DashboardUseCase } from '#admin/application/use-cases/dashboard.use-case';
import { DeleteDocumentUseCase } from '#admin/application/use-cases/delete-document.use-case';
import { DisableDocumentUseCase } from '#admin/application/use-cases/disable-document.use-case';
import { EnableDocumentUseCase } from '#admin/application/use-cases/enable-document.use-case';
import { ExtendGuestTokenUseCase } from '#admin/application/use-cases/extend-guest-token.use-case';
import {
  ImportDocumentUseCase,
} from '#admin/application/use-cases/import-document.use-case';
import { IndexDocumentUseCase } from '#admin/application/use-cases/index-document.use-case';
import { ListAllDocumentsUseCase } from '#admin/application/use-cases/list-all-documents.use-case';
import { ListFeedbacksUseCase } from '#admin/application/use-cases/list-feelbacks.use-case';
import { ListGuestTokensUseCase } from '#admin/application/use-cases/list-guest-tokens.use-case';
import { ListQueryLogsUseCase } from '#admin/application/use-cases/list-query.use-case';
import { ReindexAllUseCase } from '#admin/application/use-cases/reindex-all.use-case';
import { ResolveFeedbackUseCase } from '#admin/application/use-cases/resolve-feedback.use-case';
import { RevokeGuestTokenUseCase } from '#admin/application/use-cases/revoke-guest-token.use-case';
import { Confidentiality } from '#admin/domain/enums/confidentiality';
import { Role } from '#auth/domain/enums/role';
import { JwtPayload } from '#auth/domain/services/token.service';
import { Roles } from '#auth/presentation/decorators/roles.decorator';
import { JwtGuard } from '#auth/presentation/guards/jwt.guard';
import { RbacGuard } from '#auth/presentation/guards/rbac.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MultipartValue } from '@fastify/multipart';
import { FastifyRequest } from 'fastify';
import { FeedbackStatus } from 'src/core/domain/enums/feedback-status';

@Controller('admin')
@UseGuards(JwtGuard, RbacGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly _dashboardUseCase: DashboardUseCase,
    private readonly _listAllDocumentsUseCase: ListAllDocumentsUseCase,
    private readonly _importDocumentUseCase: ImportDocumentUseCase,
    private readonly _classifyDocumentUseCase: ClassifyDocumentUseCase,
    private readonly _indexDocumentUseCase: IndexDocumentUseCase,
    private readonly _disableDocumentUseCase: DisableDocumentUseCase,
    private readonly _enableDocumentUseCase: EnableDocumentUseCase,
    private readonly _deleteDocumentUseCase: DeleteDocumentUseCase,
    private readonly _listFeedbacksUseCase: ListFeedbacksUseCase,
    private readonly _resolveFeedbackUseCase: ResolveFeedbackUseCase,
    private readonly _listQueryLogsUseCase: ListQueryLogsUseCase,
    private readonly _reindexAllUseCase: ReindexAllUseCase,
    private readonly _listGuestTokensUseCase: ListGuestTokensUseCase,
    private readonly _createGuestTokenUseCase: CreateGuestTokenUseCase,
    private readonly _extendGuestTokenUseCase: ExtendGuestTokenUseCase,
    private readonly _revokeGuestTokenUseCase: RevokeGuestTokenUseCase,
  ) {}

  @Get('dashboard')
  async dashboard() {
    return await this._dashboardUseCase.execute();
  }

  @Get('documents')
  async listDocuments() {
    return await this._listAllDocumentsUseCase.execute();
  }

  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  async importDocument(@Request() req: FastifyRequest) {
    const data = await req.file();

    if (!data) {
      throw new BadRequestException('Un fichier est requis.');
    }

    const fields = data.fields as Record<string, MultipartValue<string>>;
    const title = fields['title']?.value?.trim();
    const confidentialityRaw = fields['confidentiality']?.value?.trim();

    if (!title) {
      throw new BadRequestException('Le champ title est requis.');
    }

    if (!confidentialityRaw || !Object.values(Confidentiality).includes(confidentialityRaw as Confidentiality)) {
      throw new BadRequestException(
        `Le champ confidentiality est requis. Valeurs acceptées : ${Object.values(Confidentiality).join(', ')}.`,
      );
    }

    const buffer = await data.toBuffer();

    return this._importDocumentUseCase.execute(
      { title, confidentiality: confidentialityRaw as Confidentiality },
      { buffer, originalName: data.filename, mimeType: data.mimetype },
    );
  }

  @Patch('documents/:id/classify')
  async classifyDocument(
    @Param('id') id: string,
    @Body() dto: ClassifyDocumentDto,
  ) {
    return await this._classifyDocumentUseCase.execute(id, dto);
  }

  @Post('documents/:id/index')
  @HttpCode(HttpStatus.ACCEPTED)
  async indexDocument(@Param('id') id: string) {
    await this._indexDocumentUseCase.execute(id);

    return {
      status: 'indexation_started',
      documentId: id,
      startedAt: new Date().toISOString(),
      message:
        "L'indexation est en cours. Le statut sera mis à jour dans quelques secondes.",
    };
  }

  @Patch('documents/:id/disable')
  async disableDocument(@Param('id') id: string) {
    return await this._disableDocumentUseCase.execute(id);
  }

  @Patch('documents/:id/enable')
  @HttpCode(HttpStatus.ACCEPTED)
  async enableDocument(@Param('id') id: string) {
    await this._enableDocumentUseCase.execute(id);

    return {
      status: 'indexation_started',
      documentId: id,
      message: 'Réactivation et réindexation en cours.',
    };
  }

  @Delete('documents/:id')
  async deleteDocument(@Param('id') id: string) {
    await this._deleteDocumentUseCase.execute(id);

    return {
      deleted: true,
      documentId: id,
      message: 'Document et chunks supprimés définitivement.',
    };
  }

  @Get('feedbacks')
  async listFeedbacks(
    @Query('status') status?: FeedbackStatus | 'all',
    @Query('page') page?: string,
  ) {
    return await this._listFeedbacksUseCase.execute({
      status: status ?? FeedbackStatus.PENDING,
      page: page ? parseInt(page, 10) : 1,
    });
  }

  @Patch('feedbacks/:id/resolve')
  async resolveFeedback(@Param('id') id: string) {
    return await this._resolveFeedbackUseCase.execute(id);
  }

  @Get('logs')
  async listLogs(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('role') role?: string,
    @Query('flagged') flagged?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return await this._listQueryLogsUseCase.execute({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      role,
      flagged: flagged !== undefined ? flagged === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Post('reindex')
  @HttpCode(HttpStatus.ACCEPTED)
  async reindex(@Body() body: { confirm: boolean }) {
    if (!body.confirm) {
      return {
        status: 'cancelled',
        message: 'Confirmation requise. Envoyez confirm: true.',
      };
    }

    await this._reindexAllUseCase.execute();

    return {
      status: 'indexation_started',
      startedAt: new Date().toISOString(),
      message:
        'La réindexation est en cours. Elle sera complétée dans quelques minutes.',
    };
  }

  @Get('guests')
  async listGuests(
    @Query('active') active?: string,
    @Query('page') page?: string,
  ) {
    return await this._listGuestTokensUseCase.execute({
      active: active !== undefined ? active === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
    });
  }

  @Post('guests')
  @HttpCode(HttpStatus.CREATED)
  async createGuest(
    @Body() dto: CreateGuestTokenDto,
    @Request() req: { user: JwtPayload },
  ) {
    return await this._createGuestTokenUseCase.execute(dto, req.user.sub);
  }

  @Patch('guests/:id/extend')
  async extendGuest(@Param('id') id: string, @Body() dto: ExtendGuestTokenDto) {
    return await this._extendGuestTokenUseCase.execute(id, dto);
  }

  @Delete('guests/:id')
  async revokeGuest(@Param('id') id: string) {
    await this._revokeGuestTokenUseCase.execute(id);

    return {
      deleted: true,
      guestTokenId: id,
      message: "Token GUEST révoqué. L'accès est immédiatement coupé.",
    };
  }
}
