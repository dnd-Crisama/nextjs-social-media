"use client";
import { useEffect, useState, useTransition } from 'react';
import {
  Search, Ban, ShieldCheck, Trash2,
  ChevronLeft, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import UserAvatar from '@/components/UserAvatar';
import { BanUserDialog } from '../dialogs/BanUserDialog';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  isBanned: boolean;
  bannedUntil: string | null;
  banReason: string | null;
  violationCount: number;
  violationTotal: number;
  createdAt: string;
  _count: { posts: number; followers: number };
}

interface PageData {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

type SortOption = 'CREATED_DESC' | 'VIOLATION_DESC';

interface ViolationLog {
  id: string;
  commentId: string;
  content: string;
  aiScore: number;
  aiFlag: string;
  action: string;
  createdAt: string;
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.role === 'ADMIN') {
    return (
      <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
        Admin
      </span>
    );
  }
  if (user.isBanned) {
    return (
      <div className="space-y-1">
        <span className="bg-destructive text-destructive-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
          Banned
        </span>
        {user.bannedUntil && (
          <p className="text-muted-foreground text-xs">
            đến {format(new Date(user.bannedUntil), 'dd/MM/yyyy', { locale: vi })}
          </p>
        )}
        {user.banReason && (
          <p className="text-muted-foreground text-xs">Lý do: {user.banReason}</p>
        )}
      </div>
    );
  }
  return (
    <span className="border rounded-full px-2.5 py-0.5 text-xs font-medium">
      Active
    </span>
  );
}

const PAGE_SIZE = 10;

async function getErrorMessage(res: Response): Promise<string> {
  const body = await res.clone().text().catch(() => null);
  if (body) {
    try {
      const json = JSON.parse(body);
      if (json?.error) return json.error;
    } catch {
      // ignore invalid JSON
    }
  }
  return body?.trim() ? body : res.statusText || 'Có lỗi xảy ra.';
}

