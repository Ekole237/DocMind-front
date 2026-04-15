import { JwtPayload, TokenService } from '#auth/domain/services/token.service';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenServiceImplementation implements TokenService {
  constructor(private readonly _jwtService: JwtService) {}

  async generate(payload: JwtPayload): Promise<string> {
    return await this._jwtService.signAsync(payload);
  }
  async decode(token: string): Promise<JwtPayload> {
    return await this._jwtService.verifyAsync(token);
  }
}
