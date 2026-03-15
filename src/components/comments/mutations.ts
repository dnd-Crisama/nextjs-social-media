import { CommentData, CommentsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { deleteComment, submitComment } from "./actions";

export function useSubmitCommentMutation(postId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitComment,
    onSuccess: async (newComment) => {
      const queryKey: QueryKey = ["comments", postId];
      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
        queryKey,
        (oldData) => {
          if (!oldData) return oldData;

          const firstPage = oldData.pages[0];
          if (!firstPage) return oldData;

          // Nếu là root comment → append vào trang đầu
          if (!newComment.parentId) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  previousCursor: firstPage.previousCursor,
                  comments: [...firstPage.comments, newComment],
                },
                ...oldData.pages.slice(1),
              ],
            };
          }

          // Nếu là reply → inject vào đúng parent trong tree
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              ...page,
              comments: page.comments.map((comment) =>
                injectReply(comment, newComment),
              ),
            })),
          };
        },
      );

      queryClient.invalidateQueries({
        queryKey,
        predicate: (query) => !query.state.data,
      });

      toast({ description: "Comment posted" });
      try {
        await fetch('/api/quests/progress', { method: 'POST', body: JSON.stringify({ activityType: 'COMMENT_POST' }), headers: { 'Content-Type': 'application/json' } });
        queryClient.setQueryData(['daily-quests'], (old: any) =>
          old?.map((q: any) => (q.activityType === 'COMMENT_POST' ? { ...q, completed: true } : q)),
        );
      } catch {}
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Failed to post comment. Please try again.",
      });
    },
  });

  return mutation;
}

// Đệ quy inject reply vào đúng vị trí trong comment tree
function injectReply(comment: CommentData, newReply: CommentData): CommentData {
  if (comment.id === newReply.parentId) {
    return {
      ...comment,
      replies: [...(comment.replies ?? []), newReply],
    } as CommentData;
  }
  if (comment.replies?.length) {
    return {
      ...comment,
      replies: comment.replies.map((r) => injectReply(r, newReply)),
    } as CommentData;
  }
  return comment;
}

export function useDeleteCommentMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: async (deletedComment) => {
      const queryKey: QueryKey = ["comments", deletedComment.postId];
      await queryClient.cancelQueries({ queryKey });

      queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
        queryKey,
        (oldData) => {
          if (!oldData) return;
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              previousCursor: page.previousCursor,
              comments: removeComment(page.comments, deletedComment.id),
            })),
          };
        },
      );

      toast({ description: "Comment deleted" });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Failed to delete comment. Please try again.",
      });
    },
  });

  return mutation;
}

// Đệ quy xóa comment hoặc reply khỏi tree
function removeComment(comments: CommentData[], id: string): CommentData[] {
  return comments
    .filter((c) => c.id !== id)
    .map((c) => ({
      ...c,
      replies: c.replies ? removeComment(c.replies, id) : [],
    } as CommentData));
}