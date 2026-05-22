import { RegisterForm } from "@/features/auth/components/RegisterForm";

export function RegisterPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Create account</h2>
      <RegisterForm />
    </div>
  );
}
