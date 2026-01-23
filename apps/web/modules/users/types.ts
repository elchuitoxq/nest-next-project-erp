export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[];
  roleIds?: string[];
  branches?: { id: string; name: string; isDefault: boolean }[];
  createdAt: string;
}

export interface CreateUserValues {
  name: string;
  email: string;
  password?: string;
  roleIds: string[];
  branchIds?: string[];
}

export interface UpdateUserValues extends Partial<CreateUserValues> {
  id: string;
}
