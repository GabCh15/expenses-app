import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExpenseResponse } from "@gasto/shared";
import { formatCurrency } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  expense: ExpenseResponse | null;
  currency: string;
  onConfirm: () => void;
  isPending: boolean;
}

export function DeleteDialog({
  open,
  onClose,
  expense,
  currency,
  onConfirm,
  isPending,
}: DeleteDialogProps) {
  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Expense
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete this expense?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted rounded-md p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-medium">
              {formatCurrency(expense.amount, expense.currency || currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Category</span>
            <span className="font-medium">
              {expense.category?.icon || "•"} {expense.category?.name || "Uncategorized"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span className="font-medium">
              {new Date(expense.expenseDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          {expense.description && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Description</span>
              <span className="font-medium max-w-[200px] truncate">
                {expense.description}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
