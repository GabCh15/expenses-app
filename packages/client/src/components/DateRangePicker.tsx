import { cn } from "@/lib/utils";
import { DatePicker } from "./DatePicker";

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  label,
  className,
}: DateRangePickerProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      )}
      <div className="flex items-center gap-2">
        <DatePicker value={from} onChange={onFromChange} />
        <span className="text-sm text-muted-foreground">to</span>
        <DatePicker value={to} onChange={onToChange} />
      </div>
    </div>
  );
}
