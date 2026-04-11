"use client";
import { useEffect, useState } from 'react';
import { Users, FileText, Flag, Coins, UserX, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalUsers: number;
  newUsersToday: number;
  totalPosts: number;
  postsToday: number;
  pendingReports: number;
  bannedUsers: number;
  totalBalance: number;
}

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <p className="text-muted-foreground text-sm font-medium">{label}</p>
        <span className={`rounded-lg p-2 ${accent}`}>
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
        <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
          <TrendingUp className="size-3" />
          {sub}
        </p>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="size-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16" />
        <Skeleton className="mt-2 h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export default function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex h-40 items-center justify-center">
          Không thể tải dữ liệu. Vui lòng thử lại.
        </CardContent>
      </Card>
    );
  }

  const cards = [
    {
      label: 'Tổng người dùng',
      value: stats.totalUsers,
      sub: `+${stats.newUsersToday} đăng ký hôm nay`,
      icon: Users,
      accent: 'bg-blue-500/10 text-blue-500',
    },
    {
      label: 'Tổng bài viết',
      value: stats.totalPosts,
      sub: `+${stats.postsToday} bài viết hôm nay`,
      icon: FileText,
      accent: 'bg-green-500/10 text-green-500',
    },
    {
      label: 'Report chờ xử lý',
      value: stats.pendingReports,
      sub: stats.pendingReports > 0 ? 'Cần xem xét' : 'Không có report mới',
      icon: Flag,
      accent: stats.pendingReports > 0 ? 'bg-red-500/10 text-red-500' : 'bg-muted text-muted-foreground',
    },
    {
      label: 'Users bị ban',
      value: stats.bannedUsers,
      sub: 'Tổng tài khoản bị khóa',
      icon: UserX,
      accent: 'bg-orange-500/10 text-orange-500',
    },
    {
      label: 'Tổng điểm hệ thống',
      value: stats.totalBalance,
      sub: 'Tổng SPoints đang lưu hành',
      icon: Coins,
      accent: 'bg-amber-500/10 text-amber-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {cards.map((card) => <StatCard key={card.label} {...card} />)}
    </div>
  );
}