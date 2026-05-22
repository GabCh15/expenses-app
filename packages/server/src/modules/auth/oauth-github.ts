import { env } from "../../config/env.js";
import { GitHubProfile } from "./types.js";

export function getGitHubAuthURL(): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID ?? "",
    redirect_uri: env.GITHUB_CALLBACK_URL ?? "",
    scope: "read:user user:email",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function getGitHubAccessToken(code: string): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange GitHub code for access token");
  }

  const data = (await response.json()) as {
    access_token?: string;
    error?: string;
  };

  if (data.error || !data.access_token) {
    throw new Error(data.error ?? "Failed to obtain GitHub access token");
  }

  return data.access_token;
}

export async function getGitHubUser(
  accessToken: string
): Promise<GitHubProfile> {
  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "gasto-app",
      },
    }),
    fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "gasto-app",
      },
    }),
  ]);

  if (!userRes.ok || !emailsRes.ok) {
    throw new Error("Failed to fetch GitHub user profile");
  }

  const user = (await userRes.json()) as {
    id: number;
    login: string;
    name?: string;
    email?: string | null;
    avatar_url?: string;
  };

  const emails = (await emailsRes.json()) as Array<{
    email: string;
    primary: boolean;
    verified: boolean;
  }>;

  const primaryEmail =
    emails.find((e) => e.primary && e.verified)?.email ??
    user.email ??
    "";

  return {
    githubId: String(user.id),
    email: primaryEmail,
    displayName: user.name ?? user.login,
    avatarUrl: user.avatar_url,
  };
}
