// src/pages/reset-password/[token].tsx
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

interface FormErrors {
  password?: string[];
  confirmPassword?: string[];
  general?: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    if (!token || typeof token !== 'string') {
      setErrors({ general: 'Invalid reset token' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.details) {
          // Validation errors
          setErrors(data.details);
        } else if (response.status === 400) {
          // Invalid or expired token
          setErrors({ general: data.message || 'Invalid or expired reset token' });
        } else {
          // Other errors
          setErrors({ general: data.message || 'Password reset failed. Please try again.' });
        }
        setIsLoading(false);
        return;
      }

      // Success - show message and redirect to login
      setSuccessMessage(data.message);
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value });
    // Clear errors for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <>
      <Head>
        <title>Reset Password - StreamFlow</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Set new password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Enter your new password below.
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange('password')}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                  disabled={isLoading || !!successMessage}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password[0]}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 8 characters
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="••••••••"
                  disabled={isLoading || !!successMessage}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword[0]}</p>
                )}
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="rounded-md bg-red-900/20 border border-red-800 p-4">
                <p className="text-sm text-red-400">{errors.general}</p>
                {errors.general.includes('expired') && (
                  <p className="text-xs text-gray-400 mt-2">
                    <Link href="/forgot-password" className="text-green-500 hover:text-green-400">
                      Request a new reset link
                    </Link>
                  </p>
                )}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-md bg-green-900/20 border border-green-800 p-4">
                <p className="text-sm text-green-400">{successMessage}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Redirecting to login...
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !!successMessage}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-black bg-green-500 hover:bg-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Resetting password...' : successMessage ? 'Password reset!' : 'Reset password'}
              </button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <Link href="/login" className="text-sm font-medium text-green-500 hover:text-green-400">
                ← Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

