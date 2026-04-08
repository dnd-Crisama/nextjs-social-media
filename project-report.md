# Báo Cáo Tiến Độ Dự Án – Mạng Xã Hội Next.js

> **Stack chính:** Next.js · TypeScript · TailwindCSS · Prisma · PostgreSQL · TanStack Query · Lucia Auth · Stream Chat · UploadThing

---

## Giai đoạn 1 — Khởi tạo & Cấu hình nền tảng
**16/02 – 17/02/2026** · Commits: `d9ef8fa`, `9426bb4`

Scaffold dự án bằng `create-next-app` (TypeScript + TailwindCSS + ESLint). Cài đặt toàn bộ dependency stack trong một commit: `@tanstack/react-query`, `@lucia-auth/adapter-prisma`, `@radix-ui/*`, `uploadthing`, `stream-chat`, `arctic`, `zod`, `tiptap`, v.v. Thiết lập `prettier.config.js` với `prettier-plugin-tailwindcss` và `components.json` cho shadcn/ui.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Gợi ý danh sách package; cấu hình `tailwind.config.ts` theo convention shadcn/ui |
| **Sinh viên quyết định** | Toàn bộ technology stack (Lucia Auth, Prisma, Stream Chat, UploadThing); cấu hình Prettier |

---

## Giai đoạn 2 — Xác thực người dùng & Database ban đầu
**19/02/2026** · Commits: `6eb14d3`, `ce7ac42`

Thiết kế schema Prisma (`User`, `Session`, `Post`). Triển khai luồng auth đầy đủ: đăng ký (argon2 hash), đăng nhập, middleware bảo vệ route. UI login/signup với `PasswordInput`, `LoadingButton`, Zod validation schema.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Skeleton auth actions; Zod schema; template `LoginForm`/`SignUpForm` với react-hook-form |
| **Sinh viên quyết định** | Schema Prisma; dùng `String @id` (không `@default(cuid())`) để tương thích Lucia Auth; thiết kế giao diện |

---

## Giai đoạn 3 — Layout, Session, Dark Mode & Core Feed
**07/03 – 10/03/2026** · Commits: `0c30563`, `9740408`, `8166c30`

Layout 2 tầng (`(auth)/` và `(main)/` với Navbar + Sidebar). `SessionProvider` dạng React Context. Feed chính với `useInfiniteQuery` + cursor-based pagination + `IntersectionObserver`. Dark mode (`next-themes`). `PostEditor` với Tiptap. **Optimistic update** cho create post — prepend vào cache không refetch toàn bộ.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Pattern `useInfiniteQuery` + cursor pagination; skeleton `useMediaUpload`; toast system |
| **Sinh viên quyết định** | Dùng `createdAt` thay offset cho cursor pagination; tích hợp dark mode; `TrendsSidebar` |

---

## Giai đoạn 4 — Core Social Features (Follow, CRUD, Profile)
**10/03 – 11/03/2026** · Commits: `ab7a75d`, `4427408`

- **Follow:** model `Follow` với `@@unique`, API toggle, `FollowButton` optimistic update
- **Like / Bookmark:** `@@unique(userId, postId)` tránh race condition, optimistic update
- **Comments:** `CommentInput`, `Comment`, `DeleteCommentDialog`
- **Notifications:** badge unread, infinite scroll, mark-as-read
- **Profile:** `EditProfileDialog` + `CropImageDialog` (react-cropper) + UploadThing avatar
- **Extras:** `UserTooltip`, `Linkify` cho URLs trong post

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Skeleton API route handlers; mutation hooks tương đồng (Like/Bookmark); DeleteCommentDialog boilerplate |
| **Sinh viên quyết định** | Dùng `@@unique` thay boolean để tránh race condition; optimistic rollback; `NotificationType` enum; UX crop ảnh |

---

## Giai đoạn 5 — Direct Message, Google OAuth & Search
**12/03/2026** · Commit: `e79d080`

