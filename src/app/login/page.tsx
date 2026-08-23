import Logo from "@/components/Logo";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: rawNext } = await searchParams;
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-3xl border border-cream-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo size={48} />
        </div>
        <h1 className="text-center font-display text-2xl font-semibold text-brand-900">
          Welkom terug
        </h1>
        <p className="mt-1 text-center text-sm text-brand-700">
          Log in om verder te gaan.
        </p>

        <div className="mt-8">
          <LoginForm next={next} />
        </div>
      </div>
    </div>
  );
}
