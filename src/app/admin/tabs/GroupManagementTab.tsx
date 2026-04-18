"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { GroupData, GroupsPage } from "@/lib/types";
import { BanGroupDialog } from "@/app/admin/dialogs/BanGroupDialog";

export default function GroupManagementTab() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [sort, setSort] = useState<"trending" | "recent">("trending");
  const [selectedGroup, setSelectedGroup] = useState<GroupData | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banUntil, setBanUntil] = useState("");
  const [isPending, startTransition] = useTransition();

  const queryKey = useMemo(
    () => ["admin:groups", query, cursor, sort] as const,
    [query, cursor, sort],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<GroupsPage, Error>(
    {
      queryKey,
      queryFn: async (): Promise<GroupsPage> => {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        if (cursor) params.set("cursor", cursor);
        params.set("sort", sort);

        const res = await fetch(`/api/admin/groups?${params.toString()}`, {
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Không thể tải nhóm.");
        }

        return res.json() as Promise<GroupsPage>;
      },
    },
  );

  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        description: error?.message || "Lỗi tải nhóm.",
      });
    }
  }, [error, isError, toast]);

  const groups = data?.groups ?? [];

  const handleBan = (group: GroupData) => {
    setSelectedGroup(group);
    setBanReason("");
    setBanUntil("");
    setBanDialogOpen(true);
  };

  const handleConfirmBan = () => {
    if (!selectedGroup) return;

    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/admin/groups/${selectedGroup.id}/ban`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reason: banReason,
              bannedUntil: banUntil || null,
            }),
          });

          if (res.ok) {
            toast({ description: `Đã ban nhóm ${selectedGroup.name}` });
            setBanDialogOpen(false);
            setSelectedGroup(null);
            setBanReason("");
            setBanUntil("");
            refetch();
          } else {
            const payload = await res.json();
            toast({ variant: "destructive", description: payload?.error || "Lỗi khi ban nhóm." });
          }
        } catch {
          toast({ variant: "destructive", description: "Không thể kết nối đến server." });
        }
      })();
    });
  };

  const handleUnban = (group: GroupData) => {
    startTransition(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/admin/groups/${group.id}/unban`, {
            method: "POST",
            credentials: "include",
          });

          if (res.ok) {
            toast({ description: `Đã unban nhóm ${group.name}` });
            refetch();
          } else {
            const payload = await res.json();
            toast({ variant: "destructive", description: payload?.error || "Lỗi khi unban nhóm." });
          }
        } catch {
          toast({ variant: "destructive", description: "Không thể kết nối đến server." });
        }
      })();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Tìm nhóm theo tên hoặc mô tả..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant={sort === "trending" ? "default" : "outline"} onClick={() => setSort("trending")}>Trending</Button>
          <Button variant={sort === "recent" ? "default" : "outline"} onClick={() => setSort("recent")}>Recent</Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Tên nhóm</th>
              <th className="px-4 py-3 text-left font-medium">Mô tả</th>
              <th className="px-4 py-3 text-center font-medium">Thành viên</th>
              <th className="px-4 py-3 text-center font-medium">Bài viết</th>
              <th className="px-4 py-3 text-center font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-center font-medium">Ngày tạo</th>
              <th className="px-4 py-3 text-center font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 7 }).map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="bg-muted h-4 animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : groups.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted-foreground py-12 text-center">
                  Không tìm thấy nhóm nào.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{group.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm max-w-xl truncate">{group.description || "—"}</td>
                  <td className="px-4 py-3 text-center">{group._count.members}</td>
                  <td className="px-4 py-3 text-center">{group._count.posts}</td>
                  <td className="px-4 py-3 text-center">
                    {group.isBanned ? (
                      <div className="text-destructive">Banned{group.bannedUntil ? ` đến ${new Date(group.bannedUntil).toLocaleDateString()}` : ''}</div>
                    ) : (
                      <div>{group.isPublic ? "Public" : "Private"}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground text-xs">{new Date(group.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center">
                    {group.isBanned ? (
                      <Button size="sm" variant="outline" onClick={() => handleUnban(group)}>
                        Unban
                      </Button>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => handleBan(group)}>
                        Ban
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!data?.nextCursor || isLoading}
            onClick={() => setCursor(data?.nextCursor ?? null)}
          >
            Load more
          </Button>
        </div>
      </div>

      <BanGroupDialog
        open={banDialogOpen}
        selected={selectedGroup}
        banReason={banReason}
        banUntil={banUntil}
        isPending={isPending}
        onOpenChange={(open) => {
          setBanDialogOpen(open);
          if (!open) {
            setSelectedGroup(null);
            setBanReason("");
            setBanUntil("");
          }
        }}
        onBanReasonChange={setBanReason}
        onBanUntilChange={setBanUntil}
        onBan={handleConfirmBan}
      />
    </div>
  );
}
