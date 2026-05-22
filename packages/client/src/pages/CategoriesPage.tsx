import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker } from "@/components/DateRangePicker";
import { CategoryBreakdownChart } from "@/features/dashboard/components/CategoryBreakdown";
import { useCategoryBreakdown } from "@/features/dashboard/api";
import { formatCurrency } from "@/lib/format";
import { useUserCurrency } from "@/features/dashboard/hooks";
import { format, startOfMonth, endOfMonth } from "date-fns";

export function CategoriesPage() {
  const currency = useUserCurrency();
  const today = new Date();
  const [from, setFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  const {
    data: breakdown,
    isLoading,
    isError,
    refetch,
  } = useCategoryBreakdown(from, to);

  const sorted = useMemo(
    () =>
      breakdown
        ? [...breakdown]
            .filter((b) => parseFloat(b.total) > 0)
            .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
        : [],
    [breakdown]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <DateRangePicker
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
        />
      </div>

      <CategoryBreakdownChart
        data={breakdown}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Category Details</CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-muted-foreground text-sm">No expenses this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      Total
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      Count
                    </th>
                    <th className="text-right py-2 font-medium text-muted-foreground">
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((item) => (
                    <tr key={item.categoryId ?? "uncategorized"} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span>{item.categoryIcon ?? "📦"}</span>
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{
                              backgroundColor: item.categoryColor ?? "#94a3b8",
                            }}
                          />
                          <span className="font-medium">
                            {item.categoryName ?? "Uncategorized"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(item.total, currency)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {item.count}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
