
"use client";
console.log("UserActivityTab loaded");
import { useEffect, useState, useCallback } from "react";
import { ActivityType } from "@/generated/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  MapPin, FileText, Heart, MessageCircle,
  Search, X, ChevronLeft, ChevronRight, Activity, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityUser {
  id: string; username: string; displayName: string; avatarUrl: string | null;
}
interface UserActivityItem {
  id: string; activityType: ActivityType; earnedAt: string; user: ActivityUser;
}
interface Stats { type: ActivityType; count: number }

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_META: Record<
  ActivityType,
  { label: string; icon: React.ReactNode; badgeClass: string; statClass: string }
> = {
  DAILY_CHECKIN: { label: "Check-in",   icon: <MapPin        className="h-3.5 w-3.5" />, badgeClass: "bg-orange-100 text-orange-700 border-orange-200", statClass: "text-orange-600" },
  CREATE_POST:   { label: "Đăng bài",   icon: <FileText      className="h-3.5 w-3.5" />, badgeClass: "bg-blue-100 text-blue-700 border-blue-200",     statClass: "text-blue-600"   },
  LIKE_POST:     { label: "Thích bài",  icon: <Heart         className="h-3.5 w-3.5" />, badgeClass: "bg-pink-100 text-pink-700 border-pink-200",     statClass: "text-pink-600"   },
  COMMENT_POST:  { label: "Bình luận",  icon: <MessageCircle className="h-3.5 w-3.5" />, badgeClass: "bg-purple-100 text-purple-700 border-purple-200", statClass: "text-purple-600" },
};

const STAT_ICONS: Record<ActivityType, React.ReactNode> = {
  DAILY_CHECKIN: <MapPin        className="h-5 w-5 text-orange-500" />,
  CREATE_POST:   <FileText      className="h-5 w-5 text-blue-500"   />,
  LIKE_POST:     <Heart         className="h-5 w-5 text-pink-500"   />,
  COMMENT_POST:  <MessageCircle className="h-5 w-5 text-purple-500" />,
};

