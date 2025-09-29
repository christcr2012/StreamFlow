// src/pages/industries/hvac/dashboard.tsx

/**
 * 🌡️ HVAC INDUSTRY DASHBOARD
 * 
 * Industry-specific dashboard for HVAC services with:
 * - Seasonal maintenance tracking
 * - Equipment inventory management
 * - Emergency service dispatch
 * - Energy efficiency reporting
 * - Warranty management
 * - Weather-based scheduling
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppShell from '@/components/AppShell';
import { 
  CogIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ThermometerIcon,
  BoltIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

interface HVACMetric {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
}

interface ServiceCall {
  id: string;
  customer: string;
  address: string;
  type: 'maintenance' | 'repair' | 'emergency' | 'installation';
  equipment: string;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  technician?: string;
  scheduledTime: string;
  estimatedDuration: number;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  cost: number;
  supplier: string;
  lastOrdered: string;
}

export default function HVACDashboard() {
  const router = useRouter();
  const [currentWeather, setCurrentWeather] = useState({ temp: 72, condition: 'Partly Cloudy' });
  const [metrics, setMetrics] = useState<HVACMetric[]>([]);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    // Simulate real-time data
    setMetrics([
      {
        title: 'Today\'s Service Calls',
        value: '12',
        change: '+3',
        changeType: 'positive',
        icon: ClipboardDocumentListIcon,
        color: 'blue'
      },
      {
        title: 'Emergency Calls',
        value: '2',
        change: '-1',
        changeType: 'positive',
        icon: ExclamationTriangleIcon,
        color: 'red'
      },
      {
        title: 'Maintenance Due',
        value: '28',
        change: '+5',
        changeType: 'neutral',
        icon: CalendarIcon,
        color: 'yellow'
      },
      {
        title: 'Energy Efficiency',
        value: '94%',
        change: '+2%',
        changeType: 'positive',
        icon: BoltIcon,
        color: 'green'
      }
    ]);

    setServiceCalls([
      {
        id: '1',
        customer: 'Johnson Residence',
        address: '123 Oak Street',
        type: 'emergency',
        equipment: 'Central AC Unit',
        priority: 'emergency',
        status: 'in-progress',
        technician: 'Mike Rodriguez',
        scheduledTime: '10:30 AM',
        estimatedDuration: 120
      },
      {
        id: '2',
        customer: 'Downtown Office Complex',
        address: '456 Business Ave',
        type: 'maintenance',
        equipment: 'Rooftop HVAC System',
        priority: 'medium',
        status: 'scheduled',
        technician: 'Sarah Chen',
        scheduledTime: '2:00 PM',
        estimatedDuration: 180
      },
      {
        id: '3',
        customer: 'Smith Family',
        address: '789 Maple Drive',
        type: 'repair',
        equipment: 'Heat Pump',
        priority: 'high',
        status: 'scheduled',
        scheduledTime: '4:30 PM',
        estimatedDuration: 90
      }
    ]);

    setLowStockItems([
      {
        id: '1',
        name: 'R-410A Refrigerant',
        category: 'Refrigerants',
        currentStock: 3,
        minStock: 10,
        maxStock: 50,
        cost: 125.00,
        supplier: 'HVAC Supply Co',
        lastOrdered: '2024-01-15'
      },
      {
        id: '2',
        name: '16x25x1 Air Filters',
        category: 'Filters',
        currentStock: 8,
        minStock: 25,
        maxStock: 100,
        cost: 12.50,
        supplier: 'Filter Direct',
        lastOrdered: '2024-01-10'
      }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'emergency': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      case 'in-progress': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'scheduled': return 'text-slate-400 bg-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getMetricColor = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-400 bg-blue-500/20',
      red: 'text-red-400 bg-red-500/20',
      yellow: 'text-yellow-400 bg-yellow-500/20',
      green: 'text-green-400 bg-green-500/20'
    };
    return colorMap[color] || 'text-slate-400 bg-slate-500/20';
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                🌡️ HVAC Dashboard
              </h1>
              <p className="text-slate-400 mt-2">
                Seasonal maintenance, emergency dispatch, and energy efficiency monitoring
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-lg border border-blue-500/20 p-4">
                <div className="flex items-center space-x-3">
                  <ThermometerIcon className="h-6 w-6 text-blue-400" />
                  <div>
                    <div className="text-white font-semibold">{currentWeather.temp}°F</div>
                    <div className="text-xs text-slate-400">{currentWeather.condition}</div>
                  </div>
                </div>
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300">
                Emergency Dispatch
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric, index) => (
              <div key={index} className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getMetricColor(metric.color)}`}>
                    <metric.icon className="h-6 w-6" />
                  </div>
                  <div className={`text-sm font-medium ${
                    metric.changeType === 'positive' ? 'text-green-400' :
                    metric.changeType === 'negative' ? 'text-red-400' : 'text-slate-400'
                  }`}>
                    {metric.change}
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                  <p className="text-sm text-slate-400">{metric.title}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Service Calls and Inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Service Calls */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Today's Service Calls</h2>
                <button className="text-blue-400 hover:text-blue-300 text-sm">View All</button>
              </div>
              <div className="space-y-4">
                {serviceCalls.map((call) => (
                  <div key={call.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-white">{call.customer}</h3>
                        <p className="text-sm text-slate-400">{call.address}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(call.priority)}`}>
                        {call.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-300">
                        <div>{call.equipment}</div>
                        <div className="text-slate-400">{call.technician}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-400">{call.scheduledTime}</div>
                        <div className="text-slate-400">{call.estimatedDuration}min</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Low Stock Alerts</h2>
                <button className="text-blue-400 hover:text-blue-300 text-sm">Manage Inventory</button>
              </div>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-white">{item.name}</h3>
                        <p className="text-sm text-slate-400">{item.category}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                        Low Stock
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-slate-300">
                        <div>Current: {item.currentStock}</div>
                        <div className="text-slate-400">Min: {item.minStock}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400">${item.cost}</div>
                        <button className="text-blue-400 hover:text-blue-300 text-xs">
                          Reorder
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Seasonal Maintenance Schedule */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-blue-500/20 p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Seasonal Maintenance Schedule</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { season: 'Spring', tasks: 'System Tune-ups', count: 45, color: 'green' },
                { season: 'Summer', tasks: 'AC Prep & Cleaning', count: 67, color: 'blue' },
                { season: 'Fall', tasks: 'Heating Inspections', count: 52, color: 'orange' },
                { season: 'Winter', tasks: 'Emergency Services', count: 23, color: 'red' }
              ].map((season) => (
                <div key={season.season} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{season.season}</h3>
                    <span className={`text-2xl font-bold ${
                      season.color === 'green' ? 'text-green-400' :
                      season.color === 'blue' ? 'text-blue-400' :
                      season.color === 'orange' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {season.count}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{season.tasks}</p>
                  <div className="mt-3">
                    <div className={`w-full bg-slate-700 rounded-full h-2`}>
                      <div 
                        className={`h-2 rounded-full ${
                          season.color === 'green' ? 'bg-green-500' :
                          season.color === 'blue' ? 'bg-blue-500' :
                          season.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((season.count / 70) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button 
              onClick={() => router.push('/industries/hvac/emergency')}
              className="bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-2xl p-6 text-left hover:from-red-500/30 hover:to-red-600/30 transition-all duration-300 group"
            >
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Emergency Dispatch</h3>
              <p className="text-slate-400 text-sm">24/7 emergency service management</p>
            </button>

            <button 
              onClick={() => router.push('/industries/hvac/maintenance')}
              className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-2xl p-6 text-left hover:from-blue-500/30 hover:to-blue-600/30 transition-all duration-300 group"
            >
              <CalendarIcon className="h-8 w-8 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Maintenance Scheduler</h3>
              <p className="text-slate-400 text-sm">Seasonal and preventive maintenance</p>
            </button>

            <button 
              onClick={() => router.push('/industries/hvac/inventory')}
              className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-2xl p-6 text-left hover:from-green-500/30 hover:to-green-600/30 transition-all duration-300 group"
            >
              <CogIcon className="h-8 w-8 text-green-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-white font-semibold mb-2">Parts & Inventory</h3>
              <p className="text-slate-400 text-sm">Equipment and parts management</p>
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
