import { PostData } from "@/lib/types";
import { Flag, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DeletePostDialog from "./DeletePostDialog";
import ReportDialog from "../ReportDialog";
import { useSession } from "@/app/(main)/SessionProvider";

interface PostMoreButtonProps {
  post: PostData;
  className?: string;
}

export default function PostMoreButton({
  post,
  className,
}: PostMoreButtonProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { user } = useSession();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {post.user.id === user.id && (
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
              <span className="flex items-center gap-3 text-destructive">
                <Trash2 className="size-4" />
                Delete
              </span>
            </DropdownMenuItem>
          )}
          {post.user.id !== user.id && (
            <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
              <span className="flex items-center gap-3 text-destructive">
                <Flag className="size-4" />
                Report
              </span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <DeletePostDialog
        post={post}
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      />
      <ReportDialog
        post={post}
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
      />
    </>
  );
}