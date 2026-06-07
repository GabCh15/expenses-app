import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryResponse, ExpenseResponse } from "@expense/shared";

const formSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.enum(["USD", "COP", "EUR"]),
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  expenseDate: z.string().min(1, "Date is required"),
});

type FormData = z.infer<typeof formSchema>;

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryResponse[];
  expense?: ExpenseResponse | null;
  defaultCurrency?: string;
  onSubmit: (data: {
    amount: number;
    currency: string;
    categoryId: string;
    description?: string;
    expenseDate?: string;
  }) => void;
  isPending: boolean;
}

export function ExpenseForm({
  open,
  onClose,
  categories,
  expense,
  defaultCurrency = "USD",
  onSubmit,
  isPending,
}: ExpenseFormProps) {
  const isEdit = !!expense;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      currency: "USD" as const,
      categoryId: "",
      description: "",
      expenseDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (open) {
      if (expense) {
        reset({
          amount: parseFloat(expense.amount),
          currency: (expense.currency as "USD" | "COP" | "EUR") || "USD",
          categoryId: expense.categoryId || "",
          description: expense.description || "",
          expenseDate: expense.expenseDate.split("T")[0],
        });
      } else {
        reset({
          amount: undefined,
          currency: (defaultCurrency as "USD" | "COP" | "EUR") || "USD",
          categoryId: "",
          description: "",
          expenseDate: new Date().toISOString().split("T")[0],
        });
      }
    }
  }, [open, expense, reset, defaultCurrency]);

  const handleFormSubmit = (data: FormData) => {
    const payload = {
      amount: data.amount,
      currency: data.currency,
      categoryId: data.categoryId,
      description: data.description || undefined,
      expenseDate: new Date(data.expenseDate).toISOString(),
    };

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Expense" : "Add Expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={watch("currency")}
                onValueChange={(v) =>
                  setValue("currency", v as "USD" | "COP" | "EUR")
                }
                disabled={isEdit}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
              {isEdit && (
                <p className="text-xs text-muted-foreground">Currency cannot be changed</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={watch("categoryId")}
              onValueChange={(v) => setValue("categoryId", v)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon || "•"}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="text-sm text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional description"
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("expenseDate")} />
            {errors.expenseDate && (
              <p className="text-sm text-destructive">{errors.expenseDate.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
