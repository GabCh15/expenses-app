import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useUserCurrency } from "../hooks";
import { DailyStats } from "../api";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceDot,
} from "recharts";
import { format, parseISO, isWeekend } from "date-fns";

interface LineChartProps {
  days: DailyStats[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

function SkeletonChart() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-full w-full bg-muted animate-pulse rounded" />
    </div>
  );
}

export function LineChart({ days, isLoading, isError, onRetry }: LineChartProps) {
  const currency = useUserCurrency();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Spending Trend</CardTitle>
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
          <CardTitle className="text-lg">Daily Spending Trend</CardTitle>
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
          <CardTitle className="text-lg">Daily Spending Trend</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">No expenses this month</p>
        </CardContent>
      </Card>
    );
  }

  let cumulative = 0;
  const data = (days ?? []).map((d) => {
    cumulative += parseFloat(d.total);
    const date = parseISO(d.date);
    return {
      day: format(date, "d"),
      daily: parseFloat(d.total),
      cumulative,
      isWeekend: isWeekend(date),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Daily Spending Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <ReLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v: number) =>
                formatCurrency(v, currency).replace(/\.00$/, "")
              }
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value, currency),
                name === "cumulative" ? "Cumulative" : "Daily",
              ]}
            />
            <Area
              type="monotone"
              dataKey="cumulative"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
            {data
              .filter((d) => d.isWeekend)
              .map((d, i) => (
                <ReferenceDot
                  key={`weekend-${i}`}
                  x={d.day}
                  y={d.cumulative}
                  r={3}
                  fill="#f43f5e"
                  stroke="none"
                />
              ))}
          </ReLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
