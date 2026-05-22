import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthSelector } from "@/features/dashboard/components/MonthSelector";
import { LineChart } from "@/features/dashboard/components/LineChart";
import { useMonthlyStats } from "@/features/dashboard/api";
import { formatCurrency } from "@/lib/format";
import { useUserCurrency } from "@/features/dashboard/hooks";
import { format, parseISO } from "date-fns";

export function MonthlyPage() {
  const currency = useUserCurrency();
  const [monthDate, setMonthDate] = useState(new Date());

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;

  const {
    data: monthly,
    isLoading,
    isError,
    refetch,
  } = useMonthlyStats(year, month);

  const days = monthly?.days ?? [];
  const total = monthly ? parseFloat(monthly.total) : 0;
  const avgPerDay = days.length > 0 ? total / days.length : 0;

  const sortedByTotal = useMemo(
    () =>
      [...days]
        .filter((d) => parseFloat(d.total) > 0)
        .sort((a, b) => parseFloat(b.total) - parseFloat(a.total)),
    [days]
  );

  const bestDay = sortedByTotal[0];
  const worstDay = sortedByTotal[sortedByTotal.length - 1];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Monthly</h1>
        <MonthSelector date={monthDate} onChange={setMonthDate} />
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
          <p className="text-sm text-destructive">Failed to load monthly stats</p>
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
                {monthly ? formatCurrency(monthly.total, currency) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg / Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {monthly ? formatCurrency(avgPerDay, currency) : "—"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Best Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {bestDay ? formatCurrency(bestDay.total, currency) : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {bestDay ? format(parseISO(bestDay.date), "EEE, MMM d") : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Worst Day</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {worstDay && parseFloat(worstDay.total) > 0
                  ? formatCurrency(worstDay.total, currency)
                  : "—"}
              </div>
              <p className="text-xs text-muted-foreground">
                {worstDay && parseFloat(worstDay.total) > 0
                  ? format(parseISO(worstDay.date), "EEE, MMM d")
                  : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <LineChart
        days={monthly?.days}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Days</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedByTotal.length === 0 ? (
            <p className="text-muted-foreground text-sm">No expenses this month</p>
          ) : (
            <div className="space-y-2">
              {sortedByTotal.slice(0, 5).map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <span className="text-sm">
                    {format(parseISO(day.date), "EEEE, MMM d")}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {day.count} expenses
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(day.total, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
