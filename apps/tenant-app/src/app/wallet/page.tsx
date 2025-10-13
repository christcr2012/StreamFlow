import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

async function getWalletData(orgId: string) {
  const transactions = await prisma.billingLedger.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const balance = transactions.reduce((sum, tx) => {
    return tx.type === 'PACK_PURCHASE'
      ? sum + Number(tx.amount)
      : sum - Number(tx.amount);
  }, 0);

  return { transactions, balance };
}

export default async function WalletPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  const { transactions, balance } = await getWalletData(authContext.orgId);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600 mt-1">View your transaction history and balance</p>
        </div>

        <Card>
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-gray-500 uppercase">Current Balance</p>
            <p className="text-5xl font-bold text-gray-900 mt-2">
              ${balance.toFixed(2)}
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Transaction History" />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                      No transactions yet
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={tx.type === 'PACK_PURCHASE' ? 'success' : 'warning'}>
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tx.type === 'PACK_PURCHASE' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

