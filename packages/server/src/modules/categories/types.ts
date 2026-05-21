import { z } from "zod";
import { createCategorySchema, updateCategorySchema } from "@gasto/shared";

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  isDeleted: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryRepository {
  create(data: {
    userId: string;
    name: string;
    color?: string;
    icon?: string;
    isDefault?: boolean;
    sortOrder?: number;
  }): Promise<Category>;
  findByUser(userId: string): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  findByName(userId: string, name: string): Promise<Category | null>;
  update(
    id: string,
    data: Partial<{
      name: string;
      color: string;
      icon: string;
      sortOrder: number;
    }>
  ): Promise<Category>;
  softDelete(id: string): Promise<Category>;
  restore(id: string): Promise<Category>;
}
