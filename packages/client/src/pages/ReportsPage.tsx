import { useState } from "react";
import { ReportBuilder, ReportRange } from "@/features/reports/components/ReportBuilder";
import { ExportCSV } from "@/features/reports/components/ExportCSV";
import { useExportCSV } from "@/features/reports/api";

function getRangeFromState(state: ReportRange): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  switch (state.preset) {
    case "this_month":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to };
    case "last_month": {
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        to: new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59).toISOString(),
      };
    }
    case "last_3_months":
      return { from: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(), to };
    case "this_year":
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to };
    default:
      return {
        from: state.customFrom ? new Date(state.customFrom).toISOString() : "",
        to: state.customTo ? new Date(state.customTo + "T23:59:59").toISOString() : "",
      };
  }
}

export function ReportsPage() {
  const [range, setRange] = useState<ReportRange>({
    preset: "this_month",
    customFrom: "",
    customTo: "",
  });

  const { from, to } = getRangeFromState(range);
  const { data: csv, isFetching, refetch } = useExportCSV(from, to);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <ExportCSV
          csv={csv}
          isLoading={isFetching}
          onGenerate={() => refetch()}
        />
      </div>

      <ReportBuilder range={range} onRangeChange={setRange} />
    </div>
  );
}
