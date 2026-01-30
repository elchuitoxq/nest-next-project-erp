import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/access-control.decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    // Use optional chaining for safety, though user should exist if JwtAuthGuard ran first
    if (!user || !user.roles) {
      return false;
    }

    // Check if user has ANY of the required roles
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
