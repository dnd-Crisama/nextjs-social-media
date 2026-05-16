"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { 
  getReports, 
  resolveReport, 
  dismissReport, 
  deleteReportedContent,
  hideReportedComment,
} from "../actions/reports";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2, CheckCircle, XCircle, ActivitySquare, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type ReportData = Awaited<ReturnType<typeof getReports>>[number];

type ModerationAction = {
  type: "POST" | "COMMENT";
  reportId: string;
  contentId: string;
  title: string;
  description: string;
  confirmLabel: string;
};

export default function ReportsTab() {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [pendingAction, setPendingAction] = useState<ModerationAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: string) {
    await resolveReport(id, "Resolved by admin");
    fetchReports();
  }

  async function handleDismiss(id: string) {
    await dismissReport(id, "Dismissed by admin");
    fetchReports();
  }

  function requestHidePost(reportId: string, postId: string) {
    setPendingAction({
      type: "POST",
      reportId,
      contentId: postId,
      title: "Ẩn bài viết bị báo cáo?",
      description: "Bài viết sẽ bị gỡ khỏi giao diện người dùng và report sẽ được đánh dấu đã xử lý.",
      confirmLabel: "Ẩn bài viết",
    });
  }

  function requestHideComment(reportId: string, commentId: string) {
    setPendingAction({
      type: "COMMENT",
      reportId,
      contentId: commentId,
      title: "Ẩn bình luận bị báo cáo?",
      description: "Bình luận sẽ không còn hiển thị trong bài viết, nhưng vẫn được giữ trong database để có thể khôi phục sau này.",
      confirmLabel: "Ẩn bình luận",
    });
  }

  async function handleConfirmModerationAction() {
    if (!pendingAction) return;

    setActionLoading(true);
    try {
      if (pendingAction.type === "POST") {
        await deleteReportedContent(pendingAction.reportId, "POST", pendingAction.contentId);
      } else {
        await hideReportedComment(pendingAction.reportId, pendingAction.contentId);
        setSelectedReport(null);
      }
      setPendingAction(null);
      fetchReports();
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Quản lý báo cáo</h2>
        <Button onClick={fetchReports} variant="outline" size="sm">Làm mới</Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-sm font-medium">Danh sách báo cáo</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nội dung bị báo cáo</TableHead>
                <TableHead>Loại / Lý do</TableHead>
                <TableHead>Người báo cáo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Không có báo cáo nào
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="max-w-[300px]">
                      {report.reportedPost && (
                        <div className="space-y-1">
                          <Badge variant="outline" className="mb-1 bg-blue-50 text-blue-700">Bài viết</Badge>
                          <div className="text-sm truncate">
                            {report.reportedPost.content || "Media content"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            bởi {report.reportedPost.user.displayName}
                          </div>
                        </div>
                      )}
                      {report.reportedComment && (
                        <div className="space-y-1">
                          <Badge variant="outline" className="mb-1 bg-purple-50 text-purple-700">Bình luận</Badge>
                          {report.reportedComment.isHidden && (
                            <Badge variant="secondary" className="ml-1">Hidden</Badge>
                          )}
                          <div className="text-sm truncate">
                            {report.reportedComment.content}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            bởi {report.reportedComment.user.displayName}
                          </div>
                        </div>
                      )}
                      {(!report.reportedPost && !report.reportedComment && report.reportedUser) && (
                        <div className="space-y-1">
                          <Badge variant="outline" className="mb-1 bg-green-50 text-green-700">Người dùng</Badge>
                          <div className="text-sm font-medium">
                            {report.reportedUser.displayName} (@{report.reportedUser.username})
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{report.type}</div>
                      <div className="text-xs text-muted-foreground mt-1">{report.reason}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{report.reporter.displayName}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: vi })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={report.status === "PENDING" ? "default" : report.status === "RESOLVED" ? "secondary" : "outline"}
                      >
                        {report.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {report.status === "PENDING" && (
                          <>
                            {(report.reportedPost || report.reportedComment) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReport(report)}
                                title="Xem chi tiết nội dung"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {report.reportedPost && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => requestHidePost(report.id, report.reportedPost!.id)}
                                title="Xóa bài viết"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {report.reportedComment && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                disabled={report.reportedComment.isHidden}
                                onClick={() => requestHideComment(report.id, report.reportedComment!.id)}
                                title={report.reportedComment.isHidden ? "Comment is already hidden" : "Hide reported comment"}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleResolve(report.id)}
                              title="Đánh dấu đã giải quyết"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDismiss(report.id)}
                              title="Bỏ qua"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {report.status !== "PENDING" && (report.reportedPost || report.reportedComment) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReport(report)}
                            title="Xem chi tiết nội dung"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {(report.reportedPost?.user.username || report.reportedComment?.user.username || report.reportedUser?.username) && (
                          <Button 
                            size="sm" 
                            variant="secondary"
                            title="Xem nhật ký hoạt động"
                            onClick={() => {
                              // Chuyển tab bằng cách cập nhật localStorage và trigger reload hoặc dispatch event.
                              // Tuy nhiên, cách tốt nhất là dispatch custom event để page.tsx thay đổi state
                              // Tạm thời có thể reload kèm hash hoặc custom event
                              const username = report.reportedPost?.user.username || report.reportedComment?.user.username || report.reportedUser?.username;
                              window.location.hash = `#activity-${username}`;
                            }}
                          >
                            <ActivitySquare className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      <ReportDetailDialog
        report={selectedReport}
        open={!!selectedReport}
        onHideComment={requestHideComment}
        onOpenChange={(open) => {
          if (!open) setSelectedReport(null);
        }}
      />
      <ModerationConfirmDialog
        action={pendingAction}
        loading={actionLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={handleConfirmModerationAction}
      />
    </div>
  );
}

interface ModerationConfirmDialogProps {
  action: ModerationAction | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ModerationConfirmDialog({
  action,
  loading,
  onCancel,
  onConfirm,
}: ModerationConfirmDialogProps) {
  return (
    <Dialog open={!!action} onOpenChange={(open) => !open && !loading && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Trash2 className="h-5 w-5" />
          </div>
          <DialogTitle>{action?.title}</DialogTitle>
          <DialogDescription>{action?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action?.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ReportDetailDialogProps {
  report: ReportData | null;
  open: boolean;
  onHideComment: (reportId: string, commentId: string) => void;
  onOpenChange: (open: boolean) => void;
}

function ReportDetailDialog({ report, open, onHideComment, onOpenChange }: ReportDetailDialogProps) {
  if (!report) return null;

  const post = report.reportedPost;
  const comment = report.reportedComment;
  const contentType = post ? "Bài viết" : comment ? "Bình luận" : "Người dùng";
  const author = post?.user || comment?.user || report.reportedUser;
  const postLink = post?.id || comment?.post?.id ? `/posts/${post?.id || comment?.post?.id}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết báo cáo</DialogTitle>
          <DialogDescription>
            Xem đầy đủ nội dung {contentType.toLowerCase()} bị báo cáo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailBlock label="Loại báo cáo" value={report.type} />
          <DetailBlock label="Trạng thái" value={report.status} />
          <DetailBlock label="Lý do" value={report.reason} />
          <DetailBlock
            label="Người báo cáo"
            value={`${report.reporter.displayName} (@${report.reporter.username})`}
          />
          <DetailBlock
            label="Thời gian"
            value={formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: vi })}
          />
          {author && (
            <DetailBlock
              label="Tác giả nội dung"
              value={`${author.displayName} (@${author.username})`}
            />
          )}
        </div>

        {post && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">Bài viết</Badge>
              {postLink && (
                <Button asChild size="sm" variant="outline">
                  <Link href={postLink}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Mở bài viết
                  </Link>
                </Button>
              )}
            </div>
            <div className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
              {post.content || "Bài viết không có nội dung chữ."}
            </div>
            {post.group && (
              <div className="text-sm text-muted-foreground">
                Nhóm: {post.group.name}
              </div>
            )}
            {!!post.attachments.length && (
              <MediaGrid attachments={post.attachments} />
            )}
          </div>
        )}

        {comment && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700">Bình luận</Badge>
                {comment.isHidden && <Badge variant="secondary">Hidden</Badge>}
              </div>
              {postLink && (
                <Button asChild size="sm" variant="outline">
                  <Link href={postLink}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Mở bài viết gốc
                  </Link>
                </Button>
              )}
            </div>
            <div className="whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
              {comment.content}
            </div>
            {comment.post && (
              <div className="space-y-1 rounded-md border p-3 text-sm">
                <div className="font-medium">Bài viết gốc</div>
                <div className="line-clamp-3 whitespace-pre-wrap break-words text-muted-foreground">
                  {comment.post.content || "Bài viết không có nội dung chữ."}
                </div>
                <div className="text-xs text-muted-foreground">
                  bởi {comment.post.user.displayName} (@{comment.post.user.username})
                </div>
              </div>
            )}
          </div>
        )}

        {comment && report.status === "PENDING" && (
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={comment.isHidden}
              onClick={() => onHideComment(report.id, comment.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {comment.isHidden ? "Comment is already hidden" : "Hide reported comment"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 break-words text-sm">{value}</div>
    </div>
  );
}

function MediaGrid({ attachments }: { attachments: NonNullable<ReportData["reportedPost"]>["attachments"] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {attachments.map((media) => (
        <div key={media.id} className="overflow-hidden rounded-lg border bg-muted">
          {media.type === "IMAGE" ? (
            <div className="relative h-56 w-full">
              <Image src={media.url} alt="Reported post attachment" fill className="object-cover" />
            </div>
          ) : (
            <video src={media.url} controls className="max-h-72 w-full bg-black" />
          )}
        </div>
      ))}
    </div>
  );
}
