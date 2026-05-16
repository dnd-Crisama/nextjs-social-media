"use client";

import { useEffect, useState } from "react";
import { FileText, Flag, RefreshCcw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UserGrowthPoint {
  date: string;
  label: string;
  newUsers: number;
  totalUsers: number;
}

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  totalPosts: number;
  postsToday: number;
  pendingReports: number;
  userGrowth: UserGrowthPoint[];
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {value.toLocaleString("vi-VN")}
          </p>
        </div>
        <span className={`flex size-9 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  const chartWidth = 640;
  const chartHeight = 220;
  const paddingX = 34;
  const paddingTop = 22;
  const paddingBottom = 38;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  const maxNewUsers = Math.max(1, ...data.map((point) => point.newUsers));
  const minTotalUsers = Math.min(...data.map((point) => point.totalUsers));
  const maxTotalUsers = Math.max(...data.map((point) => point.totalUsers));
  const totalRange = Math.max(1, maxTotalUsers - minTotalUsers);
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : plotWidth;
  const barWidth = Math.max(10, Math.min(24, plotWidth / data.length - 8));
  const latest = data[data.length - 1];
  const previous = data[data.length - 2];
  const delta = latest && previous ? latest.totalUsers - previous.totalUsers : 0;

  const linePoints = data
    .map((point, index) => {
      const x = paddingX + index * stepX;
      const y =
        paddingTop +
        plotHeight -
        ((point.totalUsers - minTotalUsers) / totalRange) * plotHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Tăng trưởng người dùng</CardTitle>
          <CardDescription>
            14 ngày gần nhất: user mới mỗi ngày và tổng user tích lũy.
          </CardDescription>
        </div>
        <Badge variant={delta > 0 ? "default" : "secondary"}>
          {delta > 0 ? `+${delta} hôm nay` : "Chưa tăng hôm nay"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="h-72 w-full min-w-[640px]"
            role="img"
            aria-label="Biểu đồ tăng trưởng người dùng 14 ngày gần nhất"
          >
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = paddingTop + plotHeight * ratio;
              return (
                <line
                  key={ratio}
                  x1={paddingX}
                  x2={chartWidth - paddingX}
                  y1={y}
                  y2={y}
                  className="stroke-border"
                  strokeDasharray="4 4"
                />
              );
            })}

            {data.map((point, index) => {
              const x = paddingX + index * stepX;
              const barHeight = (point.newUsers / maxNewUsers) * plotHeight;
              const y = paddingTop + plotHeight - barHeight;

              return (
                <g key={point.date}>
                  <rect
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    className="fill-blue-500/25"
                  >
                    <title>{`${point.label}: +${point.newUsers} user mới`}</title>
                  </rect>
                  <text
                    x={x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[11px]"
                  >
                    {index % 2 === 0 || index === data.length - 1 ? point.label : ""}
                  </text>
                </g>
              );
            })}

            <polyline
              points={linePoints}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {data.map((point, index) => {
              const x = paddingX + index * stepX;
              const y =
                paddingTop +
                plotHeight -
                ((point.totalUsers - minTotalUsers) / totalRange) * plotHeight;

              return (
                <circle
                  key={`${point.date}-dot`}
                  cx={x}
                  cy={y}
                  r="4"
                  className="fill-background stroke-primary"
                  strokeWidth="2"
                >
                  <title>{`${point.label}: tổng ${point.totalUsers} user`}</title>
                </circle>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-muted p-3">
            <div className="text-muted-foreground">User mới 14 ngày</div>
            <div className="mt-1 text-xl font-semibold">
              {data.reduce((sum, point) => sum + point.newUsers, 0).toLocaleString("vi-VN")}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-muted-foreground">Cao nhất/ngày</div>
            <div className="mt-1 text-xl font-semibold">
              {maxNewUsers.toLocaleString("vi-VN")}
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="text-muted-foreground">Tổng hiện tại</div>
            <div className="mt-1 text-xl font-semibold">
              {(latest?.totalUsers ?? 0).toLocaleString("vi-VN")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  async function fetchStats(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    if (!isRefresh) setLoading(true);
    setError(false);

    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) throw new Error("Failed to load admin stats");
      setStats(await response.json());
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <SkeletonDashboard />;

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
          <p>Không thể tải dữ liệu dashboard.</p>
          <Button variant="outline" size="sm" onClick={() => fetchStats()}>
            <RefreshCcw className="mr-2 size-4" />
            Thử lại
          </Button>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      label: "Người dùng",
      value: stats.totalUsers,
      sub: `+${stats.newUsersToday} đăng ký hôm nay`,
      icon: Users,
      accent: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Bài viết",
      value: stats.totalPosts,
      sub: `+${stats.postsToday} bài viết hôm nay`,
      icon: FileText,
      accent: "bg-emerald-500/10 text-emerald-600",
    },
    {
      label: "Report chờ",
      value: stats.pendingReports,
      sub: stats.pendingReports > 0 ? "Cần xem xét" : "Không có report mới",
      icon: Flag,
      accent:
        stats.pendingReports > 0
          ? "bg-red-500/10 text-red-600"
          : "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchStats(true)} disabled={refreshing}>
            <RefreshCcw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <UserGrowthChart data={stats.userGrowth} />
    </div>
  );
}
