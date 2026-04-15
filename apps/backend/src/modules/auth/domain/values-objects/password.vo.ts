export class Password {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Password {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!regex.test(raw)) {
      throw new Error(
        'Password does not meet requirements. It must be at least 8 characters long and contain at least one letter and one number.',
      );
    }
    return new Password(raw);
  }

  static fromHashed(hashed: string): Password | null {
    if (!hashed) {
      return null;
    }
    return new Password(hashed);
  }

  get value(): string {
    return this._value;
  }
}
