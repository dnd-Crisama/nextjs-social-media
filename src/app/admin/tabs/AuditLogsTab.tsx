'use client';

import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useState, useTransition } from 'react';
import { useToast } from '@/components/ui/use-toast';
import UserAvatar from '@/components/UserAvatar';

interface AdminLog {
  id: string;
  adminId: string;
  admin: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  action: string;
  targetType: string;
  targetId: string;
  detail: string | null;
  createdAt: string;
}

interface AuditLogsPage {
  logs: AdminLog[];
  nextCursor: string | null;
}

const ACTIONS = [
  'BAN_USER',
  'UNBAN_USER',
  'BAN_GROUP',
  'UNBAN_GROUP',
  'DELETE_USER',
  'DELETE_POST',
  'HIDE_POST',
  'RESTORE_POST',
  'DELETE_COMMENT',
  'RESOLVE_REPORT',
  'DISMISS_REPORT',
  'CHANGE_USER_ROLE',
  'CREATE_FRAME',
  'UPDATE_FRAME',
  'DELETE_FRAME',
  'DELETE_GROUP',
];

const TARGET_TYPES = ['User', 'Post', 'Comment', 'Report', 'Frame', 'Group'];

export default function AuditLogsTab() {
  const { toast } = useToast();
  const [cursor, setCursor] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin:audit-logs', cursor, actionFilter, targetTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (actionFilter) params.set('action', actionFilter);
      if (targetTypeFilter) params.set('targetType', targetTypeFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Không thể tải audit logs.');
      }

      return res.json() as Promise<AuditLogsPage>;
    },
  });

  const logs = data?.logs ?? [];

  const handleFilterReset = () => {
    setCursor(null);
    setActionFilter('');
    setTargetTypeFilter('');
  };

  const getActionColor = (action: string) => {
    if (action.includes('BAN') || action.includes('DELETE')) {
      return 'bg-destructive/10 text-destructive';
    }
    if (action.includes('UNBAN') || action.includes('RESTORE')) {
      return 'bg-green-500/10 text-green-700 dark:text-green-400';
    }
    if (action.includes('CREATE') || action.includes('UPDATE')) {
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
    }
    return 'bg-muted text-foreground';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Nhật ký hoạt động quản trị</h2>
        <div className="flex gap-2">
          {(actionFilter || targetTypeFilter) && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleFilterReset}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Lọc theo hành động</label>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCursor(null);
            }}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="">Tất cả hành động</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Lọc theo loại đối tượng</label>
          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setCursor(null);
            }}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="">Tất cả loại</option>
            {TARGET_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="px-4 py-3 text-left font-semibold">Admin</th>
                <th className="px-4 py-3 text-left font-semibold">Hành động</th>
                <th className="px-4 py-3 text-left font-semibold">Đối tượng</th>
                <th className="px-4 py-3 text-left font-semibold">Chi tiết</th>
                <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          avatarUrl={log.admin.avatarUrl}
                          size={32}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{log.admin.displayName}</span>
                          <span className="text-xs text-muted-foreground">@{log.admin.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="bg-primary/10 px-2 py-1 rounded text-xs">
                        {log.targetType} 
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                      {log.detail || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Không có nhật ký nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Hiển thị {logs.length} mục
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!cursor || isLoading}
            onClick={() => setCursor(null)}
          >
            Đầu tiên
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!data?.nextCursor || isLoading}
            onClick={() => setCursor(data?.nextCursor ?? null)}
          >
            Tiếp theo
          </Button>
        </div>
      </div>
    </div>
  );
}
