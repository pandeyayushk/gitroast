export type DeveloperRepository = {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  starCount: number;
  forkCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  pushedAt: string | null;
  isArchived: boolean;
  visibility: "public" | "private" | "internal" | null;
  defaultBranch: string | null;
};

export type DeveloperProfile = {
  username: string;
  displayName: string | null;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  location: string | null;
  accountCreatedAt: string;
  followerCount: number;
  followingCount: number;
  publicRepositoryCount: number;
  repositories: DeveloperRepository[];
};
