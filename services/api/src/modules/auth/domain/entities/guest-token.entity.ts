import { randomUUID, UUID } from 'crypto';

export class GuestToken {
  private constructor(
    private readonly _id: UUID,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _email: string,
    private readonly _token: UUID,
    private readonly _used: boolean = false,
    private readonly _createdBy: string,
    private readonly _createdAt: Date = new Date(Date.now()),
    private readonly _expiresAt: Date,
  ) {}

  static create(
    email: string,
    firstName: string,
    lastName: string,
    expiresAt: Date,
    createdBy: string,
  ): GuestToken {
    if (!firstName || !lastName) {
      throw new Error('First name and last name are required');
    }
    if (expiresAt < new Date()) {
      throw new Error('Expires at must be a future date');
    }

    const id = randomUUID();
    const token = randomUUID();

    return new GuestToken(
      id,
      email,
      firstName,
      lastName,
      token,
      false,
      createdBy,
      new Date(),
      expiresAt,
    );
  }

  static reconstitute(
    id: UUID,
    email: string,
    firstName: string,
    lastName: string,
    token: UUID,
    used: boolean,
    createdBy: string,
    expiresAt: Date,
    createdAt: Date,
  ): GuestToken {
    return new GuestToken(
      id,
      email,
      firstName,
      lastName,
      token,
      used,
      createdBy,
      createdAt,
      expiresAt,
    );
  }

  isValid(): boolean {
    return !this._used && this._expiresAt > new Date();
  }

  canReuseGuestToken(): boolean {
    return this._used && this._expiresAt > new Date();
  }

  get id(): UUID {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get token(): UUID {
    return this._token;
  }

  get used(): boolean {
    return this._used;
  }

  get isGuest(): boolean {
    return true;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
