import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Users, Activity, Database } from 'lucide-react';
import { format } from 'date-fns';

const AnalyticsPage = () => {
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsApi.getOverview,
  });
  
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: analyticsApi.getTrends,
  });
  
  if (overviewLoading || trendsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }
  
  // Transform trends data for charts
  const userTrendsData = trends?.users?.map((item: any) => ({
    date: format(new Date(item.timestamp), 'MMM dd'),
    users: item.value,
  })) || [];
  
  const apiTrendsData = trends?.apiCalls?.map((item: any) => ({
    date: format(new Date(item.timestamp), 'MMM dd'),
    calls: item.value,
  })) || [];
  
  const storageTrendsData = trends?.storage?.map((item: any) => ({
    date: format(new Date(item.timestamp), 'MMM dd'),
    storage: (item.value / 1024 / 1024 / 1024).toFixed(2), // Convert to GB
  })) || [];
  
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Detailed insights into your platform usage and performance.</p>
      </div>
      
      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview?.activeUsers || 0}</p>
          <p className="text-sm text-gray-500 mt-1">
            {overview?.totalUsers || 0} total
          </p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Activity size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600">API Calls</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview?.apiCallsToday || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Today</p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Database size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Storage</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {((overview?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">GB used</p>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-600">Growth</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {((overview?.growthRate || 0) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="space-y-6">
        {/* User Activity */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Active Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* API Usage */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Usage (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={apiTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="calls"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="API Calls"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Storage Usage */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={storageTrendsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="storage"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Storage (GB)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
