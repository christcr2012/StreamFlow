// src/pages/leads/[id].tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import RFPUpload from '@/components/RFPUpload';
import ParsedRFPDisplay from '@/components/ParsedRFPDisplay';

type Lead = {
  id: string;
  publicId: string | null;
  sourceType: string | null;
  sourceDetail?: string | null;
  company: string | null;
  contactName: string | null;
  email: string | null;
  phoneE164: string | null;
  serviceCode: string | null;
  postalCode: string | null;
  zip: string | null;
  aiScore: number | null;
  systemGenerated?: boolean | null;
  convertedAt?: string | null;
  status: string | null;
  createdAt: string | null;
  notes?: string | null;
  enrichmentJson?: Record<string, unknown> | null;
};

type ParsedRFP = {
  scope: string;
  dueDate: string | null;
  walkthrough: string | null;
  insurance: string | null;
  bond: string | null;
  checklist: string[];
  summary: string;
  talkingPoints: string[];
};

type Activity = {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type Task = {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  assignee: {
    id: string;
    name: string;
    email: string;
  };
  creator: {
    id: string;
    name: string;
    email: string;
  };
};

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parsedRFP, setParsedRFP] = useState<(ParsedRFP & { originalText: string; filename: string }) | null>(null);
  
  // CRM State
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [submittingTask, setSubmittingTask] = useState(false);
  
  const [activityForm, setActivityForm] = useState({
    type: '',
    title: '',
    description: ''
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    reminderAt: ''
  });

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    async function fetchLead() {
      try {
        setLoading(true);
        const response = await fetch(`/api/leads/${id}`);
        
        if (!response.ok) {
          throw new Error('Lead not found');
        }

        const data = await response.json();
        if (!data.ok) {
          throw new Error(data.error || 'Failed to fetch lead');
        }

        setLead(data.lead);
        
        // Check if lead already has RFP analysis
        const enrichment = data.lead.enrichmentJson as any;
        if (enrichment?.rfpAnalysis) {
          setParsedRFP(enrichment.rfpAnalysis);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLead();
  }, [id]);

  // Fetch activities and tasks when lead is loaded
  useEffect(() => {
    if (!lead?.id) return;

    const fetchActivitiesAndTasks = async () => {
      try {
        const [activitiesResponse, tasksResponse] = await Promise.all([
          fetch(`/api/leads/${id}/activities`),
          fetch(`/api/leads/${id}/tasks`)
        ]);

        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          if (activitiesData.ok) {
            setActivities(activitiesData.activities);
          }
        }

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          if (tasksData.ok) {
            setTasks(tasksData.tasks);
          }
        }
      } catch (error) {
        console.error('Error fetching activities and tasks:', error);
      }
    };

    fetchActivitiesAndTasks();
  }, [lead?.id, id]);

  // Activity form handlers
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.type || !activityForm.title) return;

    setSubmittingActivity(true);
    try {
      const response = await fetch(`/api/leads/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          setActivities(prev => [result.activity, ...prev]);
          setActivityForm({ type: '', title: '', description: '' });
          setShowActivityForm(false);
        }
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Task form handlers
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;

    setSubmittingTask(true);
    try {
      const response = await fetch(`/api/leads/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          setTasks(prev => [result.task, ...prev]);
          setTaskForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '', reminderAt: '' });
          setShowTaskForm(false);
        }
      }
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setSubmittingTask(false);
    }
  };

  // Utility functions
  const getActivityTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'CALL_OUTBOUND': 'var(--accent-info)',
      'CALL_INBOUND': 'var(--accent-success)',
      'EMAIL_SENT': 'var(--brand-primary)',
      'EMAIL_RECEIVED': 'var(--accent-warning)',
      'MEETING_SCHEDULED': 'var(--accent-info)',
      'MEETING_COMPLETED': 'var(--accent-success)',
      'PROPOSAL_SENT': 'var(--brand-primary)',
      'FOLLOW_UP': 'var(--accent-warning)',
      'NOTE': 'var(--text-tertiary)'
    };
    return colors[type] || 'var(--text-tertiary)';
  };

  const formatActivityType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'LOW': 'var(--accent-success)',
      'MEDIUM': 'var(--accent-warning)',
      'HIGH': 'var(--accent-error)',
      'URGENT': 'var(--accent-error)'
    };
    return colors[priority] || 'var(--text-tertiary)';
  };

  const getTaskStatusClass = (status: string) => {
    const classes: { [key: string]: string } = {
      'PENDING': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'OVERDUE': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  // Lead status change handler
  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;

    try {
      const response = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          // Update lead status in state
          setLead(prev => prev ? { ...prev, status: result.lead.status, convertedAt: result.lead.convertedAt } : null);
          
          // Refresh activities to show the status change activity
          const activitiesResponse = await fetch(`/api/leads/${id}/activities`);
          if (activitiesResponse.ok) {
            const activitiesData = await activitiesResponse.json();
            if (activitiesData.ok) {
              setActivities(activitiesData.activities);
            }
          }
        }
      } else {
        const errorData = await response.json();
        console.error('Error updating status:', errorData.error);
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'NEW': 'var(--text-tertiary)',
      'CONTACTED': 'var(--accent-info)',
      'QUALIFIED': 'var(--accent-warning)',
      'MEETING_SCHEDULED': 'var(--accent-info)',
      'PROPOSAL_SENT': 'var(--brand-primary)',
      'NEGOTIATION': 'var(--accent-warning)',
      'WON': 'var(--accent-success)',
      'CONVERTED': 'var(--accent-success)',
      'LOST': 'var(--accent-error)',
      'NURTURING': 'var(--accent-warning)',
      'FOLLOW_UP': 'var(--accent-info)',
      'ON_HOLD': 'var(--text-tertiary)',
      'UNRESPONSIVE': 'var(--accent-error)'
    };
    return colors[status] || 'var(--text-tertiary)';
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleRFPParsed = (data: ParsedRFP & { originalText: string; filename: string }) => {
    setParsedRFP(data);
  };

  const handleSaveRFP = async () => {
    if (!parsedRFP || !lead) return;

    try {
      const response = await fetch('/api/rfp/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          parsedData: parsedRFP
        })
      });

      const result = await response.json();
      if (!result.ok) {
        throw new Error(result.error);
      }

      // Refresh lead data
      router.reload();
      
    } catch (err: any) {
      alert('Failed to save RFP analysis: ' + err.message);
    }
  };

  const isRFPLead = lead?.sourceType === 'RFP' || lead?.systemGenerated;
  const hasExistingRFP = lead?.enrichmentJson && (lead.enrichmentJson as any)?.rfpAnalysis;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Lead Not Found
          </h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            {error || 'The requested lead could not be found.'}
          </p>
          <Link href="/leads" className="btn-primary">
            <span>← Back to Leads</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Lead {lead.publicId || lead.id.slice(0, 8)} • Mountain Vista</title>
      </Head>
      
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/leads" className="text-sm" style={{ color: 'var(--brand-primary)' }}>
                ← Back to Leads
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gradient">
              {lead.company || 'Unnamed Lead'}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {lead.publicId || `ID: ${lead.id.slice(0, 8)}`} • 
              {lead.sourceType === 'RFP' ? ' RFP Lead' : ' Manual Lead'} • 
              Score: {lead.aiScore || 'N/A'}
            </p>
          </div>
          
          <div className="flex gap-4">
            <button className="btn-secondary">
              <span>📝 Edit Lead</span>
            </button>
            <button 
              className="btn-primary"
              onClick={() => handleStatusChange('CONVERTED')}
              disabled={lead.status === 'CONVERTED' || lead.status === 'WON'}
            >
              <span>✅ Mark Converted</span>
            </button>
          </div>
        </div>

        {/* Lead Information */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Lead Information</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Contact details and lead metadata
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Contact Name
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.contactName || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.email || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Phone
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.phoneE164 || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Service Code
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.serviceCode || 'Not specified'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Location
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.postalCode || lead.zip || 'Not provided'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Status
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ background: getStatusColor(lead.status || 'NEW') }}
                  ></div>
                  <span className="text-sm font-medium">
                    {formatStatus(lead.status || 'NEW')}
                  </span>
                </div>
                <select
                  value={lead.status || 'NEW'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs px-2 py-1 rounded border"
                  style={{ 
                    background: 'var(--surface-2)', 
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                  <option value="PROPOSAL_SENT">Proposal Sent</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="WON">Won</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="LOST">Lost</option>
                  <option value="NURTURING">Nurturing</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="UNRESPONSIVE">Unresponsive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Created
              </label>
              <p className="text-sm p-2 rounded" style={{ background: 'var(--surface-1)' }}>
                {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>

          {lead.notes && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Notes
              </label>
              <p className="text-sm p-3 rounded" style={{ 
                background: 'var(--surface-2)', 
                border: '1px solid var(--border-primary)' 
              }}>
                {lead.notes}
              </p>
            </div>
          )}
        </div>

        {/* Communication & Task Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activities Timeline */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{ background: 'var(--accent-info)' }}></div>
                <div>
                  <h3 className="text-xl font-semibold text-gradient">Activity Timeline</h3>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Communication history and interactions
                  </p>
                </div>
              </div>
              <button 
                className="btn-primary text-sm px-4 py-2"
                onClick={() => setShowActivityForm(!showActivityForm)}
              >
                + Add Activity
              </button>
            </div>

            {/* Activity Form */}
            {showActivityForm && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
                <form onSubmit={handleAddActivity}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Activity Type
                      </label>
                      <select
                        value={activityForm.type}
                        onChange={(e) => setActivityForm({...activityForm, type: e.target.value})}
                        className="w-full p-2 rounded text-sm"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                        required
                      >
                        <option value="">Select type...</option>
                        <option value="CALL_OUTBOUND">Outbound Call</option>
                        <option value="CALL_INBOUND">Inbound Call</option>
                        <option value="EMAIL_SENT">Email Sent</option>
                        <option value="EMAIL_RECEIVED">Email Received</option>
                        <option value="MEETING_SCHEDULED">Meeting Scheduled</option>
                        <option value="MEETING_COMPLETED">Meeting Completed</option>
                        <option value="PROPOSAL_SENT">Proposal Sent</option>
                        <option value="FOLLOW_UP">Follow-up</option>
                        <option value="NOTE">Note</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Title
                      </label>
                      <input
                        type="text"
                        value={activityForm.title}
                        onChange={(e) => setActivityForm({...activityForm, title: e.target.value})}
                        className="w-full p-2 rounded text-sm"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                        placeholder="Brief description..."
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Description
                    </label>
                    <textarea
                      value={activityForm.description}
                      onChange={(e) => setActivityForm({...activityForm, description: e.target.value})}
                      className="w-full p-2 rounded text-sm h-20"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                      placeholder="Detailed notes..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowActivityForm(false)}
                      className="px-4 py-2 text-sm rounded"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary text-sm px-4 py-2" disabled={submittingActivity}>
                      {submittingActivity ? 'Adding...' : 'Add Activity'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Activities List */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  <p>No activities recorded yet</p>
                  <p className="text-xs mt-1">Add your first communication or interaction above</p>
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-3 rounded" style={{ background: 'var(--surface-1)' }}>
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ 
                      background: getActivityTypeColor(activity.type) 
                    }}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                        {formatActivityType(activity.type)} • {activity.user.name}
                      </p>
                      {activity.description && (
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {activity.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tasks & Follow-ups */}
          <div className="premium-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 rounded-full" style={{ background: 'var(--accent-warning)' }}></div>
                <div>
                  <h3 className="text-xl font-semibold text-gradient">Tasks & Follow-ups</h3>
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    Scheduled actions and reminders
                  </p>
                </div>
              </div>
              <button 
                className="btn-primary text-sm px-4 py-2"
                onClick={() => setShowTaskForm(!showTaskForm)}
              >
                + Add Task
              </button>
            </div>

            {/* Task Form */}
            {showTaskForm && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--surface-1)', border: '1px solid var(--border-primary)' }}>
                <form onSubmit={handleAddTask}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                        className="w-full p-2 rounded text-sm"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                        placeholder="Follow up on proposal..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Priority
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                        className="w-full p-2 rounded text-sm"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Due Date
                      </label>
                      <input
                        type="datetime-local"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                        className="w-full p-2 rounded text-sm"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        Reminder
                      </label>
                      <input
                        type="datetime-local"
                        value={taskForm.reminderAt}
                        onChange={(e) => setTaskForm({...taskForm, reminderAt: e.target.value})}
                        className="w-full p-2 rounded text-sm"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                      Description
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                      className="w-full p-2 rounded text-sm h-20"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                      placeholder="Task details..."
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowTaskForm(false)}
                      className="px-4 py-2 text-sm rounded"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary text-sm px-4 py-2" disabled={submittingTask}>
                      {submittingTask ? 'Adding...' : 'Add Task'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tasks List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
                  <p>No tasks scheduled yet</p>
                  <p className="text-xs mt-1">Create your first task or reminder above</p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-3 rounded" style={{ 
                    background: task.status === 'COMPLETED' ? 'var(--surface-1)' : 'var(--surface-2)',
                    border: '1px solid var(--border-primary)',
                    opacity: task.status === 'COMPLETED' ? 0.7 : 1
                  }}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ 
                          background: getPriorityColor(task.priority) 
                        }}></span>
                        {task.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded ${getTaskStatusClass(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                    {task.dueDate && (
                      <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()} at {new Date(task.dueDate).toLocaleTimeString()}
                      </p>
                    )}
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Assigned to: {task.assignee.name}
                    </p>
                    {task.description && (
                      <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
                        {task.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RFP Processing Section - Only show for RFP leads */}
        {isRFPLead && (
          <>
            {!hasExistingRFP && !parsedRFP && (
              <RFPUpload leadId={lead.id} onParsed={handleRFPParsed} />
            )}
            
            {parsedRFP && (
              <ParsedRFPDisplay 
                data={parsedRFP} 
                onSave={!hasExistingRFP ? handleSaveRFP : undefined}
              />
            )}
            
            {hasExistingRFP && !parsedRFP && (
              <div className="premium-card">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 rounded-full" style={{ background: 'var(--accent-success)' }}></div>
                  <div>
                    <h3 className="text-xl font-semibold text-gradient">RFP Analysis Completed</h3>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      This lead already has RFP analysis attached. Refresh the page to view it.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Non-RFP Lead Message */}
        {!isRFPLead && (
          <div className="premium-card">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full" style={{ background: 'var(--text-tertiary)' }}></div>
              <div>
                <h3 className="text-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  RFP Processing Not Available
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  RFP document parsing is only available for leads sourced from government RFPs and solicitations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}