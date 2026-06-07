import { Outlet } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Expense</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Personal Expense Tracker
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Outlet />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
