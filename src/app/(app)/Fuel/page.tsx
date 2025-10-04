'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function FuelPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // TODO: Fetch data for Fuel
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Fuel</h1>
      
      {/* TODO: Implement UI for Fuel */}
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-muted-foreground">
          This page is under construction. Implement the UI based on the binder specification.
        </p>
      </div>
    </div>
  );
}
