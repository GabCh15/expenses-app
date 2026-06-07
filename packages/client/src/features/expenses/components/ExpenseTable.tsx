import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExpenseResponse } from "@expense/shared";
import { formatCurrency } from "@/lib/format";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";

interface ExpenseTableProps {
  expenses: ExpenseResponse[];
  currency: string;
  sort: string;
  onSort: (sort: "date_desc" | "date_asc" | "amount_desc" | "amount_asc") => void;
  onEdit: (expense: ExpenseResponse) => void;
  onDelete: (expense: ExpenseResponse) => void;
  isLoading?: boolean;
}

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell>
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
      </TableCell>
      <TableCell>
        <div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" />
      </TableCell>
      <TableCell>
        <div className="flex gap-2 justify-end">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ExpenseTable({
  expenses,
  currency,
  sort,
  onSort,
  onEdit,
  onDelete,
  isLoading,
}: ExpenseTableProps) {
  const toggleSort = (field: "date" | "amount") => {
    if (field === "date") {
      onSort(sort === "date_desc" ? "date_asc" : "date_desc");
    } else {
      onSort(sort === "amount_desc" ? "amount_asc" : "amount_desc");
    }
  };

  if (isLoading) {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border rounded-md bg-muted/20">
        <p className="text-lg font-medium text-muted-foreground">No expenses yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first expense to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => toggleSort("date")}>
              <span className="flex items-center gap-1">
                Date
                <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead
              className="text-right cursor-pointer"
              onClick={() => toggleSort("amount")}
            >
              <span className="flex items-center justify-end gap-1">
                Amount
                <ArrowUpDown className="h-3 w-3" />
              </span>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow
              key={expense.id}
              className="cursor-pointer"
              onClick={() => onEdit(expense)}
            >
              <TableCell className="whitespace-nowrap">
                {new Date(expense.expenseDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span>{expense.category?.icon || "•"}</span>
                  <span className="whitespace-nowrap">
                    {expense.category?.name || "Uncategorized"}
                  </span>
                </span>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {expense.description || "—"}
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {formatCurrency(expense.amount, expense.currency || currency)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(expense);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(expense);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
