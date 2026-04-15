import { PasswordService } from '#auth/domain/services/password.service';
import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';

@Injectable()
export class PasswordServiceImplementation implements PasswordService {
  hash(password: string): Promise<string> {
    return hash(password, 10);
  }
  compare(password: string, hashedPassword: string): Promise<boolean> {
    return compare(password, hashedPassword);
  }
}
