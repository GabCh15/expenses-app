import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import { useUserCurrency } from "@/features/dashboard/hooks";
import { useReportSummary } from "@/features/reports/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Hash, DollarSign, Tag } from "lucide-react";

const presets = [
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "Last 3 Months", value: "last_3_months" },
  { label: "This Year", value: "this_year" },
  { label: "Custom", value: "custom" },
];

function getPresetRange(preset: string): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();

  switch (preset) {
    case "this_month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { from, to };
    }
    case "last_month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastTo = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59).toISOString();
      return { from, to: lastTo };
    }
    case "last_3_months": {
      const from = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
      return { from, to };
    }
    case "this_year": {
      const from = new Date(now.getFullYear(), 0, 1).toISOString();
      return { from, to };
    }
    default:
      return { from: "", to: "" };
  }
}

export interface ReportRange {
  preset: string;
  customFrom: string;
  customTo: string;
}

interface ReportBuilderProps {
  range: ReportRange;
  onRangeChange: (range: ReportRange) => void;
}

export function ReportBuilder({ range, onRangeChange }: ReportBuilderProps) {
  const currency = useUserCurrency();
  const { preset, customFrom, customTo } = range;

  const { from, to } =
    preset === "custom"
      ? {
          from: customFrom ? new Date(customFrom).toISOString() : "",
          to: customTo ? new Date(customTo + "T23:59:59").toISOString() : "",
        }
      : getPresetRange(preset);

  const { data: summary, isLoading } = useReportSummary(from, to);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex flex-col gap-1.5 min-w-[200px]">
              <Label>Date Range</Label>
              <Select
                value={preset}
                onValueChange={(value) =>
                  onRangeChange({ ...range, preset: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {preset === "custom" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label>From</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) =>
                      onRangeChange({ ...range, customFrom: e.target.value })
                    }
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>To</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) =>
                      onRangeChange({ ...range, customTo: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {summary && !isLoading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.total, currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Count</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Avg / Day</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.avgPerDay, currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Top Category</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold truncate">
                  {summary.topCategory
                    ? `${summary.topCategory.categoryIcon || ""} ${summary.topCategory.categoryName || "Uncategorized"}`
                    : "—"}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {summary.categories.length === 0 ? (
                <p className="text-muted-foreground">No data for this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.categories.map((cat) => (
                        <TableRow key={cat.categoryId || "uncategorized"}>
                          <TableCell>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full inline-block"
                                style={{ backgroundColor: cat.categoryColor || "#6366f1" }}
                              />
                              <span>{cat.categoryIcon || "•"}</span>
                              <span>{cat.categoryName || "Uncategorized"}</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(cat.total, currency)}
                          </TableCell>
                          <TableCell className="text-right">{cat.count}</TableCell>
                          <TableCell className="text-right">{cat.percentage.toFixed(1)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
