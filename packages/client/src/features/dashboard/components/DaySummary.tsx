import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { useUserCurrency } from "../hooks";
import { DailyStats } from "../api";

interface DaySummaryProps {
  stats: DailyStats | undefined;
  isLoading: boolean;
}

function SkeletonSummary() {
  return (
    <div className="space-y-3">
      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      <div className="h-4 w-24 bg-muted animate-pulse rounded" />
    </div>
  );
}

export function DaySummary({ stats, isLoading }: DaySummaryProps) {
  const currency = useUserCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Day Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonSummary />
        </CardContent>
      </Card>
    );
  }

  if (!stats || parseFloat(stats.total) === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Day Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No expenses for this day</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Day Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Total</span>
          <span className="text-xl font-bold">
            {formatCurrency(stats.total, currency)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Expenses</span>
          <span className="font-medium">{stats.count}</span>
        </div>
      </CardContent>
    </Card>
  );
}
