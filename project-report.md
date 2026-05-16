# Báo Cáo Tiến Độ Dự Án - Mạng Xã Hội Next.js

> **Stack chính:** Next.js, TypeScript, TailwindCSS, Prisma, PostgreSQL, TanStack Query, Lucia Auth, Stream Chat, UploadThing

---

## Giai đoạn 1 - Khởi tạo & cấu hình nền tảng
**16/02 - 17/02/2026** · Commits: `d9ef8fa`, `9426bb4`

Scaffold dự án bằng `create-next-app` với TypeScript, TailwindCSS và ESLint. Cài đặt các dependency chính: `@tanstack/react-query`, `@lucia-auth/adapter-prisma`, `@radix-ui/*`, `uploadthing`, `stream-chat`, `arctic`, `zod`, `tiptap`, v.v. Thiết lập `prettier.config.js` với `prettier-plugin-tailwindcss` và `components.json` cho shadcn/ui.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Gợi ý danh sách package; hỗ trợ cấu hình Tailwind theo convention shadcn/ui |
| **Sinh viên quyết định** | Chọn stack chính: Lucia Auth, Prisma, Stream Chat, UploadThing; cấu hình Prettier và cấu trúc thư mục ban đầu |

---

## Giai đoạn 2 - Xác thực người dùng & database ban đầu
**19/02/2026** · Commits: `6eb14d3`, `ce7ac42`

Thiết kế schema Prisma ban đầu gồm `User`, `Session`, `Post`. Triển khai luồng xác thực đầy đủ: đăng ký, đăng nhập, hash mật khẩu bằng `argon2`, middleware bảo vệ route, UI login/signup với `PasswordInput`, `LoadingButton` và Zod validation schema.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Skeleton server actions cho auth; Zod schema; template form đăng nhập/đăng ký với react-hook-form |
| **Sinh viên quyết định** | Thiết kế schema Prisma; dùng `String @id` để tương thích Lucia Auth; thiết kế giao diện xác thực |

---

## Giai đoạn 3 - Layout, session, dark mode & core feed
**07/03 - 10/03/2026** · Commits: `0c30563`, `9740408`, `8166c30`

Xây dựng layout hai nhóm route `(auth)` và `(main)`, gồm Navbar, Sidebar và `SessionProvider` dạng React Context. Feed chính dùng `useInfiniteQuery`, cursor-based pagination và `IntersectionObserver`. Tích hợp dark mode bằng `next-themes`. Xây dựng `PostEditor` với Tiptap và optimistic update khi tạo bài viết để prepend bài mới vào cache mà không cần refetch toàn bộ.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Pattern `useInfiniteQuery`; cursor pagination; skeleton `useMediaUpload`; toast system |
| **Sinh viên quyết định** | Dùng `createdAt` cho cursor pagination; tích hợp dark mode; xây dựng `TrendsSidebar` |

---

## Giai đoạn 4 - Core Social Features: Follow, CRUD, Profile
**10/03 - 11/03/2026** · Commits: `ab7a75d`, `4427408`

- **Follow:** model `Follow` với `@@unique`, API toggle và `FollowButton` optimistic update.
- **Like / Bookmark:** dùng unique constraint theo `userId, postId` để tránh duplicate/race condition.
- **Comments:** xây dựng `CommentInput`, `Comment`, `DeleteCommentDialog`.
- **Notifications:** badge unread, infinite scroll và mark-as-read.
- **Profile:** `EditProfileDialog`, `CropImageDialog`, UploadThing avatar.
- **Extras:** `UserTooltip`, `Linkify` cho URL trong bài viết.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Skeleton API route handlers; mutation hooks tương tự Like/Bookmark; boilerplate dialog xóa comment |
| **Sinh viên quyết định** | Dùng unique constraints thay boolean; xử lý optimistic rollback; thiết kế `NotificationType`; UX crop ảnh |

---

## Giai đoạn 5 - Direct Message, Google OAuth & Search
**12/03/2026** · Commit: `e79d080`

- **Direct Message:** tích hợp Stream Chat với `useInitializeChatClient`, `ChatSidebar`, `ChatChannel`, `NewChatDialog` và unread badge.
- **Google OAuth:** dùng `arctic` với PKCE + state, callback và upsert user theo `googleId`.
- **Search:** debounce bằng `useDebounce`, tìm kiếm user và post bằng PostgreSQL full-text search.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Code mẫu khởi tạo Stream Chat client; luồng Google OAuth với arctic |
| **Sinh viên quyết định** | Chọn Stream Chat thay vì tự build Socket.io; thiết kế UX DM; đọc lại docs Stream SDK do API thay đổi |

---

