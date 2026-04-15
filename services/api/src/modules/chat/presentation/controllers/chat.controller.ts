import { JwtPayload } from '#auth/domain/services/token.service';
import { JwtGuard } from '#auth/presentation/guards/jwt.guard';
import { GetHistoryDto } from '#chat/application/dto/get-history.dto';
import { QueryDto } from '#chat/application/dto/query.dto';
import { SubmitFeedbackDto } from '#chat/application/dto/submit-feedback.dto';
import { GetHistoryUseCase } from '#chat/application/use-cases/get-history.use-case';
import { QueryRagUseCase } from '#chat/application/use-cases/query-rag.use-case';
import { SubmitFeedbackUseCase } from '#chat/application/use-cases/submit-feedback.use-case';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

@Controller('chat')
@UseGuards(JwtGuard)
export class ChatController {
  constructor(
    private readonly _queryRagUseCase: QueryRagUseCase,
    private readonly _submitFeedbackUseCase: SubmitFeedbackUseCase,
    private readonly _getHistoryUseCase: GetHistoryUseCase,
  ) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  query(@Body() dto: QueryDto, @Request() req: { user: JwtPayload }) {
    const { sub, role, role_level, is_guest } = req.user;
    return this._queryRagUseCase.execute(
      dto,
      sub,
      role,
      role_level,
      is_guest ?? false,
    );
  }

  @Post('feedback')
  @HttpCode(HttpStatus.CREATED)
  feedback(
    @Body() dto: SubmitFeedbackDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this._submitFeedbackUseCase.execute(dto, req.user.sub);
  }

  @Get('history')
  history(@Query() dto: GetHistoryDto, @Request() req: { user: JwtPayload }) {
    return this._getHistoryUseCase.execute(dto, req.user.sub);
  }
}
