import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  FileText,
  Download,
  Search,
  User,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Clock,
} from 'lucide-react';

interface AuditLog {
  id: string;
  eventType: string;
  actorUserId: string;
  actorUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Unique event types and resource types for filters
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [resourceTypes, setResourceTypes] = useState<string[]>([]);

  useEffect(() => {
    loadLogs();
  }, [eventTypeFilter, resourceTypeFilter, startDate, endDate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAuditLogs({
        eventType: eventTypeFilter || undefined,
        resourceType: resourceTypeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });
      const logsData = response.data || [];
      setLogs(logsData);

      // Extract unique event types and resource types
      const uniqueEventTypes = [...new Set(logsData.map((log: AuditLog) => log.eventType))];
      const uniqueResourceTypes = [...new Set(logsData.map((log: AuditLog) => log.resourceType))];
      setEventTypes(uniqueEventTypes as string[]);
      setResourceTypes(uniqueResourceTypes as string[]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const blob = await apiService.exportAuditLogs({
        eventType: eventTypeFilter || undefined,
        resourceType: resourceTypeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        format: 'csv',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.eventType.toLowerCase().includes(searchLower) ||
      log.actorUser.firstName.toLowerCase().includes(searchLower) ||
      log.actorUser.lastName.toLowerCase().includes(searchLower) ||
      log.actorUser.email.toLowerCase().includes(searchLower) ||
      log.resourceType.toLowerCase().includes(searchLower) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(searchLower))
    );
  });

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('created') || eventType.includes('invited')) {
      return <CheckCircle className="text-green-600" size={18} />;
    }
    if (eventType.includes('deleted') || eventType.includes('removed')) {
      return <XCircle className="text-red-600" size={18} />;
    }
    if (eventType.includes('updated') || eventType.includes('modified')) {
      return <Info className="text-blue-600" size={18} />;
    }
    if (eventType.includes('failed') || eventType.includes('error')) {
      return <AlertCircle className="text-red-600" size={18} />;
    }
    return <Clock className="text-gray-600" size={18} />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes('created') || eventType.includes('invited')) {
      return 'bg-green-50 border-green-200';
    }
    if (eventType.includes('deleted') || eventType.includes('removed')) {
      return 'bg-red-50 border-red-200';
    }
    if (eventType.includes('updated') || eventType.includes('modified')) {
      return 'bg-blue-50 border-blue-200';
    }
    if (eventType.includes('failed') || eventType.includes('error')) {
      return 'bg-red-50 border-red-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  const formatEventType = (eventType: string) => {
    return eventType
      .split('.')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' › ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            Track all system activities and changes
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-primary flex items-center space-x-2"
        >
          <Download size={20} />
          <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Events</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {formatEventType(type)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">All Resources</option>
              {resourceTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
              placeholder="Start Date"
            />
          </div>
        </div>
        {startDate && (
          <div className="mt-4">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
              placeholder="End Date"
              min={startDate}
            />
          </div>
        )}
      </div>

      {/* Audit Logs List */}
      <div className="space-y-3">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className={`card border ${getEventColor(log.eventType)} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">{getEventIcon(log.eventType)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {formatEventType(log.eventType)}
                    </h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User size={14} />
                        <span>
                          {log.actorUser.firstName} {log.actorUser.lastName}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText size={14} />
                        <span className="capitalize">{log.resourceType}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div className="mt-3 p-3 bg-white bg-opacity-50 rounded border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Details:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(log.metadata).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-gray-600">{key}:</span>{' '}
                          <span className="text-gray-900 font-medium">
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                {(log.ipAddress || log.userAgent) && (
                  <div className="mt-2 text-xs text-gray-500">
                    {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                    {log.ipAddress && log.userAgent && <span className="mx-2">•</span>}
                    {log.userAgent && (
                      <span className="truncate inline-block max-w-md">
                        {log.userAgent}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 card">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No audit logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || eventTypeFilter || resourceTypeFilter || startDate
                ? 'Try adjusting your filters'
                : 'Audit logs will appear here as activities occur'}
            </p>
          </div>
        )}
      </div>

      {/* Load More */}
      {logs.length >= 100 && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Showing latest 100 entries. Use filters or export for more data.
          </p>
        </div>
      )}
    </div>
  );
};