## Giai đoạn 6 - Media Upload, Cover Image, Nested Comments & Emoji
**13/03/2026** · Commits: `f148d8c`, `2872dfd`

- **Cover image:** thêm `coverImageUrl` vào `User`, upload ảnh bìa riêng, hiển thị full-width với gradient overlay.
- **Nested comments:** thêm `parentId` self-relation, hỗ trợ comment gốc và reply.
- **EmojiPicker:** wrap `emoji-picker-element` thành component dùng trong UI.
- **Search nâng cao:** tách tab Users/Posts, highlight match và dùng extension `unaccent` của PostgreSQL để tìm kiếm không dấu.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Cú pháp Prisma self-relation `@relation("CommentReplies")`; wrapper cho EmojiPicker |
| **Sinh viên quyết định** | Giới hạn comment 2 tầng để đảm bảo UX; dùng `unaccent`; thiết kế overlay ảnh bìa |

---

## Giai đoạn 7 - Hệ thống nhóm
**14/03/2026** · Commits: `417e20c`, `8455705`

Thiết kế schema `Group`, `GroupMember` và liên kết `Post.groupId`. Xây dựng chức năng tạo/sửa/xóa nhóm, quản lý thành viên, xử lý join request, phân quyền thành viên và feed theo nhóm. Bổ sung giao diện `GroupCard`, `GroupHeader`, `GroupSettings`, `GroupMemberList`, `InviteDialog` và luồng tham gia nhóm.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Skeleton component nhóm; CRUD API boilerplate; một số UI trong GroupSettings |
| **Sinh viên quyết định** | Chiến lược phân quyền nhóm; luồng join request/invite; xử lý cleanup media khi nhóm bị xóa |

---

## Giai đoạn 8 - Profile Decoration & Gamification
**15/03/2026** · Commits: `74fd31b`, `790c87b`, `8455705`

Triển khai hệ thống SPoints và trang trí hồ sơ. Schema bổ sung `Frame`, `FrameOwnership`, `UserBalance`, `UserActivity`, `QuestProgress`, `QuestClaim`, `ActivityReward`. Người dùng có thể nhận điểm qua hoạt động hằng ngày, mua frame, áp dụng frame cho avatar/banner và theo dõi nhiệm vụ trong `DailyQuests`.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Component `DailyQuests`; pattern API quest/progress/claim; `FrameOverlay` cơ bản |
| **Sinh viên quyết định** | Ý tưởng gamification: SPoints, frame, ownership, daily cap; cách hiển thị frame trên avatar/profile |

---

## Giai đoạn 9 - AI Comment Moderation
**18/03/2026** · Commit: `d4ee6ee`

Tích hợp mô hình AI tự huấn luyện để chấm điểm độc hại cho comment. Hàm `scoreComment()` gọi API AI với timeout 8 giây và áp dụng chiến lược **fail-open**: nếu AI không phản hồi, comment vẫn được đăng để tránh làm gián đoạn trải nghiệm.

| Score | Hành động |
|---|---|
| `> 0.95` | Xóa/ẩn comment và ghi log |
| `> 0.75` | Flag comment, ghi log và tăng số vi phạm |
| `>= 3` vi phạm | Ban user 24h và invalidate toàn bộ session |

Schema bổ sung `aiScore`, `aiFlag` trên `Comment`; `CommentModerationLog`; `violationCount`, `totalViolations`, `isBanned`, `bannedUntil`, `banReason` trên `User`. Middleware chuyển user bị ban về trang `/banned`.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Code Python huấn luyện mô hình trên Colab; code gọi API AI từ Render.com |
| **Sinh viên quyết định** | Ngưỡng 0.75/0.95; fail-open; progressive ban; lưu audit trail `aiScore`/`aiFlag` |

---

## Giai đoạn 10 - Comprehensive Admin Dashboard & Content Moderation
**09/05 - 15/05/2026**

Hoàn thiện hệ thống quản trị tập trung tại `/admin`, chỉ cho phép user có `role = ADMIN` truy cập. Admin Panel được tổ chức theo tab để gom toàn bộ nghiệp vụ vận hành, kiểm duyệt và theo dõi hệ thống vào một nơi.

### Chức năng đã hoàn thiện

