"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface BanGroupDialogProps {
  open: boolean;
  selected: { id: string; name: string } | null;
  banReason: string;
  banUntil: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onBanReasonChange: (value: string) => void;
  onBanUntilChange: (value: string) => void;
  onBan: () => void;
}

export function BanGroupDialog({
  open,
  selected,
  banReason,
  banUntil,
  isPending,
  onOpenChange,
  onBanReasonChange,
  onBanUntilChange,
  onBan,
}: BanGroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban nhóm {selected?.name ? `"${selected.name}"` : ''}?</DialogTitle>
          <DialogDescription>
            Nhóm sẽ bị gỡ khỏi giao diện chính và chỉ admin mới có thể unban.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Lý do ban <span className="text-destructive">*</span>
            </p>
            <Input
              placeholder="Ví dụ: Vi phạm quy tắc cộng đồng..."
              value={banReason}
              onChange={(event) => onBanReasonChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && banReason.trim() && onBan()}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Hết hạn ban (tùy chọn)</p>
            <Input
              type="date"
              value={banUntil}
              onChange={(event) => onBanUntilChange(event.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button variant="destructive" disabled={!banReason.trim() || isPending} onClick={onBan}>
            {isPending ? 'Đang xử lý...' : 'Xác nhận ban'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
