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
