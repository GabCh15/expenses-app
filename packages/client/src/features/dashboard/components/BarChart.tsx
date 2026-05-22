import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useUserCurrency } from "../hooks";
import { DailyStats } from "../api";
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, parseISO } from "date-fns";

interface BarChartProps {
  days: DailyStats[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onDayClick?: (date: string) => void;
}

function SkeletonChart() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-full w-full bg-muted animate-pulse rounded" />
    </div>
  );
}

export function BarChart({
  days,
  isLoading,
  isError,
  onRetry,
  onDayClick,
}: BarChartProps) {
  const currency = useUserCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonChart />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          <p className="text-sm text-destructive">Failed to load</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasData = days && days.some((d) => parseFloat(d.total) > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">No expenses this week</p>
        </CardContent>
      </Card>
    );
  }

  const data = (days ?? []).map((d) => ({
    day: format(parseISO(d.date), "EEE"),
    total: parseFloat(d.total),
    date: d.date,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekly Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ReBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) =>
                formatCurrency(v, currency).replace(/\.00$/, "")
              }
            />
            <Tooltip
              formatter={(value: number) => [
                formatCurrency(value, currency),
                "Total",
              ]}
            />
            <Bar
              dataKey="total"
              radius={[4, 4, 0, 0]}
              onClick={(_, index) => {
                if (onDayClick) onDayClick(data[index].date);
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.total > 0 ? "#6366f1" : "#e2e8f0"}
                  className="cursor-pointer"
                />
              ))}
            </Bar>
          </ReBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
