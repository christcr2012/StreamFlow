// src/pages/login.tsx
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

export default function Login() {
  const r = useRouter();
  const { error, next } = r.query as { error?: string; next?: string };

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="glass-card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">Welcome Back</h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Sign in to your WorkStream account
          </p>
        </div>

        {error === "missing" && (
          <div className="mb-6 p-4 rounded-lg" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)' 
          }}>
            <p className="text-sm" style={{ color: 'var(--accent-error)' }}>
              ⚠️ Please enter email and password.
            </p>
          </div>
        )}
        
        {error === "invalid" && (
          <div className="mb-6 p-4 rounded-lg" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)' 
          }}>
            <p className="text-sm" style={{ color: 'var(--accent-error)' }}>
              ❌ Invalid email or password.
            </p>
          </div>
        )}
        
        {error === "server" && (
          <div className="mb-6 p-4 rounded-lg" style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)' 
          }}>
            <p className="text-sm" style={{ color: 'var(--accent-error)' }}>
              🔧 Server error. Please try again.
            </p>
          </div>
        )}

        <form method="POST" action="/api/auth/login" className="space-y-6">
          <input type="hidden" name="next" value={next || "/dashboard"} />

          <div>
            <label 
              className="block text-sm font-medium mb-2" 
              htmlFor="email"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              autoComplete="email"
              required
              type="email"
              className="input-field"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2" 
              htmlFor="password"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              autoComplete="current-password"
              required
              type="password"
              className="input-field"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3">
            <span>Sign In</span>
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Mountain Vista Lead Management System
          </p>
        </div>
      </div>
    </div>
  );
}

// If already signed in, bounce to dashboard.
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  if (ctx.req.cookies?.ws_user) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }
  return { props: {} };
};
