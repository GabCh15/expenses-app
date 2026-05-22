import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

interface MonthSelectorProps {
  date: Date;
  onChange: (date: Date) => void;
}

export function MonthSelector({ date, onChange }: MonthSelectorProps) {
  const label = format(date, "MMMM yyyy");

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(subMonths(date, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm font-medium min-w-[140px] text-center">
        {label}
      </span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onChange(addMonths(date, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
