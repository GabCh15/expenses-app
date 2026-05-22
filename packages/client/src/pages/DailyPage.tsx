import { useState } from "react";
import { DatePicker } from "@/components/DatePicker";
import { DaySummary } from "@/features/dashboard/components/DaySummary";
import { CategoryBreakdownChart } from "@/features/dashboard/components/CategoryBreakdown";
import { useDailyStats, useCategoryBreakdown } from "@/features/dashboard/api";

export function DailyPage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const {
    data: daily,
    isLoading: dailyLoading,
  } = useDailyStats(date);

  const {
    data: breakdown,
    isLoading: breakdownLoading,
    isError: breakdownError,
    refetch: refetchBreakdown,
  } = useCategoryBreakdown(date, date);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily</h1>
        <DatePicker value={date} onChange={setDate} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DaySummary stats={daily} isLoading={dailyLoading} />
        <CategoryBreakdownChart
          data={breakdown}
          isLoading={breakdownLoading}
          isError={breakdownError}
          onRetry={refetchBreakdown}
        />
      </div>
    </div>
  );
}
