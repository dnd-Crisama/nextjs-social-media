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
import AuditLogsTab from './tabs/AuditLogsTab';
import ReportsTab from './tabs/ReportsTab';
import { useState } from 'react';

export default function AdminPage() {
  const { user } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!user || !isAdmin(user)) {
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
    const tabHashes = new Set([
      'dashboard',
      'reports',
      'users',
      'groups',
      'frames',
      'moderation',
      'users-activity',
      'audit-logs',
    ]);

    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('activity-')) {
        setActiveTab('users-activity');
      } else if (tabHashes.has(hash)) {
        setActiveTab(hash);
      }
    };
    
    window.addEventListener('hashchange', onHashChange);
    onHashChange();
    
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Render null trong khi chờ redirect
  if (!user || !isAdmin(user)) return null;

  return (
<div className="w-full">
  <h1 className="mb-6 text-3xl font-bold">Admin Panel</h1>
  <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)]">
      <TabsList className="flex flex-col gap-2 rounded-lg bg-card p-2 text-left h-fit w-full">
        <TabsTrigger className="w-full justify-start" value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="reports">Quản lý báo cáo</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="users">Quản lý người dùng</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="groups">Quản lý nhóm</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="frames">Frame Management</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="moderation">Comment Moderation</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="users-activity">Nhật ký hoạt động</TabsTrigger>
        <TabsTrigger className="w-full justify-start" value="audit-logs">Nhật ký quản trị</TabsTrigger>
      </TabsList>

      <div className="space-y-6 w-full">
        <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        <TabsContent value="reports"><ReportsTab /></TabsContent>
        <TabsContent value="users"><UsersManagementTab /></TabsContent>
        <TabsContent value="groups"><GroupManagementTab /></TabsContent>
        <TabsContent value="frames"><FramesManagementTab /></TabsContent>
        <TabsContent value="moderation"><CommentModerationTab /></TabsContent>
        <TabsContent value="users-activity"><UserActivityTab /></TabsContent>
        <TabsContent value="audit-logs"><AuditLogsTab /></TabsContent>
      </div>
    </div>
  </Tabs>
</div>
  );
}
