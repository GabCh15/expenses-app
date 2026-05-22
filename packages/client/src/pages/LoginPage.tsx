import { LoginForm } from "@/features/auth/components/LoginForm";

export function LoginPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Sign in</h2>
      <LoginForm />
    </div>
  );
}
