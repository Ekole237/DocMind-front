export const PASSWORD_SERVICE = Symbol('PasswordService');

export interface PasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
}
