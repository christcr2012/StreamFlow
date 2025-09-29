// src/pages/business/budgeting.tsx

/**
 * 💰 YNAB-STYLE BUDGETING SYSTEM
 * 
 * Zero-based budgeting system inspired by YNAB (You Need A Budget).
 * Every dollar has a job and helps businesses manage cash flow effectively.
 * 
 * FEATURES:
 * - Zero-based budgeting methodology
 * - Category-based budget allocation
 * - Real-time spending tracking
 * - Cash flow forecasting
 * - Goal-based savings
 * - Debt management
 * - Business expense categorization
 * - Monthly budget reviews
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '@/components/AppShell';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  PlusIcon,
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  TruckIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  available: number;
  type: 'income' | 'expense' | 'savings' | 'debt';
  icon: React.ComponentType<any>;
  color: string;
  subcategories?: BudgetCategory[];
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  account: string;
}

export default function YNABBudgeting() {
  const router = useRouter();
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [totalToBudget, setTotalToBudget] = useState(0);
  const [totalBudgeted, setTotalBudgeted] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);

  useEffect(() => {
    // Initialize budget categories
    setBudgetCategories([
      {
        id: 'income',
        name: 'Income',
        budgeted: 50000,
        spent: 47250,
        available: 2750,
        type: 'income',
        icon: CurrencyDollarIcon,
        color: 'green',
        subcategories: [
          {
            id: 'service-revenue',
            name: 'Service Revenue',
            budgeted: 40000,
            spent: 38500,
            available: 1500,
            type: 'income',
            icon: WrenchScrewdriverIcon,
            color: 'green'
          },
          {
            id: 'maintenance-contracts',
            name: 'Maintenance Contracts',
            budgeted: 10000,
            spent: 8750,
            available: 1250,
            type: 'income',
            icon: BuildingOfficeIcon,
            color: 'green'
          }
        ]
      },
      {
        id: 'operating-expenses',
        name: 'Operating Expenses',
        budgeted: 25000,
        spent: 22800,
        available: 2200,
        type: 'expense',
        icon: CogIcon,
        color: 'red',
        subcategories: [
          {
            id: 'payroll',
            name: 'Payroll & Benefits',
            budgeted: 15000,
            spent: 14500,
            available: 500,
            type: 'expense',
            icon: CurrencyDollarIcon,
            color: 'red'
          },
          {
            id: 'vehicle-expenses',
            name: 'Vehicle & Fuel',
            budgeted: 3500,
            spent: 3200,
            available: 300,
            type: 'expense',
            icon: TruckIcon,
            color: 'red'
          },
          {
            id: 'materials',
            name: 'Materials & Supplies',
            budgeted: 4000,
            spent: 3800,
            available: 200,
            type: 'expense',
            icon: WrenchScrewdriverIcon,
            color: 'red'
          },
          {
            id: 'office-rent',
            name: 'Office & Utilities',
            budgeted: 2500,
            spent: 1300,
            available: 1200,
            type: 'expense',
            icon: BuildingOfficeIcon,
            color: 'red'
          }
        ]
      },
      {
        id: 'business-savings',
        name: 'Business Savings',
        budgeted: 8000,
        spent: 0,
        available: 8000,
        type: 'savings',
        icon: BanknotesIcon,
        color: 'blue',
        subcategories: [
          {
            id: 'emergency-fund',
            name: 'Emergency Fund',
            budgeted: 5000,
            spent: 0,
            available: 5000,
            type: 'savings',
            icon: ExclamationTriangleIcon,
            color: 'blue'
          },
          {
            id: 'equipment-replacement',
            name: 'Equipment Replacement',
            budgeted: 3000,
            spent: 0,
            available: 3000,
            type: 'savings',
            icon: WrenchScrewdriverIcon,
            color: 'blue'
          }
        ]
      },
      {
        id: 'debt-payments',
        name: 'Debt Payments',
        budgeted: 3500,
        spent: 3500,
        available: 0,
        type: 'debt',
        icon: CreditCardIcon,
        color: 'orange',
        subcategories: [
          {
            id: 'equipment-loan',
            name: 'Equipment Loan',
            budgeted: 2000,
            spent: 2000,
            available: 0,
            type: 'debt',
            icon: WrenchScrewdriverIcon,
            color: 'orange'
          },
          {
            id: 'business-credit',
            name: 'Business Credit Card',
            budgeted: 1500,
            spent: 1500,
            available: 0,
            type: 'debt',
            icon: CreditCardIcon,
            color: 'orange'
          }
        ]
      }
    ]);

    setRecentTransactions([
      {
        id: '1',
        date: '2024-01-22',
        description: 'Johnson Residence - HVAC Service',
        amount: 450,
        category: 'Service Revenue',
        type: 'income',
        account: 'Business Checking'
      },
      {
        id: '2',
        date: '2024-01-22',
        description: 'Fuel - Service Vehicles',
        amount: -85,
        category: 'Vehicle & Fuel',
        type: 'expense',
        account: 'Business Credit Card'
      },
      {
        id: '3',
        date: '2024-01-21',
        description: 'HVAC Parts - Supplier',
        amount: -320,
        category: 'Materials & Supplies',
        type: 'expense',
        account: 'Business Checking'
      },
      {
        id: '4',
        date: '2024-01-21',
        description: 'Downtown Office - Monthly Contract',
        amount: 1200,
        category: 'Maintenance Contracts',
        type: 'income',
        account: 'Business Checking'
      }
    ]);

    // Calculate totals
    setTotalToBudget(47250); // Available income
    setTotalBudgeted(36500); // Total allocated
  }, []);

  const getCategoryColor = (color: string, type: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap: Record<string, Record<string, string>> = {
      green: {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        border: 'border-green-500/30'
      },
      red: {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30'
      },
      blue: {
        bg: 'bg-blue-500/20',
        text: 'text-blue-400',
        border: 'border-blue-500/30'
      },
      orange: {
        bg: 'bg-orange-500/20',
        text: 'text-orange-400',
        border: 'border-orange-500/30'
      }
    };
    return colorMap[color]?.[type] || 'bg-slate-500/20';
  };

  const getAvailableColor = (available: number) => {
    if (available > 0) return 'text-green-400';
    if (available < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getProgressPercentage = (spent: number, budgeted: number) => {
    if (budgeted === 0) return 0;
    return Math.min((Math.abs(spent) / budgeted) * 100, 100);
  };

  const allocateFunds = (categoryId: string, amount: number) => {
    setBudgetCategories(categories =>
      categories.map(category => {
        if (category.id === categoryId) {
          const newBudgeted = category.budgeted + amount;
          const newAvailable = newBudgeted - category.spent;
          return { ...category, budgeted: newBudgeted, available: newAvailable };
        }
        return category;
      })
    );
    setTotalBudgeted(prev => prev + amount);
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                💰 Business Budgeting
              </h1>
              <p className="text-slate-400 mt-2">
                YNAB-style zero-based budgeting for your business
              </p>
            </div>
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
            >
              Add Category
            </button>
          </div>

          {/* Budget Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">To Be Budgeted</h3>
                <BanknotesIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">
                {formatCurrency(totalToBudget - totalBudgeted)}
              </div>
              <p className="text-slate-400 text-sm">Available to allocate</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Total Budgeted</h3>
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {formatCurrency(totalBudgeted)}
              </div>
              <p className="text-slate-400 text-sm">Allocated this month</p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Total Income</h3>
                <CurrencyDollarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {formatCurrency(totalToBudget)}
              </div>
              <p className="text-slate-400 text-sm">This month's income</p>
            </div>
          </div>

          {/* Budget Categories */}
          <div className="space-y-6">
            {budgetCategories.map((category) => (
              <div key={category.id} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-lg ${getCategoryColor(category.color)}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                      <p className="text-slate-400 text-sm">
                        {category.subcategories?.length || 0} subcategories
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getAvailableColor(category.available)}`}>
                      {formatCurrency(category.available)}
                    </div>
                    <p className="text-slate-400 text-sm">Available</p>
                  </div>
                </div>

                {/* Category Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-400">
                      {formatCurrency(category.budgeted)}
                    </div>
                    <div className="text-slate-400 text-sm">Budgeted</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-400">
                      {formatCurrency(Math.abs(category.spent))}
                    </div>
                    <div className="text-slate-400 text-sm">
                      {category.type === 'income' ? 'Received' : 'Spent'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${getAvailableColor(category.available)}`}>
                      {formatCurrency(category.available)}
                    </div>
                    <div className="text-slate-400 text-sm">Available</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-slate-800 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        category.type === 'income' ? 'bg-green-500' :
                        category.available < 0 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${getProgressPercentage(category.spent, category.budgeted)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0%</span>
                    <span>{getProgressPercentage(category.spent, category.budgeted).toFixed(1)}%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Subcategories */}
                {category.subcategories && (
                  <div className="space-y-3">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <subcategory.icon className={`h-5 w-5 ${getCategoryColor(subcategory.color, 'text')}`} />
                            <div>
                              <h4 className="font-medium text-white">{subcategory.name}</h4>
                              <div className="flex space-x-4 text-sm text-slate-400">
                                <span>Budgeted: {formatCurrency(subcategory.budgeted)}</span>
                                <span>
                                  {subcategory.type === 'income' ? 'Received' : 'Spent'}: {formatCurrency(Math.abs(subcategory.spent))}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${getAvailableColor(subcategory.available)}`}>
                              {formatCurrency(subcategory.available)}
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={() => allocateFunds(subcategory.id, 100)}
                                className="p-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => allocateFunds(subcategory.id, -100)}
                                className="p-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Recent Transactions */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Transactions</h2>
              <button className="text-green-400 hover:text-green-300 text-sm">
                View All
              </button>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-600">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-white">{transaction.description}</h4>
                      <div className="flex space-x-4 text-sm text-slate-400">
                        <span>{transaction.date}</span>
                        <span>{transaction.category}</span>
                        <span>{transaction.account}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
