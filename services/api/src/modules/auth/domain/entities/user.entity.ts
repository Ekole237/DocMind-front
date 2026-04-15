import { Role } from '../enums/role';
import { Email } from '../values-objects/email.vo';
import { Password } from '../values-objects/password.vo';

export class User {
  private constructor(
    private readonly _id: string,
    private readonly _email: Email,
    private readonly _password: null | Password,
    private readonly _role: Role,
    private readonly _lastLogin: Date | null = null,
    private readonly _createdAt: Date = new Date(),
  ) {}

  static create(email: Email): User {
    const id = crypto.randomUUID();

    return new User(id, email, null, Role.EMPLOYEE);
  }

  static reconstitute(
    id: string,
    email: Email,
    password: null | Password,
    role: Role,
    lastLogin: Date | null,
    createdAt: Date,
  ): User {
    return new User(id, email, password, role, lastLogin, createdAt);
  }

  promoteToAdmin(): User {
    if (this._role === Role.ADMIN) {
      throw new Error('User is already an admin');
    }
    return new User(
      this.id,
      this._email,
      this._password,
      Role.ADMIN,
      this._lastLogin,
      this._createdAt,
    );
  }

  demoteToEmployee(): User {
    if (this._role === Role.EMPLOYEE) {
      throw new Error('User is already an employee');
    }
    return new User(
      this.id,
      this._email,
      this._password,
      Role.EMPLOYEE,
      this._lastLogin,

      this._createdAt,
    );
  }

  canLoginWithPassword(): boolean {
    return this._password !== null;
  }

  get roleLevel(): RoleLevel {
    return ROLE_LEVELS[this._role];
  }

  get id(): string {
    return this._id;
  }

  get password(): string | null {
    return this._password?.value || null;
  }

  get email(): string {
    return this._email.value;
  }

  get role(): Role {
    return this._role;
  }

  get lastLogin(): Date | null {
    return this._lastLogin;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}

export const ROLE_LEVELS = {
  [Role.EMPLOYEE]: 0,
  [Role.ADMIN]: 1,
};

export type RoleLevel = (typeof ROLE_LEVELS)[keyof typeof ROLE_LEVELS];
