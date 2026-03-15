"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { isAdmin } from "@/lib/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { redirect } from "next/navigation";
import FramesManagementTab from "./tabs/FramesManagementTab";

export default function AdminPage() {
  const { user } = useSession();

  if (!user || !isAdmin(user)) {
    redirect("/");
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">Manage frames and game systems.</p>
      </div>

      <Tabs defaultValue="frames" className="w-full">
        <TabsList>
          <TabsTrigger value="frames">Frame Management</TabsTrigger>
          <TabsTrigger value="activities" disabled>Chotto matte...</TabsTrigger>
        </TabsList>

        <TabsContent value="frames">
          <FramesManagementTab />
        </TabsContent>

        <TabsContent value="activities">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Activity Rewards management coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
