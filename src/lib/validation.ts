import { z } from "zod";

const requiredString = z
  .string()
  .trim()
  .min(1, "Trường này là bắt buộc");

export const signUpSchema = z.object({

  email: requiredString.email("Email không hợp lệ"),

  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "Chỉ được dùng chữ cái, số, dấu - và _",
  ),
  password: requiredString.min(
    8,
    "Mật khẩu phải có ít nhất 8 ký tự"
  ),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

// Tự động tạo type từ schema đăng nhập
export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: requiredString,
  mediaIds: z.array(z.string()).max(5, "5 cái thôi up gì lắm thế?"),
  groupId: z.string().optional(),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z.string().max(1000, "Must be at most 1000 characters"),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const createCommentSchema = z.object({
  content: requiredString,
});

export const createGroupSchema = z.object({
  name: requiredString.min(1).max(100, "Tên nhóm tối đa 100 ký tự"),
  description: z.string().max(500, "Miêu tả tối đa 500 ký tự").optional(),
  isPublic: z.boolean(),
});

export type CreateGroupValues = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = z.object({
  name: requiredString.min(1).max(100, "Tên nhóm tối đa 100 ký tự").optional(),
  description: z.string().max(500, "Miêu tả tối đa 500 ký tự").optional(),
  isPublic: z.boolean().optional(),
  avatarUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
});

export type UpdateGroupValues = z.infer<typeof updateGroupSchema>;

export const searchGroupsSchema = z.object({
  query: z.string().trim().optional(),
  isPublic: z.boolean().optional(),
  cursor: z.string().optional(),
});

export type SearchGroupsValues = z.infer<typeof searchGroupsSchema>;