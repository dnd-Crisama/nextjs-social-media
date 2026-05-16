import { useState } from "react";
import { ReportType } from "@/generated/prisma";
import { useToast } from "./ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { submitReport } from "./reports/actions";
import LoadingButton from "./LoadingButton";

interface ReportDialogProps {
  post?: any; // We'll just pass the minimal needed
  comment?: any;
  user?: any; // To report a user
  open: boolean;
  onClose: () => void;
}

const reportReasons: Record<ReportType, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment or bullying",
  INAPPROPRIATE_CONTENT: "Inappropriate content",
  FAKE_ACCOUNT: "Fake account",
  OTHER: "Other",
};

export default function ReportDialog({
  post,
  comment,
  user,
  open,
  onClose,
}: ReportDialogProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!reportType) return;

    setIsSubmitting(true);
    try {
      await submitReport(
        reportType as ReportType,
        reportReasons[reportType as ReportType],
        user?.id,
        post?.id,
        comment?.id
      );
      toast({
        description: "Report submitted successfully. Thank you for your feedback.",
      });
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Failed to submit report. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const targetName = post
    ? "post"
    : comment
      ? "comment"
      : user
        ? "user"
        : "content";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetName}</DialogTitle>
          <DialogDescription>
            Why are you reporting this {targetName}? Your report is anonymous.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Select
            value={reportType}
            onValueChange={(val) => setReportType(val as ReportType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(reportReasons).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={!reportType || isSubmitting}
          >
            Submit
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
