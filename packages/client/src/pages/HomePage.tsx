import { useState } from "react";
import { KPICards } from "@/features/dashboard/components/KPICards";
import { TopCategoriesChart } from "@/features/dashboard/components/TopCategoriesChart";
import { RecentTransactions } from "@/features/dashboard/components/RecentTransactions";
import { MonthSelector } from "@/features/dashboard/components/MonthSelector";

export function HomePage() {
  const [monthDate, setMonthDate] = useState(new Date());
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;

  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const to = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <MonthSelector date={monthDate} onChange={setMonthDate} />
      </div>

      <KPICards year={year} month={month} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <TopCategoriesChart from={from} to={to} />
        </div>
        <div className="lg:col-span-2">
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}
