import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import SessionProvider from "@/app/(main)/SessionProvider";
import Navbar from "@/app/(main)/Navbar";  // import navbar 


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await validateRequest();

  if (!session.user) redirect("/login");

  const fullUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      avatarFrame: {
        select: { id: true, name: true, imageUrl: true },
      },
      bannerFrame: {
        select: { id: true, name: true, imageUrl: true },
      },
      role: true,
      isBanned: true,
      bannedUntil: true,
    },
  });

  if (!fullUser) redirect("/login");

  const sessionWithFullUser = { ...session, user: fullUser } as any;

  return (
    <SessionProvider value={sessionWithFullUser}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-7xl grow gap-5 p-5">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}