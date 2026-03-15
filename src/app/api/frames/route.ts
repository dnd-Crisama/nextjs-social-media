import { validateRequest } from "@/auth";
import { isAdmin } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const frames = await prisma.frame.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(frames);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !isAdmin(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, imageUrl, price, spointCost, type } = body;

    // Basic validation
    if (!name || !imageUrl || !type) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!["AVATAR", "PROFILE"].includes(type)) {
      return Response.json({ error: "Invalid frame type" }, { status: 400 });
    }

    const frame = await prisma.frame.create({
      data: {
        name,
        description,
        imageUrl,
        price: parseFloat(price) || 0,
        spointCost: parseInt(spointCost) || 0,
        type,
      },
    });

    return Response.json(frame, { status: 201 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !isAdmin(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, description, imageUrl, price, spointCost, type } = body;

    if (!id) {
      return Response.json({ error: "Frame ID required" }, { status: 400 });
    }

    const frame = await prisma.frame.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl && { imageUrl }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(spointCost !== undefined && { spointCost: parseInt(spointCost) }),
        ...(type && { type }),
      },
    });

    return Response.json(frame);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user || !isAdmin(user)) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Frame ID required" }, { status: 400 });
    }

    await prisma.frame.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
