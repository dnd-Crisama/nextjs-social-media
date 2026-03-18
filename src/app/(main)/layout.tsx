import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import MenuBar from "./MenuBar";
import Navbar from "./Navbar";
import SessionProvider from "./SessionProvider";
import GroupsMenu from "@/components/groups/GroupsMenu";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await validateRequest();

  if (!session.user) redirect("/login");

  if (
    session.user.isBanned && 
    session.user.role !== "ADMIN" && 
    session.user.bannedUntil && 
    session.user.bannedUntil > new Date()
  ) {
    redirect("/banned");
  }

  // Fetch full user record...
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

  // Nếu DB trả về null (user bị xóa), redirect về login
  if (!fullUser) redirect("/login");

  const sessionWithFullUser = { ...session, user: fullUser } as any;

  return (
    <SessionProvider value={sessionWithFullUser}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="mx-auto flex w-full max-w-7xl grow gap-5 p-5">
          {/* MenuBar & GroupsMenu */}
          <div className="sticky top-[5.25rem] hidden h-fit flex-none rounded-2xl bg-card shadow-sm sm:block lg:w-80">
            <MenuBar className="space-y-3 px-3 py-5 lg:px-5" />
            <div className="border-t border-border">
              <GroupsMenu />
            </div>
          </div>
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}