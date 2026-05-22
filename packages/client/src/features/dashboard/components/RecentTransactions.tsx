import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useRecentExpenses } from "../api";
import { ArrowRight } from "lucide-react";

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

export function RecentTransactions() {
  const { data, isLoading, isError, refetch } = useRecentExpenses(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonRows />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-destructive">Failed to load</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-2 py-8">
          <p className="text-muted-foreground text-sm">
            No expenses yet. Add your first one!
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="/transactions">Add Expense</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/transactions" className="flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-3 py-2 border-b last:border-0"
          >
            <span className="text-lg">{expense.category?.icon ?? "📦"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {expense.category?.name ?? "Uncategorized"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {expense.description || "No description"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">
                {formatCurrency(expense.amount, expense.currency)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(expense.expenseDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
