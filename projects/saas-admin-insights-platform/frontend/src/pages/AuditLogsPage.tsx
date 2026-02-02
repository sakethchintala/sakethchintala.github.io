import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../services/api';
import { FileText, User, Calendar, Activity } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogsPage = () => {
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.getLogs(),
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }
  
  const logs = auditData?.logs || [];
  
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'LOGIN_FAILED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="text-primary-600" />
          Audit Logs
        </h1>
        <p className="text-gray-600 mt-2">
          Complete activity trail for compliance and security monitoring.
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Events</h3>
          <p className="text-3xl font-bold text-gray-900">{logs.length}</p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Today</h3>
          <p className="text-3xl font-bold text-blue-600">
            {logs.filter((log: any) => 
              new Date(log.createdAt).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Failed Logins</h3>
          <p className="text-3xl font-bold text-red-600">
            {logs.filter((log: any) => log.action === 'LOGIN_FAILED').length}
          </p>
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Unique Users</h3>
          <p className="text-3xl font-bold text-purple-600">
            {new Set(logs.filter((log: any) => log.userId).map((log: any) => log.userId)).size}
          </p>
        </div>
      </div>
      
      {/* Audit logs timeline */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {logs.length > 0 ? (
            logs.map((log: any) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
                      <Activity size={20} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-sm text-gray-500">
                        {log.resource}
                        {log.resourceId && ` #${log.resourceId.substring(0, 8)}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 mb-2">{log.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {log.user && (
                        <span className="flex items-center gap-1">
                          <User size={14} />
                          {log.user.firstName} {log.user.lastName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                      {log.ipAddress && (
                        <span>IP: {log.ipAddress}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs yet</h3>
              <p className="text-gray-600">Activity logs will appear here as actions are performed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
