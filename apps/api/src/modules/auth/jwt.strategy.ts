import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'secretKey',
    });
  }

  async validate(payload: any) {
    // Verify user exists in DB to prevent stale token issues (e.g. after DB reset)
    // Also fetch allowed branches for the user
    const { db, users, usersBranches } = await import('@repo/db');
    const { eq } = await import('drizzle-orm');

    const result = await db
      .select({
        id: users.id,
        branchId: usersBranches.branchId,
      })
      .from(users)
      .leftJoin(usersBranches, eq(users.id, usersBranches.userId))
      .where(eq(users.id, payload.sub));

    if (result.length === 0) {
      console.error('JwtStrategy Error: User not found in DB', {
        payloadSub: payload.sub,
      });
      // Log all users to see what's actually in DB? No, too noisy.
      throw new UnauthorizedException('User not found');
    }

    // Extract all branch IDs the user has access to
    const allowedBranches = result
      .map((r) => r.branchId)
      .filter((id): id is string => id !== null);

    return {
      id: payload.sub, // Consolidate to 'id' to match User interface
      userId: payload.sub, // Ensure backward compatibility with req.user.userId usage
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions || [],
      branchId: payload.branchId, // Default branch from token
      allowedBranches, // Required by BranchInterceptor
    };
  }
}
