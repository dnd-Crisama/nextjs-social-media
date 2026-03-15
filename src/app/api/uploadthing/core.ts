import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();

export const fileRouter = {
  avatar: f({
    image: { maxFileSize: "4MB" }, 
  })
    .middleware(async () => {
      const { user } = await validateRequest();
      if (!user) throw new UploadThingError("Unauthorized");
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, avatarUrl: true, coverImageUrl: true },
      });
      return { user: fullUser! };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const oldAvatarUrl = metadata.user.avatarUrl;

      if (oldAvatarUrl) {
        const key = oldAvatarUrl.substring(oldAvatarUrl.lastIndexOf('/') + 1);
        if (key) {
          await new UTApi().deleteFiles(key);
        }
      }

      await Promise.all([
        prisma.user.update({
          where: { id: metadata.user.id },
          data: {
            avatarUrl: file.url,
          },
        }),
        streamServerClient.partialUpdateUser({
          id: metadata.user.id,
          set: {
            image: file.url,
          },
        }),
      ]);

      return { avatarUrl: file.url };
    }),

  coverImage: f({
    image: { maxFileSize: "8MB" },
  })
    .middleware(async () => {
      const { user } = await validateRequest();
      if (!user) throw new UploadThingError("Unauthorized");
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, avatarUrl: true, coverImageUrl: true },
      });
      return { user: fullUser! };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const oldCoverUrl = metadata.user.coverImageUrl;

      if (oldCoverUrl) {
        const key = oldCoverUrl.substring(oldCoverUrl.lastIndexOf('/') + 1);
        if (key) {
          await new UTApi().deleteFiles(key);
        }
      }

      await prisma.user.update({
        where: { id: metadata.user.id },
        data: {
          coverImageUrl: file.url,
        },
      });

      return { coverImageUrl: file.url };
    }),

    attachment: f({
      image: { maxFileSize: "4MB", maxFileCount: 5 },
      video: { maxFileSize: "64MB", maxFileCount: 5 },
    })
      .middleware(async () => {
        const { user } = await validateRequest();
  
        if (!user) throw new UploadThingError("Unauthorized");
  
        return {};
      })
      .onUploadComplete(async ({ file }) => {
        const media = await prisma.media.create({
          data: {
            url: file.url, 
            type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
          },
        });
  
        return { mediaId: media.id };
      }),

    groupAvatar: f({
      image: { maxFileSize: "4MB" }, 
    })
      .middleware(async () => {
        const { user } = await validateRequest();
        if (!user) throw new UploadThingError("Unauthorized");
        return { userId: user.id };
      })
      .onUploadComplete(async ({ file }) => {
        return { url: file.url };
      }),

    groupCoverImage: f({
      image: { maxFileSize: "8MB" },
    })
      .middleware(async () => {
        const { user } = await validateRequest();
        if (!user) throw new UploadThingError("Unauthorized");
        return { userId: user.id };
      })
      .onUploadComplete(async ({ file }) => {
        return { url: file.url };
      }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;