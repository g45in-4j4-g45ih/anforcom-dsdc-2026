import Navbar from "@/components/navigation/Navbar";
import AuthForm from "@/components/AuthForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <Navbar />

      <main className="mx-auto max-w-sm px-4 py-10 sm:px-6">
        <AuthForm mode="register" />
      </main>
    </div>
  );
}
