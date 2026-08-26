import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <AuthForm mode="register" />
    </main>
  );
}
