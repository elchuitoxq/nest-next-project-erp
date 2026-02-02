export interface Branch {
  id: string;
  name: string;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchValues {
  name: string;
  address?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface UpdateBranchValues extends Partial<CreateBranchValues> {
  id: string;
}
