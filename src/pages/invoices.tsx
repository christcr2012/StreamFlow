// src/pages/invoices.tsx
// Redirect to the proper billing invoices location
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function InvoicesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the actual invoices page in billing section
    router.replace("/billing/invoices");
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-info)' }}></div>
    </div>
  );
}