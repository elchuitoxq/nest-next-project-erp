import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class BranchInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const branchHeader = request.headers['x-branch-id'];

    if (!user) {
      // Public endpoint or guard failed before this
      return next.handle();
    }

    if (branchHeader) {
      const allowedBranches = user.allowedBranches || [];
      const isAdmin = user.roles?.includes('admin');

      // Admin can access any branch, or we strictly check against allowed?
      // Usually admins have explicit access, but let's assume Super Admin has global access.
      // For now, let's enforce checking `allowedBranches` even for admins if we want strict assignment,
      // OR we can trust `allowedBranches` which technically should include all if admin is assigned all.
      // But commonly "Admin" role might imply superuser.
      // Let's stick to: check if branch is in allowedBranches.
      // Note: If we want Admin to access ALL, we need to ensure `allowedBranches` is populated correctly
      // or we bypass check for 'admin'.

      // Decision: Check allowedBranches. Admin assignment should handle access.
      // Exception: If user claims to be admin but has no branch assigned, what then?
      // Let's assume validation against allowedBranches is safer.

      if (!isAdmin && !allowedBranches.includes(branchHeader)) {
        throw new UnauthorizedException(
          'You do not have access to this branch',
        );
      }

      // Double check for admin? If admin, maybe we authorize?
      // Let's allow 'admin' role to bypass for flexibility during dev/admin tasks if needed,
      // but ideally admins should be assigned branches too.
      // Let's allow 'admin' to bypass for now to avoid locking out superusers.
      if (!allowedBranches.includes(branchHeader) && !isAdmin) {
        throw new UnauthorizedException(
          'You do not have access to this branch',
        );
      }

      request.branchId = branchHeader;
    } else {
      // Fallback to default branch from token
      request.branchId = user.branchId;
    }

    if (!request.branchId) {
      // If no branch context can be established, it might be an issue for branch-scoped data.
      // But some endpoints might not need it. We'll leave it undefined.
    }

    return next.handle();
  }
}
