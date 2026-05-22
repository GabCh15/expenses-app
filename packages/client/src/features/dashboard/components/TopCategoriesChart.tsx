import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useCategoryBreakdown } from "../api";
import { useUserCurrency } from "../hooks";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TopCategoriesChartProps {
  from: string;
  to: string;
}

function SkeletonDonut() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="h-48 w-48 rounded-full bg-muted animate-pulse" />
    </div>
  );
}

export function TopCategoriesChart({ from, to }: TopCategoriesChartProps) {
  const currency = useUserCurrency();
  const {
    data: breakdown,
    isLoading,
    isError,
    refetch,
  } = useCategoryBreakdown(from, to);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonDonut />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Categories</CardTitle>
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

  const hasData = breakdown && breakdown.length > 0 && breakdown.some((b) => parseFloat(b.total) > 0);

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Categories</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground text-sm">No expenses this month</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = breakdown
    .filter((b) => parseFloat(b.total) > 0)
    .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
    .slice(0, 6);

  const data = sorted.map((item) => ({
    name: item.categoryName ?? "Uncategorized",
    value: parseFloat(item.total),
    color: item.categoryColor ?? "#94a3b8",
    percentage: item.percentage,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(
                value: number,
                _name: string,
                props: { payload?: { name: string; percentage: number } }
              ) => {
                const p = props.payload;
                if (!p) return [String(value), _name];
                return [
                  `${formatCurrency(value, currency)} (${p.percentage.toFixed(1)}%)`,
                  p.name,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.name}</span>
              <span className="ml-auto text-muted-foreground">
                {formatCurrency(item.value, currency)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
