import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useDailyStats, useMonthlyStats } from "../api";
import { useUserCurrency } from "../hooks";
import { TrendingUp, Calendar, Hash, DollarSign } from "lucide-react";

function SkeletonCard() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 bg-muted animate-pulse rounded mt-2" />
      </CardContent>
    </Card>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-destructive">
          Failed to load
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

interface KPICardsProps {
  year: number;
  month: number;
}

export function KPICards({ year, month }: KPICardsProps) {
  const currency = useUserCurrency();

  const today = new Date().toISOString().split("T")[0];
  const {
    data: daily,
    isLoading: dailyLoading,
    isError: dailyError,
    refetch: refetchDaily,
  } = useDailyStats(today);

  const {
    data: monthly,
    isLoading: monthlyLoading,
    isError: monthlyError,
    refetch: refetchMonthly,
  } = useMonthlyStats(year, month);

  const daysElapsed = Math.min(new Date().getDate(), new Date(year, month, 0).getDate());
  const avgDaily = monthly
    ? parseFloat(monthly.total) / daysElapsed
    : 0;

  const kpis = [
    {
      title: "Today",
      value: daily ? formatCurrency(daily.total, currency) : "—",
      icon: DollarSign,
      error: dailyError,
      refetch: refetchDaily,
    },
    {
      title: "This Month",
      value: monthly ? formatCurrency(monthly.total, currency) : "—",
      icon: Calendar,
      error: monthlyError,
      refetch: refetchMonthly,
    },
    {
      title: "Avg / Day",
      value: monthly ? formatCurrency(avgDaily, currency) : "—",
      icon: TrendingUp,
      error: monthlyError,
      refetch: refetchMonthly,
    },
    {
      title: "Expenses",
      value: monthly ? String(monthly.count) : "—",
      icon: Hash,
      error: monthlyError,
      refetch: refetchMonthly,
    },
  ];

  const isLoading = dailyLoading || monthlyLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        if (kpi.error) {
          return <ErrorCard key={kpi.title} onRetry={kpi.refetch} />;
        }
        return (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
