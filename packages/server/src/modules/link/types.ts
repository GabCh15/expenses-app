export interface LinkToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface LinkRepository {
  createToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<LinkToken>;
  findByToken(token: string): Promise<LinkToken | null>;
  markUsed(id: string): Promise<void>;
  countRecentAttempts(userId: string): Promise<number>;
  deleteExpired(): Promise<void>;
}
