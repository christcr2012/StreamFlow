// src/pages/forgot-password.tsx
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Head from 'next/head';

interface FormErrors {
  email?: string[];
  general?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422 && data.details) {
          // Validation errors
          setErrors(data.details);
        } else if (response.status === 429) {
          // Rate limit
          setErrors({ general: 'Too many attempts. Please try again later.' });
        } else {
          // Other errors
          setErrors({ general: data.message || 'Request failed. Please try again.' });
        }
        setIsLoading(false);
        return;
      }

      // Success - show message
      setSuccessMessage(data.message);
      setEmail(''); // Clear form
      setIsLoading(false);

    } catch (error) {
      console.error('Password reset request error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - StreamFlow</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-400">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 placeholder-gray-500 text-white rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="john@example.com"
                  disabled={isLoading || !!successMessage}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email[0]}</p>
                )}
              </div>
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="rounded-md bg-red-900/20 border border-red-800 p-4">
                <p className="text-sm text-red-400">{errors.general}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-md bg-green-900/20 border border-green-800 p-4">
                <p className="text-sm text-green-400">{successMessage}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Check your email for password reset instructions. The link will expire in 24 hours.
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
                {isLoading ? 'Sending...' : successMessage ? 'Email sent' : 'Send reset instructions'}
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

