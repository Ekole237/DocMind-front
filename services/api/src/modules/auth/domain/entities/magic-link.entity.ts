import { randomUUID, type UUID } from 'crypto';

export class MagicLink {
  private constructor(
    private readonly _id: string,
    private readonly _guestEmail: string,
    private readonly _token: UUID,
    private readonly _used: boolean = false,
    private readonly _expiresAt: Date,
    private readonly _createdAt: Date = new Date(Date.now()),
  ) {}

  static create(guestEmail: string): MagicLink {
    if (!guestEmail) {
      throw new Error('Guest email is required');
    }

    const id = randomUUID();
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

    return new MagicLink(
      id,
      guestEmail,
      token,
      false,
      expiresAt,
      new Date(Date.now()),
    );
  }

  static reconstitute(
    id: string,
    guestEmail: string,
    token: UUID,
    used: boolean,
    expiresAt: Date,
    createdAt: Date,
  ): MagicLink {
    return new MagicLink(id, guestEmail, token, used, expiresAt, createdAt);
  }

  get id(): string {
    return this._id;
  }

  get guestEmail(): string {
    return this._guestEmail;
  }

  get token(): UUID {
    return this._token;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get used(): boolean {
    return this._used;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  isValid(): boolean {
    return !this._used && !this.isExpired();
  }
}
