import { SetMetadata } from '@nestjs/common';

export const Audit = (
  entityTable: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT',
  description?: string,
) => SetMetadata('audit', { entityTable, action, description });
