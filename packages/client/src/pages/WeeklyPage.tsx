import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { WeekSelector } from "@/features/dashboard/components/WeekSelector";
import { BarChart } from "@/features/dashboard/components/BarChart";
import { useWeeklyStats } from "@/features/dashboard/api";
import { formatCurrency } from "@/lib/format";
import { useUserCurrency } from "@/features/dashboard/hooks";

export function WeeklyPage() {
  const navigate = useNavigate();
  const currency = useUserCurrency();
  const [weekDate, setWeekDate] = useState(new Date());

  const weekStart = useMemo(
    () => format(startOfWeek(weekDate, { weekStartsOn: 1 }), "yyyy-MM-dd"),
    [weekDate]
  );

  const {
    data: weekly,
    isLoading,
    isError,
    refetch,
  } = useWeeklyStats(weekStart);

  const days = weekly?.days ?? [];
  const total = weekly ? parseFloat(weekly.total) : 0;
  const avgPerDay = days.length > 0 ? total / 7 : 0;

  const bestDay = days.reduce(
    (best, d) => (parseFloat(d.total) > parseFloat(best.total) ? d : best),
    days[0] ?? { date: "", total: "0" }
  );
  const worstDay = days.reduce(
    (worst, d) =>
      parseFloat(d.total) < parseFloat(worst.total) && parseFloat(d.total) > 0
        ? d
        : worst,
    days[0] ?? { date: "", total: "0" }
  );

  const handleDayClick = (date: string) => {
    navigate(`/daily?date=${encodeURIComponent(date)}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Weekly</h1>
        <WeekSelector date={weekDate} onChange={setWeekDate} />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 py-8 border rounded-md bg-muted/20">
          <p className="text-sm text-destructive">Failed to load weekly stats</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weekly ? formatCurrency(weekly.total, currency) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg / Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weekly ? formatCurrency(avgPerDay, currency) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Best Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bestDay?.date
                  ? formatCurrency(bestDay.total, currency)
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {bestDay?.date
                  ? format(new Date(bestDay.date), "EEE, MMM d")
                  : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Worst Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {worstDay?.date && parseFloat(worstDay.total) > 0
                  ? formatCurrency(worstDay.total, currency)
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {worstDay?.date && parseFloat(worstDay.total) > 0
                  ? format(new Date(worstDay.date), "EEE, MMM d")
                  : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <BarChart
        days={weekly?.days}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onDayClick={handleDayClick}
      />
    </div>
  );
}
