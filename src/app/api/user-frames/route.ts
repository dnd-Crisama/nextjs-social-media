import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ownerships = await prisma.frameOwnership.findMany({
      where: { userId: user.id },
      include: { frame: true },
    });

    const frames = ownerships.map((o) => o.frame);

    return Response.json(frames);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
