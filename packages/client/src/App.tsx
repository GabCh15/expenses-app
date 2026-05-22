import { Routes, Route } from "react-router-dom";
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AuthGuard } from "@/features/auth/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { HomePage } from "@/pages/HomePage";
import { DailyPage } from "@/pages/DailyPage";
import { WeeklyPage } from "@/pages/WeeklyPage";
import { MonthlyPage } from "@/pages/MonthlyPage";
import { CategoriesPage } from "@/pages/CategoriesPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={
            <ErrorBoundary>
              <LoginPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/register"
          element={
            <ErrorBoundary>
              <RegisterPage />
            </ErrorBoundary>
          }
        />
      </Route>

      {/* Protected routes */}
      <Route
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        <Route
          path="/"
          element={
            <ErrorBoundary>
              <HomePage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/daily"
          element={
            <ErrorBoundary>
              <DailyPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/weekly"
          element={
            <ErrorBoundary>
              <WeeklyPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/monthly"
          element={
            <ErrorBoundary>
              <MonthlyPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/categories"
          element={
            <ErrorBoundary>
              <CategoriesPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/transactions"
          element={
            <ErrorBoundary>
              <TransactionsPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/reports"
          element={
            <ErrorBoundary>
              <ReportsPage />
            </ErrorBoundary>
          }
        />
        <Route
          path="/settings"
          element={
            <ErrorBoundary>
              <SettingsPage />
            </ErrorBoundary>
          }
        />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <ErrorBoundary>
            <NotFoundPage />
          </ErrorBoundary>
        }
      />
    </Routes>
  );
}

export default App;
