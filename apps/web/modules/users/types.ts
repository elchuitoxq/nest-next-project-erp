import { CreateUserDto, UpdateUserDto, User as ApiUser } from "@/types/api";

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface User extends Omit<ApiUser, "email"> {
  email: string;
  roles: string[];
  roleIds?: string[];
  branches?: { id: string; name: string; isDefault: boolean }[];
  createdAt: string;
}

export type CreateUserValues = CreateUserDto;

export type UpdateUserValues = UpdateUserDto & { id: string };
