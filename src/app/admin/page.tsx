'use client';
import { useSession } from '@/app/(main)/SessionProvider';
import { isAdmin } from '@/lib/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';   // ← đổi sang useRouter
import { useEffect } from 'react';             // ← thêm useEffect
import FramesManagementTab from './tabs/FramesManagementTab';
import CommentModerationTab from './tabs/CommentModerationTab';
import DashboardTab from './tabs/DashboardTab';
import UsersManagementTab from './tabs/UsersManagementTab';
import GroupManagementTab from './tabs/GroupManagementTab';
import UserActivityTab from './tabs/UserActivityTab';

export default function AdminPage() {
  const { user } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!user || !isAdmin(user)) {
      router.replace('/');
    }
  }, [user, router]);

  // Render null trong khi chờ redirect
  if (!user || !isAdmin(user)) return null;

  return (
<div className="w-full">
  <h1 className="mb-6 text-3xl font-bold">Admin Panel</h1>
  <Tabs defaultValue="dashboard" orientation="vertical">
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
      <TabsList className="flex flex-col gap-2 rounded-lg bg-card p-2 text-left h-fit w-full">
        <TabsTrigger className="w-full justify-start" value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="users">Quản lý người dùng</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="groups">Quản lý nhóm</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="frames">Frame Management</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="moderation">Comment Moderation</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="users-activity">Nhật ký hoạt động</TabsTrigger>
      </TabsList>

      <div className="space-y-6 w-full">
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="users"><UsersManagementTab /></TabsContent>
        <TabsContent value="groups"><GroupManagementTab /></TabsContent>
        <TabsContent value="frames"><FramesManagementTab /></TabsContent>
        <TabsContent value="moderation"><CommentModerationTab /></TabsContent>
        <TabsContent value="users-activity"><UserActivityTab /></TabsContent>
      </div>
    </div>
  </Tabs>
</div>
  );
}