// src/pages/worker/payroll.tsx
import { useMe } from "@/lib/useMe";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

interface PayStub {
  id: string;
  payPeriod: string;
  payDate: Date;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  grossPay: number;
  netPay: number;
  deductions: {
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    insurance?: number;
    retirement?: number;
  };
}

interface PayrollSummary {
  ytdGross: number;
  ytdNet: number;
  ytdHours: number;
  currentPeriodHours: number;
}

/**
 * Employee Payroll Portal
 * Mobile-first PWA design for field workers
 * Features: Pay stubs, YTD summary, direct deposit info, tax documents
 */
export default function WorkerPayroll() {
  const { me, loading, error } = useMe();
  const router = useRouter();
  const [payStubs, setPayStubs] = useState<PayStub[]>([]);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [loadingPayroll, setLoadingPayroll] = useState(true);

  // Redirect non-STAFF users
  useEffect(() => {
    if (!loading && me && me.role !== "STAFF") {
      router.push("/dashboard");
    }
  }, [me, loading, router]);

  // TODO: Load payroll data from API
  useEffect(() => {
    if (me && me.role === "STAFF") {
      loadPayrollData();
    }
  }, [me]);

  const loadPayrollData = async () => {
    try {
      // Mock data for now - will integrate with actual API later
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockPayStubs: PayStub[] = [
        {
          id: '1',
          payPeriod: 'Dec 16 - Dec 31, 2024',
          payDate: new Date('2025-01-05'),
          hoursWorked: 80,
          regularHours: 80,
          overtimeHours: 0,
          grossPay: 1600,
          netPay: 1200,
          deductions: {
            federalTax: 240,
            stateTax: 80,
            socialSecurity: 60,
            medicare: 20,
            insurance: 100,
            retirement: 80
          }
        },
        {
          id: '2',
          payPeriod: 'Dec 1 - Dec 15, 2024',
          payDate: new Date('2024-12-20'),
          hoursWorked: 84,
          regularHours: 80,
          overtimeHours: 4,
          grossPay: 1720,
          netPay: 1290,
          deductions: {
            federalTax: 258,
            stateTax: 86,
            socialSecurity: 64,
            medicare: 22,
            insurance: 100,
            retirement: 86
          }
        },
        {
          id: '3',
          payPeriod: 'Nov 16 - Nov 30, 2024',
          payDate: new Date('2024-12-05'),
          hoursWorked: 76,
          regularHours: 76,
          overtimeHours: 0,
          grossPay: 1520,
          netPay: 1140,
          deductions: {
            federalTax: 228,
            stateTax: 76,
            socialSecurity: 57,
            medicare: 19,
            insurance: 100,
            retirement: 76
          }
        }
      ];
      
      const mockSummary: PayrollSummary = {
        ytdGross: 45600,
        ytdNet: 34200,
        ytdHours: 1920,
        currentPeriodHours: 32.5
      };
      
      setPayStubs(mockPayStubs);
      setSummary(mockSummary);
    } catch (error) {
      console.error('Failed to load payroll data:', error);
    } finally {
      setLoadingPayroll(false);
    }
  };

  if (loading || loadingPayroll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !me || me.role !== "STAFF") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">Employee access required</p>
          <Link href="/login" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">Payroll</h1>
          <p className="text-green-100 text-sm">
            View pay stubs and tax information
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="max-w-md mx-auto">
          
          {/* YTD Summary */}
          {summary && (
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <h3 className="font-semibold mb-4">2024 Year-to-Date Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Gross Pay</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${summary.ytdGross.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Net Pay</div>
                  <div className="text-2xl font-bold text-blue-600">
                    ${summary.ytdNet.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Total Hours</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {summary.ytdHours.toLocaleString()}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Current Period</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {summary.currentPeriodHours}h
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Pay Stubs */}
          <div className="mb-6">
            <h3 className="font-semibold mb-4">Recent Pay Stubs</h3>
            <div className="space-y-4">
              {payStubs.map((stub) => (
                <div key={stub.id} className="bg-white rounded-lg shadow-lg p-4">
                  {/* Pay Stub Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{stub.payPeriod}</h4>
                      <p className="text-sm text-gray-600">
                        Paid: {stub.payDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ${stub.netPay.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Net Pay
                      </div>
                    </div>
                  </div>

                  {/* Hours Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-3 text-center">
                    <div>
                      <div className="text-sm text-gray-600">Total Hours</div>
                      <div className="font-semibold">{stub.hoursWorked}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Regular</div>
                      <div className="font-semibold">{stub.regularHours}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Overtime</div>
                      <div className="font-semibold text-orange-600">{stub.overtimeHours}</div>
                    </div>
                  </div>

                  {/* Pay Breakdown */}
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Gross Pay</span>
                      <span className="font-semibold">${stub.grossPay.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Federal Tax</span>
                        <span>-${stub.deductions.federalTax}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>State Tax</span>
                        <span>-${stub.deductions.stateTax}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Social Security</span>
                        <span>-${stub.deductions.socialSecurity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medicare</span>
                        <span>-${stub.deductions.medicare}</span>
                      </div>
                      {stub.deductions.insurance && (
                        <div className="flex justify-between">
                          <span>Health Insurance</span>
                          <span>-${stub.deductions.insurance}</span>
                        </div>
                      )}
                      {stub.deductions.retirement && (
                        <div className="flex justify-between">
                          <span>401(k)</span>
                          <span>-${stub.deductions.retirement}</span>
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                      <span>Net Pay</span>
                      <span className="text-green-600">${stub.netPay.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium transition-colors">
                    📄 Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Documents */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Tax Documents</h3>
            <div className="space-y-3">
              <button className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700 py-3 px-4 rounded font-medium transition-colors text-left">
                📄 2024 W-2 Form (Available Jan 31)
              </button>
              <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 px-4 rounded font-medium transition-colors text-left">
                📄 2023 W-2 Form
              </button>
            </div>
          </div>

          {/* Direct Deposit Info */}
          <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Direct Deposit</h3>
            <div className="text-sm text-gray-600">
              <p className="mb-2">Bank: Wells Fargo</p>
              <p className="mb-2">Account: ****1234</p>
              <p className="text-green-600">✅ Active</p>
            </div>
            <button className="mt-3 text-blue-500 underline text-sm">
              Update Banking Information
            </button>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <Link href="/worker/home" className="text-blue-500 underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}