const PAGE_LIMIT = 15;
const API        = "/api/admin/user-activities"; 

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserActivityTab() {
  const [searchInput,   setSearchInput  ] = useState("");
  const [appliedQuery,  setAppliedQuery ] = useState<string | undefined>();
  const [selectedType,  setSelectedType ] = useState<ActivityType | "ALL">("ALL");
  const [page,          setPage         ] = useState(1);

  const [activities,   setActivities  ] = useState<UserActivityItem[]>([]);
  const [total,        setTotal       ] = useState(0);
  const [stats,        setStats       ] = useState<Stats[]>([]);
  const [loading,      setLoading     ] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const totalPages = Math.ceil(total / PAGE_LIMIT);

  // ── Fetch stats ───────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API}?statsOnly=true`);
      setStats(await res.json());
    } finally { setStatsLoading(false); }
  }, []);

  // ── Fetch activities ──────────────────────────────────────────────────────
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // Gửi 'query' thay vì 'userId'
      if (appliedQuery)           params.set("query", appliedQuery);
      if (selectedType !== "ALL") params.set("activityType", selectedType);
      params.set("page",  String(page));
      params.set("limit", String(PAGE_LIMIT));

      const res  = await fetch(`${API}?${params.toString()}`);
      const data = await res.json();
      setActivities(data.activities);
      setTotal(data.total);
    } finally { setLoading(false); }
  }, [appliedQuery, selectedType, page]);

  useEffect(() => { fetchStats();      }, [fetchStats]);
  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const applyFilter = () => {
    setAppliedQuery(searchInput.trim() || undefined);
    setPage(1);
  };
  const resetFilter = () => {
    setSearchInput(""); setAppliedQuery(undefined); setSelectedType("ALL"); setPage(1);
  };
  // Khi click nút "Xem của user này", điền username vào thay vì ID!
  const filterByUser = (username: string) => {
    setSearchInput(username); 
    setAppliedQuery(username); 
    setPage(1);
  };

  const isFiltered = !!appliedQuery || selectedType !== "ALL";

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold leading-none">Nhật ký hoạt động người dùng</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Theo dõi lịch sử check-in · đăng bài · thích · bình luận
          </p>
        </div>
      </div>

      {/* Stats cards hôm nay — click để lọc nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-7 bg-muted rounded w-1/3" />
                </CardContent>
              </Card>
            ))
          : stats.map(({ type, count }) => {
              const meta = ACTIVITY_META[type];
              return (
                <Card
                  key={type}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => { setSelectedType(type); setPage(1); }}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    {STAT_ICONS[type]}
                    <div>
                      <p className="text-xs text-muted-foreground leading-none">{meta.label} hôm nay</p>
                      <p className={`text-2xl font-bold mt-1 ${meta.statClass}`}>
                        {count.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Bộ lọc — UC-A17 Dòng sự kiện 1 */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Tìm người dùng <span className="font-normal opacity-70">(Username, Tên, Email)</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilter()}
                placeholder="Nhập tên hoặc username..."
                className="w-64 h-9"
              />
              <Button size="sm" onClick={applyFilter} className="h-9 gap-1.5">
                <Search className="h-3.5 w-3.5" /> Tìm
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Loại hoạt động</label>
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v as ActivityType | "ALL"); setPage(1); }}>
              <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả hoạt động</SelectItem>
                <SelectItem value="DAILY_CHECKIN">Check-in</SelectItem>
                <SelectItem value="CREATE_POST">Đăng bài</SelectItem>
                <SelectItem value="LIKE_POST">Thích bài</SelectItem>
                <SelectItem value="COMMENT_POST">Bình luận</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isFiltered && (
            <Button variant="ghost" size="sm" onClick={resetFilter} className="h-9 gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Xóa bộ lọc
            </Button>
          )}

          {appliedQuery && (
            <p className="px-2.5 py-1.5 rounded-md bg-muted text-xs font-mono">
              Đang lọc: {appliedQuery}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bảng — UC-A17 Dòng sự kiện 2 */}
      <Card>
        <CardHeader className="px-4 py-3 border-b flex-row items-center space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {loading
              ? <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...</span>
              : <>Tổng <strong className="text-foreground">{total.toLocaleString()}</strong> hoạt động{totalPages > 1 && ` — Trang ${page}/${totalPages}`}</>
            }
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-[260px]">Người dùng</TableHead>
                <TableHead className="w-[150px]">Hoạt động</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="animate-pulse">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 bg-muted rounded w-28" />
                            <div className="h-3 bg-muted rounded w-20" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-6 bg-muted rounded w-24" /></TableCell>
                      <TableCell><div className="h-3.5 bg-muted rounded w-28" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                : activities.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-16 text-center text-muted-foreground">
                      Không có hoạt động nào
                    </TableCell>
                  </TableRow>
                )
                : activities.map((act) => {
                    const meta = ACTIVITY_META[act.activityType];
                    return (
                      <TableRow key={act.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={act.user.avatarUrl ?? undefined} />
                              <AvatarFallback className="text-xs font-semibold">
                                {act.user.displayName[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm leading-none">{act.user.displayName}</p>
                              <p className="text-xs text-muted-foreground mt-1">@{act.user.username}</p>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className={`gap-1.5 font-medium ${meta.badgeClass}`}>
                            {meta.icon} {meta.label}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(act.earnedAt), { addSuffix: true, locale: vi })}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost" size="sm" className="h-7 text-xs"
                            onClick={() => filterByUser(act.user.username)}
                          >
                            Xem của user này
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              }
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              {(page - 1) * PAGE_LIMIT + 1}–{Math.min(page * PAGE_LIMIT, total)} / {total}
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                return p <= totalPages ? (
                  <Button key={p} variant={p === page ? "default" : "outline"}
                    size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ) : null;
              })}
              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}