"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type LogUser = {
  username: string;
  displayName: string;
  isBanned: boolean;
  violationCount: number;
  violationTotal: number;
};

type Log = {
  id: string;
  userId: string;
  commentId: string;
  content: string;
  aiScore: number;
  aiFlag: string;
  action: string;
  createdAt: string;
  user: LogUser;
};

export default function CommentModerationTab() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchLogs = async (flag = "") => {
    setLoading(true);
    try {
      const url = "/api/admin/moderation" + (flag ? `?flag=${flag}` : "");
      const res = await fetch(url);
      const data = await res.json();
      setLogs(data.logs ?? []);
    } catch (e) {
      console.error(e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(filter);
  }, [filter]);

  const handleUnban = async (userId: string, username: string) => {
    try {
      const res = await fetch("/api/admin/moderation/unban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        toast({ description: `@${username} has been unbanned.` });
        fetchLogs(filter);
      }
    } catch (error) {
      toast({ variant: "destructive", description: "Failed to unban user." });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId);
    try {
      const res = await fetch('/api/admin/moderation/delete-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        toast({ description: 'Comment đã bị xóa.' });
        fetchLogs(filter);
      } else {
        const data = await res.json();
        toast({ variant: 'destructive', description: data.error || 'Failed to delete comment.' });
      }
    } catch {
      toast({ variant: 'destructive', description: 'Failed to delete comment.' });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const flagColor = (flag: string) => {
    if (flag === "DELETE") return "text-red-600 font-bold";
    if (flag === "FLAG") return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["", "DELETE", "FLAG", "ALLOW"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="default"
            onClick={() => setFilter(f)}
          >
            {f || "All Logs"}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No records found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["User", "Violations", "Comment", "AI Score", "Flag", "Action", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">@{log.user.username}</div>
                    <div className="text-xs text-muted-foreground">{log.user.displayName}</div>
                    {log.user.isBanned && (
                      <span className="mt-1 inline-block rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 uppercase">
                        Banned
                      </span>
                    )}
                  </td>

                  {/* ── CỘT VIOLATION COUNT ── */}
                  <td className="px-4 py-3 text-center">
                    <div 
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border font-bold text-xs",
                        log.user.violationTotal >= 3 
                          ? "bg-red-50 text-red-700 border-red-200 shadow-sm" 
                          : log.user.violationTotal > 0 
                            ? "bg-amber-50 text-amber-700 border-amber-200" 
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}
                      title={`${log.user.violationTotal} total violations`}
                    >
                      {log.user.violationTotal}
                    </div>
                  </td>

                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate text-muted-foreground italic" title={log.content}>
                      "{log.content}"
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium">{log.aiScore.toFixed(3)}</td>
                  <td className={cn("px-4 py-3", flagColor(log.aiFlag))}>
                    {log.aiFlag}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium uppercase text-muted-foreground/80">
                    {log.action}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {log.user.isBanned && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs font-semibold"
                        onClick={() => handleUnban(log.userId, log.user.username)}
                      >
                        Unban
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 text-xs font-semibold"
                      disabled={deletingCommentId === log.commentId}
                      onClick={() => handleDeleteComment(log.commentId)}
                    >
                      {deletingCommentId === log.commentId ? 'Đang xóa...' : 'Xóa'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}