- **DM:** tích hợp Stream Chat — `useInitializeChatClient`, `ChatSidebar`, `ChatChannel`, `NewChatDialog`, unread badge
- **Google OAuth:** arctic (PKCE + state) → callback → upsert user theo `googleId`
- **Search:** debounce (`useDebounce`), PostgreSQL full-text search cho cả user lẫn post

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Code mẫu `useInitializeChatClient`; Google OAuth flow với arctic |
| **Sinh viên quyết định** | Chọn Stream Chat (managed) thay Socket.io tự build; UX DM (sidebar + channel + new chat dialog); sinh viên tự đọc lại docs Stream SDK do API đã thay đổi |

---

## Giai đoạn 6 — Media Upload, Cover Image, Nested Comments & Emoji
**13/03/2026** · Commits: `f148d8c`, `2872dfd`

- **Cover image:** thêm `coverImageUrl` vào User, tab upload riêng, hiển thị fullwidth + gradient overlay
- **Nested comments:** `parentId` self-relation (2 tầng), render đệ quy, API handle root & replies
- **EmojiPicker:** wrap `emoji-picker-element` web component
- **Search nâng cao:** tab Users/Posts, highlight match, `unaccent` extension PostgreSQL

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Cú pháp Prisma self-relation `@relation("CommentReplies")`; EmojiPicker wrapper |
| **Sinh viên quyết định** | Giới hạn 2 tầng comment (UX); dùng `unaccent` cho search không dấu; UX gradient overlay |

---

## Giai đoạn 7 — Hệ thống Nhóm (Group Feature)
**14/03/2026** · Commits: `417e20c`, `8455705`

Schema: `Group`, `GroupMember` (role enum `MEMBER / MODERATOR / ADMIN`), `Post.groupId`. API: CRUD nhóm, kick/promote thành viên, generate/revoke invite code, join by code. Feed phân loại: ForYou / Following / Group. Hotfix: xóa ảnh group đúng cách qua UploadThing webhook khi group bị xóa.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Skeleton component (`GroupCard`, `GroupHeader`); CRUD API boilerplate; một số UI trong GroupSettings |
| **Sinh viên quyết định** | Chiến lược phân quyền 3 cấp; luồng invite code; phát hiện & hotfix bug cleanup media |

---

## Giai đoạn 8 — Profile Decoration & Gamification
**15/03/2026** · Commits: `74fd31b`, `790c87b`, `8455705`

Schema: `Frame` (rarity enum, type `AVATAR/BANNER/BOTH`), `FrameOwnership`, `UserBalance`, `UserActivity`, `QuestProgress`. Logic `recordActivity()` với daily cap, `deductBalance()`. Trang `/explore-frames` để mua khung. `DailyQuests` component. Admin `/admin` quản lý frame + kiểm duyệt. `UserAvatar` render `FrameOverlay`.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | `DailyQuests` component; pattern API quest (progress, claim, daily); `FrameOverlay` cơ bản |
| **Sinh viên quyết định** | Toàn bộ ý tưởng gamification (SPoints, Frame, rarity tiers); admin RBAC; `recordActivity()` daily cap logic |

---

## Giai đoạn 9 — AI Comment Moderation
**18/03/2026** · Commit: `d4ee6ee`

Tích hợp mô hình AI tự huấn luyện (Google Colab) để chấm điểm độc hại. `scoreComment()` gọi API với timeout 8s, **fail-open** (AI down → comment vẫn đăng). Logic phân cấp:

| Score | Hành động |
|---|---|
| > 0.95 | Xóa comment + log |
| > 0.75 | Flag + log + tăng `violationCount` |
| 3 violations | Ban 24h + invalidate toàn bộ session |

Schema bổ sung: `aiScore`, `aiFlag` trên Comment; `CommentModerationLog`; `violationCount`, `isBanned`, `bannedUntil` trên User. Middleware redirect về `/banned`. Admin xem moderation log.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Code Python huấn luyện mô hình trên Colab; code gọi API từ Render.com |
| **Sinh viên quyết định** | Ngưỡng 0.75/0.95; fail-open strategy; progressive ban (3 violations → 24h); `AbortSignal.timeout(8000)`; lưu `aiScore`/`aiFlag` để audit trail |

---
