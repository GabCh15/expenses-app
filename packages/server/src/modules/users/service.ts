import { notFound } from "../../shared/errors.js";
import { UserRepository, User, UpdateProfileInput } from "./types.js";
import { LinkService } from "../link/service.js";

export class UserService {
  constructor(
    private repo: UserRepository,
    private linkService: LinkService
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw notFound("User not found");
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileInput): Promise<User> {
    await this.getProfile(userId); // verify user exists
    return this.repo.update(userId, dto);
  }

  async linkTelegram(webUserId: string, token: string): Promise<string> {
    return this.linkService.verifyToken(webUserId, token);
  }

  async unlinkTelegram(userId: string): Promise<void> {
    await this.getProfile(userId); // verify user exists
    await this.repo.unlinkTelegram(userId);
  }
}
