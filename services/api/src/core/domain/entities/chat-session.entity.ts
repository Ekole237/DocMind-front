import { randomUUID } from 'crypto';

export class ChatSessionEntity {
  private constructor(
    private readonly _id: string,
    private readonly _userIdHash: string,
    private readonly _title: string,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(userIdHash: string, title: string): ChatSessionEntity {
    const now = new Date();
    return new ChatSessionEntity(randomUUID(), userIdHash, title, now, now);
  }

  static reconstitute(
    id: string,
    userIdHash: string,
    title: string,
    createdAt: Date,
    updatedAt: Date,
  ): ChatSessionEntity {
    return new ChatSessionEntity(id, userIdHash, title, createdAt, updatedAt);
  }

  get id(): string {
    return this._id;
  }
  get userIdHash(): string {
    return this._userIdHash;
  }
  get title(): string {
    return this._title;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}
