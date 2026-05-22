import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryResponse } from "@gasto/shared";
import { Search, X } from "lucide-react";

export interface ExpenseFilterState {
  page?: number;
  limit?: number;
  categoryId?: string;
  from?: string;
  to?: string;
  search?: string;
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
}

interface ExpenseFiltersProps {
  categories: CategoryResponse[];
  filters: ExpenseFilterState;
  onChange: (filters: ExpenseFilterState) => void;
}

export function ExpenseFilters({ categories, filters, onChange }: ExpenseFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "");

  const hasFilters =
    filters.categoryId || filters.from || filters.to || filters.search || filters.sort;

  const handleClear = () => {
    setLocalSearch("");
    onChange({ sort: "date_desc" });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: localSearch || undefined });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
      <form onSubmit={handleSearchSubmit} className="flex-1">
        <Label htmlFor="search" className="text-sm font-medium">
          Search
        </Label>
        <div className="flex gap-2 mt-1.5">
          <Input
            id="search"
            placeholder="Search by description..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-1.5 min-w-[180px]">
        <Label className="text-sm font-medium">Category</Label>
        <Select
          value={filters.categoryId || "all"}
          onValueChange={(value) =>
            onChange({ ...filters, categoryId: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon || "•"}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium">From</Label>
        <Input
          type="date"
          value={filters.from ? filters.from.split("T")[0] : ""}
          onChange={(e) =>
            onChange({
              ...filters,
              from: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium">To</Label>
        <Input
          type="date"
          value={filters.to ? filters.to.split("T")[0] : ""}
          onChange={(e) =>
            onChange({
              ...filters,
              to: e.target.value ? new Date(e.target.value).toISOString() : undefined,
            })
          }
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1">
          <X className="h-4 w-4" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
