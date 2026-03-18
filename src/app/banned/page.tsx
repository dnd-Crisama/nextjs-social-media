import { lucia, validateRequest } from '@/auth'; 
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button'; 
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react'; // Thêm icon cho chuyên nghiệp

export default async function BannedPage() {
  const { user } = await validateRequest();

  // Nếu không có user hoặc user không bị ban -> về home
  if (!user || !user.isBanned) {
    redirect('/');
  }

  // Kiểm tra quyền Admin
  const isAdmin = user.role === "ADMIN";

  const bannedUntil = user.bannedUntil;
  const until = bannedUntil ? new Date(bannedUntil).toLocaleString() : 'soon';

  async function logout() {
    'use server';
    const { session } = await validateRequest();
    if (session) {
      await lucia.invalidateSession(session.id);
      const sessionCookie = lucia.createBlankSessionCookie();
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
    }
    redirect('/'); 
  }

  return (
    <div className='flex min-h-screen items-center justify-center p-4 bg-gray-50'>
      <div className='w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center shadow-lg'>
        
        {/* ── THÔNG TIN USER ── */}
        <div className="mb-6 flex flex-col items-center justify-center gap-3 border-b border-red-200/50 pb-6">
          <UserAvatar 
            avatarUrl={user.avatarUrl} 
            size={80} 
            frame={(user as any).avatarFrame} 
          />
          <div className="space-y-0.5">
            <p className="text-xl font-bold text-gray-900">{user.displayName}</p>
            <p className="text-sm font-medium text-gray-500">@{user.username}</p>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-600 uppercase mt-1">
                <ShieldCheck className="size-3" /> Admin Account
              </span>
            )}
          </div>
        </div>

        <div className='text-4xl mb-4'>🚫</div>
        <h1 className='text-2xl font-bold text-red-700 mb-2'>Account Temporarily Locked</h1>
        <p className='text-red-600 mb-4 text-sm'>
          Your account has been locked due to community violations. 
          {isAdmin && " As an Admin, you have access to the dashboard to review this."}
        </p>
        <p className='text-xs text-red-400 font-medium mb-8 uppercase tracking-wider'>
          Unlock time: {until}
        </p>
        
        <div className="flex flex-col gap-3">
          {/* ── NÚT BẤM DÀNH RIÊNG CHO ADMIN ── */}
          {isAdmin && (
            <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700 shadow-md">
              <Link href="/admin">
                Go to Admin Dashboard (Unban)
              </Link>
            </Button>
          )}

          {/* ── NÚT ĐĂNG XUẤT (DÀNH CHO TẤT CẢ) ── */}
          <form action={logout} className="w-full">
            <Button 
              type="submit" 
              variant="outline" 
              className={cn(
                "w-full border-red-200 text-red-700 hover:bg-red-100",
                !isAdmin && "bg-red-600 text-white hover:bg-red-700 border-none"
              )}
            >
              Log out & Back to Home
            </Button>
          </form>
        </div>

        {isAdmin && (
          <p className="mt-4 text-[10px] text-gray-400 italic">
            Note: Your admin privileges allow you to bypass this screen via the dashboard.
          </p>
        )}
      </div>
    </div>
  );
}

// Hàm hỗ trợ classname
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}