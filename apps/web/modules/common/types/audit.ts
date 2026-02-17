export interface AuditLog {
  id: string;
  entityTable: string;
  entityId: string;
  action: string;
  changes: any;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  documentCode?: string;
  documentStatus?: string;
  description?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}
