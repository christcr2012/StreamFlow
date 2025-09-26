// src/components/ParsedRFPDisplay.tsx
import { useState } from 'react';

interface ParsedRFP {
  scope: string;
  dueDate: string | null;
  walkthrough: string | null;
  insurance: string | null;
  bond: string | null;
  checklist: string[];
  summary: string;
  talkingPoints: string[];
  originalText?: string;
  filename?: string;
  processedAt?: string;
}

interface ParsedRFPDisplayProps {
  data: ParsedRFP;
  onSave?: () => void;
}

export default function ParsedRFPDisplay({ data, onSave }: ParsedRFPDisplayProps) {
  const [showFullText, setShowFullText] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleChecklistItem = (index: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setCheckedItems(newChecked);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h3 className="text-xl font-semibold text-gradient">Parsed RFP Analysis</h3>
              {data.filename && (
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {data.filename} • {data.processedAt ? new Date(data.processedAt).toLocaleString() : ''}
                </p>
              )}
            </div>
          </div>
          
          {onSave && (
            <button onClick={onSave} className="btn-primary">
              <span>💾 Save to Lead</span>
            </button>
          )}
        </div>

        {/* Summary */}
        <div 
          className="p-4 rounded-lg mb-4"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
        >
          <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Executive Summary
          </h4>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {data.summary}
          </p>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Due Date</h5>
            <p className="text-sm p-2 rounded" style={{ 
              background: 'var(--surface-1)', 
              color: data.dueDate ? 'var(--accent-warning)' : 'var(--text-tertiary)' 
            }}>
              {formatDate(data.dueDate)}
            </p>
          </div>

          <div>
            <h5 className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Walkthrough/Site Visit</h5>
            <p className="text-sm p-2 rounded" style={{ 
              background: 'var(--surface-1)', 
              color: data.walkthrough ? 'var(--text-primary)' : 'var(--text-tertiary)'
            }}>
              {data.walkthrough || 'Not specified'}
            </p>
          </div>

          <div>
            <h5 className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Insurance Requirements</h5>
            <p className="text-sm p-2 rounded" style={{ 
              background: 'var(--surface-1)', 
              color: data.insurance ? 'var(--text-primary)' : 'var(--text-tertiary)'
            }}>
              {data.insurance || 'Not specified'}
            </p>
          </div>

          <div>
            <h5 className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Bond Requirements</h5>
            <p className="text-sm p-2 rounded" style={{ 
              background: 'var(--surface-1)', 
              color: data.bond ? 'var(--text-primary)' : 'var(--text-tertiary)'
            }}>
              {data.bond || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Scope */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gradient">Work Scope</h4>
          <button 
            onClick={() => copyToClipboard(data.scope)}
            className="btn-outline text-xs"
          >
            📋 Copy
          </button>
        </div>
        <div 
          className="p-4 rounded-lg text-sm"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border-primary)' }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            {data.scope}
          </p>
        </div>
      </div>

      {/* Bid Checklist */}
      <div className="premium-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gradient">
            Bid Checklist ({checkedItems.size}/{data.checklist.length} completed)
          </h4>
          <div className="flex gap-2">
            <button 
              onClick={() => copyToClipboard(data.checklist.join('\n• '))}
              className="btn-outline text-xs"
            >
              📋 Copy List
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {data.checklist.map((item, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all"
              style={{ 
                background: checkedItems.has(index) ? 'var(--surface-2)' : 'var(--surface-1)',
                border: '1px solid var(--border-primary)'
              }}
              onClick={() => toggleChecklistItem(index)}
            >
              <input
                type="checkbox"
                checked={checkedItems.has(index)}
                onChange={() => toggleChecklistItem(index)}
                className="mt-0.5 w-4 h-4 rounded border-2"
                style={{ 
                  borderColor: 'var(--border-accent)',
                  accentColor: 'var(--brand-primary)'
                }}
              />
              <span 
                className={`text-sm ${checkedItems.has(index) ? 'line-through' : ''}`}
                style={{ color: checkedItems.has(index) ? 'var(--text-tertiary)' : 'var(--text-secondary)' }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Talking Points */}
      {data.talkingPoints && data.talkingPoints.length > 0 && (
        <div className="premium-card">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gradient">🚀 Strategic Talking Points</h4>
            <button 
              onClick={() => copyToClipboard(data.talkingPoints.join('\n\n'))}
              className="btn-outline text-xs"
            >
              📋 Copy All
            </button>
          </div>
          
          <div className="space-y-3">
            {data.talkingPoints.map((point, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border-accent)' }}
              >
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {point}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Original Text (Collapsible) */}
      {data.originalText && (
        <div className="premium-card">
          <button
            onClick={() => setShowFullText(!showFullText)}
            className="flex items-center justify-between w-full mb-4"
          >
            <h4 className="text-lg font-semibold text-gradient">Original Document Text</h4>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {showFullText ? '▼ Hide' : '▶ Show'} ({data.originalText.length.toLocaleString()} characters)
            </span>
          </button>
          
          {showFullText && (
            <div 
              className="p-4 rounded-lg text-xs overflow-auto max-h-96"
              style={{ 
                background: 'var(--surface-1)', 
                border: '1px solid var(--border-primary)',
                fontFamily: 'monospace'
              }}
            >
              <pre style={{ color: 'var(--text-tertiary)', whiteSpace: 'pre-wrap' }}>
                {data.originalText}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}