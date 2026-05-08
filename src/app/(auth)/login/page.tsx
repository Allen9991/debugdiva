import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-cyan-700">Admin Ghost</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Sign in to your admin workspace
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use a magic link for the hackathon demo. No passwords, no fuss.
        </p>
        <MagicLinkForm />
      </section>
    </main>
  );
}
