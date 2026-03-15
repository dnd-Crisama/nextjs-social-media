import { Prisma } from "@/generated/prisma";

export function getUserDataSelect(loggedInUserId: string) {
  return {
    id: true,
    username: true,
    displayName: true,
    avatarUrl: true,
    coverImageUrl: true, 
    bio: true,
    avatarFrameId: true,
    bannerFrameId: true,
    avatarFrame: true,
    bannerFrame: true,
    createdAt: true,
    followers: {
      where: { followerId: loggedInUserId },
      select: { followerId: true },
    },
    _count: {
      select: { posts: true, followers: true },
    },
  } satisfies Prisma.UserSelect;
}

export type UserData = Prisma.UserGetPayload<{
  select: ReturnType<typeof getUserDataSelect>;
}>;

export function getPostDataInclude(loggedInUserId: string) {
  return {
    user: { select: getUserDataSelect(loggedInUserId) },
    group: {
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    },
    attachments: true,
    likes: {
      where: { userId: loggedInUserId },
      select: { userId: true },
    },
    bookmarks: {
      where: { userId: loggedInUserId },
      select: { userId: true },
    },
    _count: {
      select: { likes: true, comments: true },
    },
  } satisfies Prisma.PostInclude;
}

export type PostData = Prisma.PostGetPayload<{
  include: ReturnType<typeof getPostDataInclude>;
}>;

export interface PostsPage {
  posts: PostData[];
  nextCursor: string | null;
}

// Base include (no replies) — dùng cho level 2 (tầng sâu nhất)
export function getCommentDataIncludeBase(loggedInUserId: string) {
  return {
    user: { select: getUserDataSelect(loggedInUserId) },
  } satisfies Prisma.CommentInclude;
}

// Full include (có replies 2 tầng) — dùng cho root và level 1
export function getCommentDataInclude(loggedInUserId: string) {
  return {
    user: { select: getUserDataSelect(loggedInUserId) },
    replies: {
      include: {
        user: { select: getUserDataSelect(loggedInUserId) },
        replies: {
          include: {
            user: { select: getUserDataSelect(loggedInUserId) },
          },
          orderBy: { createdAt: "asc" as const },
        },
      },
      orderBy: { createdAt: "asc" as const },
    },
  } satisfies Prisma.CommentInclude;
}

// Base Prisma type (level 2 — không có replies)
type CommentDataBase = Prisma.CommentGetPayload<{
  include: ReturnType<typeof getCommentDataIncludeBase>;
}>;

// Manual recursive type để TypeScript không bị confused bởi nested Prisma types
export interface CommentData extends CommentDataBase {
  replies: CommentData[];
}

export interface CommentsPage {
  comments: CommentData[];
  previousCursor: string | null;
}

export const notificationsInclude = {
  issuer: {
    select: {
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  post: {
    select: { content: true },
  },
} satisfies Prisma.NotificationInclude;

export type NotificationData = Prisma.NotificationGetPayload<{
  include: typeof notificationsInclude;
}>;

export interface NotificationsPage {
  notifications: (NotificationData & { latestComment: string | null })[];
  nextCursor: string | null;
}

export interface FollowerInfo {
  followers: number;
  isFollowedByUser: boolean;
}

export interface LikeInfo {
  likes: number;
  isLikedByUser: boolean;
}

export interface BookmarkInfo {
  isBookmarkedByUser: boolean;
}

export interface NotificationCountInfo {
  unreadCount: number;
}

export interface MessageCountInfo {
  unreadCount: number;
}

export function getGroupDataSelect() {
  return {
    id: true,
    name: true,
    description: true,
    avatarUrl: true,
    coverImageUrl: true,
    userId: true,
    isPublic: true,
    createdAt: true,
    _count: {
      select: { members: true, posts: true },
    },
  } satisfies Prisma.GroupSelect;
}

export type GroupData = Prisma.GroupGetPayload<{
  select: ReturnType<typeof getGroupDataSelect>;
}>;

export function getGroupDetailInclude(loggedInUserId: string) {
  return {
    creator: { select: getUserDataSelect(loggedInUserId) },
    members: {
      include: {
        user: { select: getUserDataSelect(loggedInUserId) },
      },
      orderBy: { createdAt: "asc" as const },
    },
    _count: {
      select: { members: true, posts: true },
    },
  } satisfies Prisma.GroupInclude;
}

export type GroupDetail = Prisma.GroupGetPayload<{
  include: ReturnType<typeof getGroupDetailInclude>;
}>;

export interface GroupsPage {
  groups: GroupData[];
  nextCursor: string | null;
}