import { ROLE_LEVELS } from '#auth/domain/entities/user.entity';
import { Role } from '#auth/domain/enums/role';
import { JwtPayload } from '#auth/domain/services/token.service';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles || requiredRoles.length === 0) return true;
    const roleLevel = requiredRoles.map((role) => ROLE_LEVELS[role]);

    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const userLevel: number = user?.role_level ?? -1;
    const minRequired = Math.min(...roleLevel);

    if (userLevel < minRequired) {
      throw new ForbiddenException(
        "Accès refusé. Vous n'avez pas les droits nécessaires.",
      );
    }
    return true;
  }
}
