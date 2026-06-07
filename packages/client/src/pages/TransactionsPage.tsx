import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ExpenseResponse } from "@expense/shared";
import { useUserCurrency } from "@/features/dashboard/hooks";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/features/expenses/api";
import { useCategories } from "@/features/settings/api";
import { ExpenseFilters, ExpenseFilterState } from "@/features/expenses/components/ExpenseFilters";
import { ExpenseTable } from "@/features/expenses/components/ExpenseTable";
import { ExpenseForm } from "@/features/expenses/components/ExpenseForm";
import { DeleteDialog } from "@/features/expenses/components/DeleteDialog";

export function TransactionsPage() {
  const [filters, setFilters] = useState<ExpenseFilterState>({
    page: 1,
    limit: 20,
    sort: "date_desc",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseResponse | null>(null);

  const currency = useUserCurrency();
  const { data: categoriesData } = useCategories();
  const { data: expensesData, isLoading } = useExpenses(filters);

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const categories = categoriesData || [];
  const expenses = expensesData?.items || [];
  const totalPages = expensesData?.totalPages || 1;
  const currentPage = expensesData?.page || 1;

  const handleAdd = () => {
    setEditingExpense(null);
    setFormOpen(true);
  };

  const handleEdit = (expense: ExpenseResponse) => {
    setEditingExpense(expense);
    setFormOpen(true);
  };

  const handleDelete = (expense: ExpenseResponse) => {
    setDeletingExpense(expense);
    setDeleteOpen(true);
  };

  const handleFormSubmit = (data: {
    amount: number;
    currency: string;
    categoryId: string;
    description?: string;
    expenseDate?: string;
  }) => {
    if (editingExpense) {
      updateExpense.mutate(
        { id: editingExpense.id, data },
        {
          onSuccess: () => {
            toast.success("Expense updated successfully");
            setFormOpen(false);
            setEditingExpense(null);
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : "Failed to update expense");
          },
        }
      );
    } else {
      createExpense.mutate(data, {
        onSuccess: () => {
          toast.success("Expense created successfully");
          setFormOpen(false);
          setFilters((f) => ({ ...f, page: 1 }));
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to create expense");
        },
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingExpense) return;
    deleteExpense.mutate(deletingExpense.id, {
      onSuccess: () => {
        toast.success("Expense deleted successfully");
        setDeleteOpen(false);
        setDeletingExpense(null);
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Failed to delete expense");
      },
    });
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setFilters((f) => ({ ...f, page }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ExpenseFilters
            categories={categories}
            filters={filters}
            onChange={setFilters}
          />
        </CardContent>
      </Card>

      <ExpenseTable
        expenses={expenses}
        currency={currency}
        sort={filters.sort || "date_desc"}
        onSort={(sort) => setFilters((f) => ({ ...f, sort, page: 1 }))}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ExpenseForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingExpense(null);
        }}
        categories={categories}
        expense={editingExpense}
        defaultCurrency={currency}
        onSubmit={handleFormSubmit}
        isPending={createExpense.isPending || updateExpense.isPending}
      />

      <DeleteDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingExpense(null);
        }}
        expense={deletingExpense}
        currency={currency}
        onConfirm={handleConfirmDelete}
        isPending={deleteExpense.isPending}
      />
    </div>
  );
}
