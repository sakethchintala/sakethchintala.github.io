import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../services/api';
import { Users, Activity, Database, TrendingUp } from 'lucide-react';

const DashboardPage = () => {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsApi.getOverview,
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }
  
  const stats = [
    {
      name: 'Total Users',
      value: overview?.totalUsers || 0,
      change: `${overview?.activeUsers || 0} active`,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'API Calls Today',
      value: overview?.apiCallsToday || 0,
      change: 'Real-time',
      icon: Activity,
      color: 'bg-green-500',
    },
    {
      name: 'Storage Used',
      value: `${((overview?.storageUsed || 0) / 1024 / 1024 / 1024).toFixed(2)} GB`,
      change: 'Total storage',
      icon: Database,
      color: 'bg-purple-500',
    },
    {
      name: 'Growth Rate',
      value: `${((overview?.growthRate || 0) * 100).toFixed(1)}%`,
      change: 'Last 30 days',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];
  
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your platform overview.</p>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <div key={stat.name} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon size={24} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
          );
        })}
      </div>
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/ai-insights"
              className="block p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Generate AI Insights</h4>
              <p className="text-sm text-gray-600 mt-1">
                Get intelligent recommendations based on your platform metrics
              </p>
            </a>
            <a
              href="/users"
              className="block p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600 mt-1">
                View and manage user accounts and permissions
              </p>
            </a>
            <a
              href="/analytics"
              className="block p-4 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <h4 className="font-medium text-gray-900">View Analytics</h4>
              <p className="text-sm text-gray-600 mt-1">
                Deep dive into usage trends and performance metrics
              </p>
            </a>
          </div>
        </div>
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Invite team members</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Add users to your organization and assign roles
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Configure API access</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Generate API keys for integrations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Enable AI insights</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get intelligent recommendations powered by OpenAI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
