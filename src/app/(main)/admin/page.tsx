'use client';
import { useSession } from '@/app/(main)/SessionProvider';
import { isAdmin } from '@/lib/admin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';   // ← đổi sang useRouter
import { useEffect } from 'react';             // ← thêm useEffect
import FramesManagementTab from './tabs/FramesManagementTab';
import CommentModerationTab from './tabs/CommentModerationTab';

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
    <div className='container max-w-6xl py-8'>
      <h1 className='text-3xl font-bold mb-8'>Admin Panel</h1>
      <Tabs defaultValue='frames'>
        <TabsList>
          <TabsTrigger value='frames'>Frame Management</TabsTrigger>
          <TabsTrigger value='moderation'>Comment Moderation</TabsTrigger>
        </TabsList>
        <TabsContent value='frames'>
          <FramesManagementTab />
        </TabsContent>
        <TabsContent value='moderation'>
          <CommentModerationTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}