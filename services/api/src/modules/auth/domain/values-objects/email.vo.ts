export class Email {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Email invalide');
    }
    return new Email(normalized);
  }

  get value(): string {
    return this._value;
  }
}
