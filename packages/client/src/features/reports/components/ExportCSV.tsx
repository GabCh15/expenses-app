import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportCSVProps {
  csv: string | undefined;
  isLoading: boolean;
  onGenerate: () => void;
  filename?: string;
}

export function ExportCSV({ csv, isLoading, onGenerate, filename = "expenses.csv" }: ExportCSVProps) {
  const handleDownload = () => {
    if (!csv) {
      onGenerate();
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <Button onClick={handleDownload} disabled={isLoading} className="gap-2">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {isLoading ? "Generating..." : "Export CSV"}
    </Button>
  );
}