export default function UsersManagementTab() {
  const { toast } = useToast();
  const [data, setData] = useState<PageData | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BANNED' | 'ADMIN'>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('CREATED_DESC');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');
  const [banUntil, setBanUntil] = useState('');
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [violationDialogOpen, setViolationDialogOpen] = useState(false);
  const [violationLogs, setViolationLogs] = useState<ViolationLog[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchUsers = (q: string, p: number, status: string, sort: SortOption) => {
    setLoading(true);
    fetch(
      `/api/admin/users?q=${encodeURIComponent(q)}&page=${p}&limit=${PAGE_SIZE}&status=${status}&sort=${sort}`,
      {
        credentials: 'include',
      }
    )
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast({ variant: 'destructive', description: 'Không thể tải danh sách users.' }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchUsers(search, 1, statusFilter, sortOption);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter, sortOption]);

  useEffect(() => {
    fetchUsers(search, page, statusFilter, sortOption);
  }, [page, sortOption]);

  const handleBan = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${selected.id}/ban`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: banReason,
            bannedUntil: banUntil || null,
          }),
        });
        if (res.ok) {
          toast({ description: `Đã ban @${selected.username}` });
          setBanDialogOpen(false);
          setBanReason('');
          setBanUntil('');
          setSelected(null);
          fetchUsers(search, page, statusFilter, sortOption);
        } else {
          const errorMessage = await getErrorMessage(res);
          toast({ variant: 'destructive', description: errorMessage });
        }
      } catch {
        toast({ variant: 'destructive', description: 'Không thể kết nối đến server.' });
      }
    });
  };

  const handleUnban = (user: AdminUser) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${user.id}/unban`, {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          toast({ description: `Đã unban @${user.username}` });
          fetchUsers(search, page, statusFilter, sortOption);
        } else {
          const errorMessage = await getErrorMessage(res);
          toast({ variant: 'destructive', description: errorMessage });
        }
      } catch {
        toast({ variant: 'destructive', description: 'Không thể kết nối đến server.' });
      }
    });
  };

  const handleDelete = () => {
    if (!selected) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/users/${selected.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (res.ok) {
          toast({ description: `Đã xóa @${selected.username}` });
          setDeleteDialogOpen(false);
          setSelected(null);
          fetchUsers(search, page, statusFilter, sortOption);
        } else {
          const errorMessage = await getErrorMessage(res);
          toast({ variant: 'destructive', description: errorMessage });
        }
      } catch {
        toast({ variant: 'destructive', description: 'Không thể kết nối đến server.' });
      }
    });
  };

  const fetchViolationDetails = async (userId: string) => {
    setLoadingViolations(true);
    try {
      const res = await fetch(
        `/api/admin/moderation?userId=${encodeURIComponent(userId)}&onlyViolations=true`,
        {
          credentials: 'include',
        }
      );
      const data = await res.json();
      setViolationLogs(data.logs ?? []);
    } catch {
      toast({ variant: 'destructive', description: 'Không thể tải chi tiết vi phạm.' });
      setViolationLogs([]);
    } finally {
      setLoadingViolations(false);
    }
  };

  const handleOpenViolations = (user: AdminUser) => {
    setSelected(user);
    setViolationDialogOpen(true);
    fetchViolationDetails(user.id);
  };

  const handleDeleteViolationComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const res = await fetch('/api/admin/moderation/delete-comment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        toast({ description: 'Comment đã bị xóa.' });
        if (selected) {
          fetchViolationDetails(selected.id);
        }
        fetchUsers(search, page, statusFilter, sortOption);
      } else {
        const errorMessage = await getErrorMessage(res);
        toast({ variant: 'destructive', description: errorMessage });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Không thể kết nối đến server.' });
    } finally {
      setDeletingCommentId(null);
    }
  };

  return (
    <div className="space-y-4">

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="Tìm theo username, tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Trạng thái</span>
          {[
            { value: 'ALL', label: 'Tất cả' },
            { value: 'ACTIVE', label: 'Active' },
            { value: 'BANNED', label: 'Banned' },
            { value: 'ADMIN', label: 'Admin' },
          ].map((option) => (
            <Button
              key={option.value}
              size="default"
              variant="outline"
              className={
                statusFilter === option.value
                  ? 'bg-primary text-primary-foreground border-primarry'
                  : ''
              }
              onClick={() => {
                setStatusFilter(option.value as 'ALL' | 'ACTIVE' | 'BANNED' | 'ADMIN');
                setPage(1);
              }}
            >
              {option.label}
            </Button>
          ))}
          <span className="text-sm font-medium text-muted-foreground">Sắp xếp</span>
          {[
            { value: 'CREATED_DESC', label: 'Mới nhất' },
            { value: 'VIOLATION_DESC', label: 'Nhiều vi phạm' },
          ].map((option) => (
            <Button
              key={option.value}
              size="default"
              variant={sortOption === option.value ? 'default' : 'outline'}
              onClick={() => {
                setSortOption(option.value as SortOption);
                setPage(1);
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Người dùng</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-center font-medium">Posts</th>
              <th className="px-4 py-3 text-center font-medium">Followers</th>
              <th className="px-4 py-3 text-center font-medium">Vi phạm</th>
              <th className="px-4 py-3 text-left font-medium">Ngày tạo</th>
              <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-right font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading
              ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="bg-muted h-4 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              : data?.users.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="text-muted-foreground py-12 text-center">
                      Không tìm thấy user nào.
                    </td>
                  </tr>
                )
                : data?.users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <UserAvatar avatarUrl={u.avatarUrl} size={32} className="size-8 rounded-full" />
                        <div>
                          <p className="font-medium leading-none">{u.displayName}</p>
                          <p className="text-muted-foreground mt-1 text-xs">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">{u.email ?? '—'}</td>
                    <td className="px-4 py-3 text-center">{u._count.posts}</td>
                    <td className="px-4 py-3 text-center">{u._count.followers}</td>
                    <td className="px-4 py-3 text-center">
                      {u.violationTotal > 0
                        ? <span className="font-medium text-orange-500">{u.violationTotal}</span>
                        : <span className="text-muted-foreground">0</span>
                      }
                    </td>
                    <td className="text-muted-foreground px-4 py-3 text-xs">
                      {format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: vi })}
                    </td>
                    <td className="px-4 py-3"><StatusBadge user={u} /></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenViolations(u)}
                        >
                          <AlertTriangle className="mr-1 size-3.5" /> Vi phạm
                        </Button>
                        {u.role !== 'ADMIN' && (
                          u.isBanned ? (
                            <Button size="sm" variant="outline" disabled={isPending} onClick={() => handleUnban(u)}>
                              <ShieldCheck className="mr-1 size-3.5" /> Unban
                            </Button>
                          ) : (
                            <Button
                              size="sm" variant="outline"
                              className="text-destructive hover:text-destructive"
                              disabled={isPending}
                              onClick={() => { setSelected(u); setBanDialogOpen(true); }}
                            >
                              <Ban className="mr-1 size-3.5" /> Ban
                            </Button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {data.total.toLocaleString()} users · Trang {data.page}/{data.totalPages}
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages || loading} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <BanUserDialog
        open={banDialogOpen}
        selected={selected ? { id: selected.id, username: selected.username } : null}
        banReason={banReason}
        banUntil={banUntil}
        isPending={isPending}
        onOpenChange={(open) => {
          setBanDialogOpen(open);
          if (!open) {
            setBanReason('');
            setBanUntil('');
          }
        }}
        onBanReasonChange={setBanReason}
        onBanUntilChange={setBanUntil}
        onBan={handleBan}
      />

      <Dialog open={violationDialogOpen} onOpenChange={(open) => { setViolationDialogOpen(open); if (!open) setViolationLogs([]); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết vi phạm @{selected?.username}</DialogTitle>
            <DialogDescription>
              {selected?.violationTotal != null
                ? `Tổng số lần vi phạm từ đầu: ${selected.violationTotal}`
                : 'Xem nhật ký vi phạm và xóa bình luận nếu cần.'}
            </DialogDescription>
          </DialogHeader>

          {loadingViolations ? (
            <p className="text-muted-foreground py-8 text-center">Đang tải chi tiết...</p>
          ) : violationLogs.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              {selected?.violationTotal
                ? `Tổng vi phạm hiện tại: ${selected.violationTotal}. Không có log vi phạm chi tiết trong dữ liệu.`
                : 'Chưa có vi phạm nào được ghi nhận.'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Comment</th>
                    <th className="px-4 py-3 text-center font-medium">AI Score</th>
                    <th className="px-4 py-3 text-center font-medium">Flag</th>
                    <th className="px-4 py-3 text-center font-medium">Action</th>
                    <th className="px-4 py-3 text-center font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {violationLogs.map((log) => (
                    <tr key={log.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 max-w-[260px] text-xs text-muted-foreground truncate" title={log.content}>
                        {log.content}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-medium">{log.aiScore.toFixed(3)}</td>
                      <td className="px-4 py-3 text-center uppercase font-semibold text-sm">{log.aiFlag}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground uppercase">{log.action}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingCommentId === log.commentId}
                          onClick={() => handleDeleteViolationComment(log.commentId)}
                        >
                          {deletingCommentId === log.commentId ? 'Đang xóa...' : 'Xóa comment'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViolationDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive size-5" />
              Xóa @{selected?.username}?
            </DialogTitle>
            <DialogDescription>
              Hành động này <strong>không thể hoàn tác</strong>. Toàn bộ bài viết, comment và dữ liệu của user sẽ bị xóa vĩnh viễn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" disabled={isPending} onClick={handleDelete}>
              {isPending ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}