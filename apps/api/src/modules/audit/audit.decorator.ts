import { SetMetadata } from '@nestjs/common';

export const Audit = (
  entityTable: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  description?: string,
) => SetMetadata('audit', { entityTable, action, description });
