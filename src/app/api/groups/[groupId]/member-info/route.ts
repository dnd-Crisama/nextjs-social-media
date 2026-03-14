import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params: { groupId } }: { params: { groupId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { userId: true },
    });

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 });
    }

    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
      select: {
        status: true,
        role: true,
      },
    });

    const isAdmin = group.userId === user.id;
    const isMember = !!membership;
    const status = membership?.status || null;

    return Response.json({
      isMember,
      status,
      isAdmin,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