- **Dashboard tổng quan:** API `/api/admin/stats` trả về tổng user, user mới hôm nay, tổng bài viết, bài viết hôm nay, số report đang chờ xử lý và biểu đồ tăng trưởng user trong 14 ngày gần nhất.
- **Quản lý báo cáo:** user có thể report bài viết, comment hoặc tài khoản qua `ReportDialog`. Admin xem danh sách report, xem chi tiết nội dung bị báo cáo, mở bài viết gốc, resolve/dismiss report, ẩn bài viết bằng `PostStatus.REMOVED` hoặc ẩn comment bằng `Comment.isHidden`.
- **Quản lý người dùng:** tìm kiếm theo username/tên/email, lọc theo trạng thái `ALL / ACTIVE / BANNED / ADMIN`, sắp xếp theo ngày tạo hoặc tổng vi phạm, phân trang, xem số bài viết/follower/vi phạm, ban/unban user kèm lý do và thời hạn. Khi ban user, hệ thống xóa session hiện tại để user bị khóa ra khỏi hệ thống ngay.
- **Chi tiết vi phạm user:** từ tab Users có thể mở danh sách log vi phạm AI của từng user, xem nội dung comment, AI score, flag, action và xóa comment vi phạm nếu cần.
- **Quản lý nhóm:** tìm kiếm nhóm theo tên/mô tả, sắp xếp theo trending hoặc recent, xem số thành viên/bài viết, trạng thái public/private/banned, ban/unban nhóm kèm lý do và thời hạn.
- **Quản lý frame:** admin tạo, sửa, xóa frame; quản lý tên, mô tả, ảnh, loại frame, giá tiền và SPoints cost.
- **Comment Moderation:** xem log kiểm duyệt AI, lọc theo `DELETE / FLAG / ALLOW`, xem tổng vi phạm của user, xóa comment vi phạm và unban user ngay từ màn hình moderation.
- **Nhật ký hoạt động người dùng:** theo dõi các activity phục vụ gamification như check-in, đăng bài, thích bài, bình luận; có thống kê theo loại hoạt động trong ngày, tìm kiếm user, lọc loại activity và phân trang.
- **Audit Logs:** ghi lại thao tác quản trị như ban/unban user, ban/unban group, resolve/dismiss report, hide/delete content, create/update/delete frame. Admin có thể lọc log theo action và target type.

### Database & Backend

- Bổ sung `UserRole.ADMIN` để phân quyền admin.
- Bổ sung trường quản trị trên `User`: `totalViolations`.
- Bổ sung trạng thái bài viết bằng `PostStatus`: `PUBLISHED`, `HIDDEN`, `REMOVED`.
- Bổ sung `Comment.isHidden` để soft-delete comment thay vì xóa vật lý.
- Bổ sung `Group.isBanned`, `Group.banReason`, `Group.bannedUntil`.
- Bổ sung model `Report`, `ReportStatus`, `ReportType` để quản lý báo cáo vi phạm.
- Bổ sung model `AuditLog` và enum `AuditAction` để lưu lịch sử thao tác admin.
- Các API/admin action đều kiểm tra session bằng `validateRequest()` và kiểm tra quyền bằng `isAdmin()` trước khi truy vấn hoặc thay đổi dữ liệu.
- Các thao tác nhạy cảm như ban user, ban group, hide comment/report được xử lý bằng Prisma transaction để cập nhật dữ liệu và ghi audit log đồng bộ.

### UI & UX

- Admin Panel dùng layout tab dọc, hỗ trợ hash navigation như `#reports`, `#users-activity`, `#activity-username` để chuyển nhanh giữa report và activity log.
- Các bảng quản trị có loading state, empty state, filter, search, pagination/cursor loading và toast phản hồi kết quả thao tác.
- Nội dung bị report có dialog xem chi tiết, hỗ trợ hiển thị text, ảnh, video attachment, tác giả, nhóm liên quan và link mở bài viết gốc.
- Các thao tác có rủi ro như ẩn bài viết/comment, ban user, ban group và xóa frame đều có dialog xác nhận.

| | Nội dung |
|---|---|
| **AI hỗ trợ** | Gợi ý cấu trúc API routes/admin actions; hỗ trợ UI tab admin, bảng dữ liệu, dialog xác nhận, truy vấn thống kê và audit log |
| **Sinh viên quyết định** | Thiết kế Admin Panel tập trung; chọn mô hình soft-delete bằng `PostStatus`/`Comment.isHidden`; quy tắc ban/unban; phân quyền admin; luồng xử lý report; cách liên kết moderation log, user activity và audit log |

---

## Kết luận hiện tại

Dự án đã phát triển từ mạng xã hội cơ bản thành hệ thống có đầy đủ các module chính: xác thực, feed, tương tác xã hội, profile, nhắn tin, nhóm, gamification, AI moderation và admin dashboard. Phần admin hiện đóng vai trò trung tâm vận hành hệ thống, giúp quản trị viên theo dõi tăng trưởng, kiểm duyệt nội dung, xử lý báo cáo, quản lý user/nhóm/frame và truy vết toàn bộ thao tác nhạy cảm bằng audit logs.
