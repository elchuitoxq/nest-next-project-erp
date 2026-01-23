import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey', // In production use proper env var
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
      throw new UnauthorizedException('User not found');
    }

    // Extract all branch IDs the user has access to
    const allowedBranches = result
      .map((r) => r.branchId)
      .filter((id): id is string => id !== null);

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      branchId: payload.branchId, // Default branch from token
      allowedBranches, // List of all allowed branches
    };
  }
}
