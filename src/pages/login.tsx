// src/pages/login.tsx
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

export default function Login() {
  const r = useRouter();
  const { error, next } = r.query as { error?: string; next?: string };

  return (
    <div className="mx-auto max-w-md p-8">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>

      {error === "missing" && <p className="mb-3 text-sm text-red-600">Please enter email and password.</p>}
      {error === "invalid" && <p className="mb-3 text-sm text-red-600">Invalid email or password.</p>}
      {error === "server" && <p className="mb-3 text-sm text-red-600">Server error. Please try again.</p>}

      <form method="POST" action="/api/auth/login" className="space-y-4">
        {/* preserve next hop if middleware sent us here */}
        <input type="hidden" name="next" value={next || "/dashboard"} />

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            autoComplete="email"
            required
            type="email"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            autoComplete="current-password"
            required
            type="password"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Sign in
        </button>
      </form>
    </div>
  );
}

// If already signed in, bounce to dashboard.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (ctx.req.cookies?.mv_user) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
};
