import { randomUUID } from 'crypto';

export class QueryLogEntity {
  private constructor(
    private readonly _id: string,
    private readonly _userIdHash: string,
    private readonly _question: string,
    private readonly _answer: string,
    private readonly _role: string,
    private readonly _isGuest: boolean,
    private readonly _isFlagged: boolean,
    private readonly _isIgnorance: boolean,
    private readonly _timestamp: Date,
    private readonly _sourceDocId: string | null,
    private readonly _sourceDocName: string | null,
    private readonly _sourceDriveUrl: string | null,
    private readonly _responseTimeMs: number | null,
  ) {}

  static create(
    userIdHash: string,
    question: string,
    answer: string,
    role: string,
    isGuest: boolean,
    isIgnorance: boolean,
    sourceDocId: string | null,
    sourceDocName: string | null,
    sourceDriveUrl: string | null,
    responseTimeMs: number | null,
  ): QueryLogEntity {
    return new QueryLogEntity(
      randomUUID(),
      userIdHash,
      question.trim(),
      answer.trim(),
      role,
      isGuest,
      false,
      isIgnorance,
      new Date(),
      sourceDocId,
      sourceDocName,
      sourceDriveUrl,
      responseTimeMs,
    );
  }

  static reconstitute(
    id: string,
    userIdHash: string,
    question: string,
    answer: string,
    role: string,
    isGuest: boolean,
    isFlagged: boolean,
    isIgnorance: boolean,
    timestamp: Date,
    sourceDocId: string | null,
    sourceDocName: string | null,
    sourceDriveUrl: string | null,
    responseTimeMs: number | null,
  ): QueryLogEntity {
    return new QueryLogEntity(
      id,
      userIdHash,
      question,
      answer,
      role,
      isGuest,
      isFlagged,
      isIgnorance,
      timestamp,
      sourceDocId,
      sourceDocName,
      sourceDriveUrl,
      responseTimeMs,
    );
  }

  get id(): string { return this._id; }
  get userIdHash(): string { return this._userIdHash; }
  get question(): string { return this._question; }
  get answer(): string { return this._answer; }
  get role(): string { return this._role; }
  get isGuest(): boolean { return this._isGuest; }
  get isFlagged(): boolean { return this._isFlagged; }
  get isIgnorance(): boolean { return this._isIgnorance; }
  get timestamp(): Date { return this._timestamp; }
  get sourceDocId(): string | null { return this._sourceDocId; }
  get sourceDocName(): string | null { return this._sourceDocName; }
  get sourceDriveUrl(): string | null { return this._sourceDriveUrl; }
  get responseTimeMs(): number | null { return this._responseTimeMs; }
}
