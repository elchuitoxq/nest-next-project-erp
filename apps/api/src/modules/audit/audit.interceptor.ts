import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMetadata = this.reflector.get<{
      entityTable: string;
      action: string;
      description?: string;
    }>('audit', context.getHandler());

    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Assumes AuthGuard populates this
    const { entityTable, action } = auditMetadata;

    return next.handle().pipe(
      tap(async (data) => {
        // 'data' is the response from the controller method
        // For CREATE/UPDATE, it usually contains the new entity
        if (data && typeof data === 'object') {
          // Basic implementation: Log the entire object or specific changes
          // For strict audit, we might need 'oldValue' which is harder in interceptor
          // but for now capturing WHO did WHAT to WHICH ID is a huge step up.

          const entityId =
            data.id ||
            request.params.id ||
            data.order?.id ||
            data.invoice?.id ||
            data.payment?.id;

          if (entityId) {
            // Robust metadata extraction
            const resultData =
              data.order || data.invoice || data.payment || data;
            const documentCode =
              resultData.code ||
              resultData.invoiceNumber ||
              resultData.reference ||
              resultData.id?.substring(0, 8);
            let documentStatus = resultData.status;

            // Default status for payments as they often don't have a status field
            if (!documentStatus && entityTable === 'payments') {
              documentStatus = 'REGISTRADO';
            }

            // Robust changes capture
            // If UPDATE has no body (state transition), log result data as the state change
            const hasBody =
              request.body && Object.keys(request.body).length > 0;
            const changes =
              action === 'UPDATE' && !hasBody
                ? resultData
                : action === 'UPDATE'
                  ? request.body
                  : data;

            await this.auditService.logChange({
              entityTable,
              entityId,
              action,
              userId: user?.userId || user?.id || user?.sub,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
              changes,
              documentCode,
              documentStatus,
              description: auditMetadata.description,
            });
          }
        }
      }),
    );
  }
}
