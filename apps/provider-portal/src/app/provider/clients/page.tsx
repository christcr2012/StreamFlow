'use client';

import { useState, useEffect, useCallback } from 'react';
import ClientListTable from './ClientListTable';
import ClientDetailsModal from './ClientDetailsModal';
import ClientFilters from './ClientFilters';
import FederatedClientsSection from './FederatedClientsSection';

export default function ProviderClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [activeTab, setActiveTab] = useState<'clients' | 'federation'>('clients');

  // CODE QUALITY: Fixed useEffect dependency - wrapped fetchClients in useCallback
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(status && { status }),
        sortBy,
        sortOrder
      });

      const res = await fetch(`/api/provider/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.items || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, sortBy, sortOrder]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleRefresh = () => {
    fetchClients();
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--brand-gradient)' }}>
          Client Management
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          View and manage all client tenants, organizations, and federated clients
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={() => setActiveTab('clients')}
          className="px-4 py-2 font-medium transition-all"
          style={{
            color: activeTab === 'clients' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'clients' ? '2px solid var(--brand-primary)' : '2px solid transparent',
          }}
        >
          Tenant Clients
        </button>
        <button
          onClick={() => setActiveTab('federation')}
          className="px-4 py-2 font-medium transition-all"
          style={{
            color: activeTab === 'federation' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'federation' ? '2px solid var(--brand-primary)' : '2px solid transparent',
          }}
        >
          Federated Clients
        </button>
      </div>

      {activeTab === 'clients' ? (
        <>
          <ClientFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onRefresh={handleRefresh}
      />

      <ClientListTable
        clients={clients}
        loading={loading}
        page={page}
        limit={limit}
        total={total}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
        onViewDetails={setSelectedClient}
        onRefresh={handleRefresh}
      />

      {selectedClient && (
        <ClientDetailsModal
          clientId={selectedClient}
          onClose={() => setSelectedClient(null)}
          onRefresh={handleRefresh}
        />
      )}
        </>
      ) : (
        <FederatedClientsSection />
      )}
    </div>
  );
}

