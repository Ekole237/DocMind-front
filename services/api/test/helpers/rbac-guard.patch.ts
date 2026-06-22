import { RbacGuard } from '#auth/presentation/guards/rbac.guard';
import { ROLE_LEVELS } from '#auth/domain/entities/user.entity';
import { Role } from '#auth/domain/enums/role';
import { JwtPayload } from '#auth/domain/services/token.service';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

RbacGuard.prototype.canActivate = function canActivate(
  context: ExecutionContext,
): boolean {
  const requiredRoles = this.reflector.getAllAndOverride('roles', [
    context.getHandler(),
    context.getClass(),
  ]);
  if (!requiredRoles || requiredRoles.length === 0) return true;
  const roleLevels = requiredRoles.map((role) => ROLE_LEVELS[role]);

  const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
  const userLevel: number = user?.role_level ?? -1;
  const minRequired = Math.min(...roleLevels);

  if (userLevel < minRequired) {
    throw new ForbiddenException(
      "Accès refusé. Vous n'avez pas les droits nécessaires.",
    );
  }
  return true;
};
