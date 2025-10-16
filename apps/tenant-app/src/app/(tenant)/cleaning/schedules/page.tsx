/**
 * Cleaning Schedules Page
 * 
 * Drag-and-drop scheduling board for work orders
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CleaningWorkOrder {
  id: string;
  publicId: string;
  contractId?: string;
  siteAddress: string;
  spaceType: string;
  squareFeet: number;
  scheduledDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  assignedTo?: string;
  status: string;
}

interface DaySchedule {
  date: string;
  workOrders: CleaningWorkOrder[];
}

export default function CleaningSchedulesPage() {
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchSchedules();
  }, [viewMode]);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/cleaning/work-orders?status=SCHEDULED');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      
      const data = await response.json();
      const workOrders: CleaningWorkOrder[] = data.workOrders || [];
      
      // Group by date
      const grouped = workOrders.reduce((acc, wo) => {
        const date = new Date(wo.scheduledDate).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(wo);
        return acc;
      }, {} as Record<string, CleaningWorkOrder[]>);
      
      // Convert to array and sort
      const scheduleArray = Object.entries(grouped)
        .map(([date, workOrders]) => ({ date, workOrders }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      setSchedules(scheduleArray);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SCHEDULED: 'bg-blue-100 border-blue-300',
      IN_PROGRESS: 'bg-yellow-100 border-yellow-300',
      COMPLETED: 'bg-green-100 border-green-300',
      CANCELLED: 'bg-red-100 border-red-300'
    };
    return colors[status] || 'bg-gray-100 border-gray-300';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading schedules...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Work Order Schedule</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="space-y-6">
        {schedules.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center text-gray-500">
            No scheduled work orders found. Work orders will appear here once contracts are created and schedules are expanded.
          </div>
        ) : (
          schedules.map((daySchedule) => (
            <div key={daySchedule.date} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h2 className="text-lg font-semibold">
                  {new Date(daySchedule.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h2>
                <div className="text-sm text-gray-600">
                  {daySchedule.workOrders.length} work order{daySchedule.workOrders.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {daySchedule.workOrders.map((wo) => (
                    <div
                      key={wo.id}
                      className={`p-4 rounded-lg border-2 ${getStatusColor(wo.status)} cursor-move hover:shadow-lg transition-shadow`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('workOrderId', wo.id);
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-sm">{wo.publicId}</div>
                        <div className="text-xs px-2 py-1 bg-white rounded">
                          {wo.status}
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">
                        <div className="font-medium">{wo.siteAddress}</div>
                        <div className="text-gray-600 capitalize">
                          {wo.spaceType.replace('-', ' ')} • {wo.squareFeet.toLocaleString()} sq ft
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-3">
                        {formatTime(wo.scheduledStart)} - {formatTime(wo.scheduledEnd)}
                      </div>
                      
                      {wo.assignedTo && (
                        <div className="text-xs bg-white px-2 py-1 rounded mb-2">
                          👤 {wo.assignedTo}
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-3">
                        <Link
                          href={`/cleaning/work-orders/${wo.id}`}
                          className="flex-1 text-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                        >
                          View
                        </Link>
                        {wo.status === 'SCHEDULED' && (
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/cleaning/work-orders/${wo.id}/status`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'IN_PROGRESS' })
                                });
                                if (response.ok) {
                                  fetchSchedules();
                                }
                              } catch (error) {
                                console.error('Error starting work order:', error);
                              }
                            }}
                            className="flex-1 text-center px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-3">Status Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
            <span className="text-sm">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
            <span className="text-sm">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-sm">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
            <span className="text-sm">Cancelled</span>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          💡 Tip: Drag and drop work orders to reschedule (coming soon)
        </div>
      </div>
    </div>
  );
}

