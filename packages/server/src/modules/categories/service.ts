import { notFound, conflict } from "../../shared/errors.js";
import { CategoryRepository, Category, CreateCategoryInput, UpdateCategoryInput } from "./types.js";
import { seedDefaultCategories } from "./seed.js";

export class CategoryService {
  constructor(private repo: CategoryRepository) {}

  async create(userId: string, dto: CreateCategoryInput): Promise<Category> {
    const existing = await this.repo.findByName(userId, dto.name);
    if (existing) {
      throw conflict("Category name already exists");
    }

    return this.repo.create({
      userId,
      name: dto.name,
      color: dto.color,
      icon: dto.icon,
    });
  }

  async list(userId: string): Promise<Category[]> {
    return this.repo.findByUser(userId);
  }

  async update(userId: string, id: string, dto: UpdateCategoryInput): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category || category.userId !== userId) {
      throw notFound("Category not found");
    }

    if (dto.name && dto.name !== category.name) {
      const existing = await this.repo.findByName(userId, dto.name);
      if (existing) {
        throw conflict("Category name already exists");
      }
    }

    return this.repo.update(id, dto);
  }

  async softDelete(userId: string, id: string): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category || category.userId !== userId) {
      throw notFound("Category not found");
    }

    return this.repo.softDelete(id);
  }

  async restore(userId: string, id: string): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category || category.userId !== userId) {
      throw notFound("Category not found");
    }

    return this.repo.restore(id);
  }

  async seedDefaults(userId: string): Promise<void> {
    await seedDefaultCategories(userId);
  }
}
