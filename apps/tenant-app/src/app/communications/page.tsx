// apps/tenant-app/src/app/communications/page.tsx
// Type 2 Communications: Tenant staff messaging their customers
// System 3 from COMMUNICATION_SYSTEMS_ARCHITECTURE.md

'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Mail, Phone, Search, Send } from 'lucide-react';

interface Customer {
  id: string;
  primaryName: string;
  primaryPhone?: string;
  primaryEmail?: string;
  company?: string | null;
}

interface Thread {
  id: string;
  contactId: string;
  customer?: Customer;
  subject?: string | null;
  lastMessageAt: string;
  lastMessagePreview?: string | null;
  unreadCount: number;
  status: string;
  metadata: Record<string, unknown>;
}

interface Communication {
  id: string;
  contactId: string;
  userId?: string | null;
  type: string;
  direction: string;
  subject?: string | null;
  content: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export default function CommunicationsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Communication[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  // Load messages when thread selected
  useEffect(() => {
    if (selectedThreadId) {
      fetchMessages(selectedThreadId);
    }
  }, [selectedThreadId]);

  async function fetchThreads() {
    try {
      const res = await fetch('/api/communications/threads');
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(threadId: string) {
    try {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread) return;

      const res = await fetch(`/api/communications?contactId=${thread.contactId}`);
      const data = await res.json();
      setMessages(data.communications || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }

  async function sendMessage() {
    if (!messageText.trim() || !selectedThreadId) return;

    const thread = threads.find((t) => t.id === selectedThreadId);
    if (!thread?.customer) return;

    setSending(true);
    try {
      // TODO Phase 2: Detect type (sms vs email) based on customer preference
      const type = thread.customer.primaryPhone ? 'sms' : 'email';

      const res = await fetch('/api/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: thread.contactId,
          type,
          content: messageText,
          metadata: {
            to: type === 'sms' ? thread.customer.primaryPhone : thread.customer.primaryEmail,
          },
        }),
      });

      if (res.ok) {
        setMessageText('');
        // Reload messages
        await fetchMessages(selectedThreadId);
        // Reload threads to update preview
        await fetchThreads();
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading communications...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Customer Communications</h1>
        <p className="text-sm text-gray-600 mt-1">
          Messages with your customers via SMS and email
        </p>
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Thread List */}
        <div className="w-96 border-r bg-gray-50 flex flex-col">
          {/* Search */}
          <div className="p-4 border-b bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Messages with customers will appear here</p>
              </div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full text-left p-4 border-b hover:bg-white transition-colors ${
                    selectedThreadId === thread.id ? 'bg-white border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-semibold text-gray-900">
                      {thread.customer?.primaryName || 'Unknown Customer'}
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                  {thread.customer?.company && (
                    <div className="text-sm text-gray-600 mb-1">{thread.customer.company}</div>
                  )}
                  <div className="text-sm text-gray-500 truncate">
                    {thread.lastMessagePreview || 'No messages yet'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(thread.lastMessageAt).toLocaleString()}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Message View */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a conversation</p>
                <p className="text-sm mt-2">Choose a customer to view messages</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedThread.customer?.primaryName || 'Unknown Customer'}
                    </h2>
                    {selectedThread.customer?.company && (
                      <p className="text-sm text-gray-600">{selectedThread.customer.company}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      {selectedThread.customer?.primaryPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          <span>{selectedThread.customer.primaryPhone}</span>
                        </div>
                      )}
                      {selectedThread.customer?.primaryEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{selectedThread.customer.primaryEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <p>No messages in this thread yet</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-lg rounded-lg px-4 py-3 ${
                            isOutbound
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {msg.subject && (
                            <div className="font-semibold mb-1">{msg.subject}</div>
                          )}
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                          <div
                            className={`text-xs mt-2 ${
                              isOutbound ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleString()} • {msg.type.toUpperCase()} •{' '}
                            {msg.status}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Composer */}
              <div className="border-t px-6 py-4 bg-gray-50">
                <div className="flex gap-3">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type your message..."
                    rows={3}
                    className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim() || sending}
                    className="self-end px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  📌 Phase 1: Stub implementation. Messages won't actually send yet.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
