// src/pages/invoices.tsx
// Server-side redirect to billing invoices
import { GetServerSideProps } from "next";

export default function InvoicesRedirect() {
  // This component will never render due to the redirect
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/billing/invoices",
      permanent: false, // Use 307 temporary redirect
    },
  };
};