import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/api';
import { Brain, Sparkles, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { AIInsight, InsightSeverity } from '../types';

const AIInsightsPage = () => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data: insights, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => aiApi.getInsights(),
  });
  
  const generateMutation = useMutation({
    mutationFn: aiApi.generateInsights,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
  });
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };
  
  const getSeverityIcon = (severity: InsightSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="text-red-600" size={24} />;
      case 'high':
        return <AlertTriangle className="text-orange-600" size={24} />;
      case 'medium':
        return <Info className="text-blue-600" size={24} />;
      case 'low':
        return <CheckCircle className="text-green-600" size={24} />;
      default:
        return <Info className="text-gray-600" size={24} />;
    }
  };
  
  const getSeverityColor = (severity: InsightSeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'medium':
        return 'border-blue-200 bg-blue-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };
  
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Brain className="text-primary-600" />
              AI Insights
            </h1>
            <p className="text-gray-600 mt-2">
              Intelligent recommendations powered by OpenAI to optimize your platform.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary flex items-center gap-2"
          >
            <Sparkles size={20} />
            {isGenerating ? 'Generating...' : 'Generate Insights'}
          </button>
        </div>
      </div>
      
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="text-blue-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-blue-900">How AI Insights Work</h3>
            <p className="text-sm text-blue-800 mt-1">
              Our AI analyzes your platform metrics, usage patterns, and trends to provide actionable
              recommendations. All insights are grounded in your actual data - no hallucinations!
            </p>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="spinner"></div>
        </div>
      )}
      
      {/* Insights list */}
      {!isLoading && (
        <div className="space-y-4">
          {insights && insights.length > 0 ? (
            insights.map((insight: AIInsight) => (
              <div
                key={insight.id}
                className={`card border-l-4 ${getSeverityColor(insight.severity)}`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getSeverityIcon(insight.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 capitalize">
                              {insight.type}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white border border-gray-200 capitalize">
                              {insight.severity}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(insight.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{insight.description}</p>
                      
                      {insight.recommendation && (
                        <div className="bg-white rounded-lg p-4 mb-3 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            💡 Recommendation
                          </h4>
                          <p className="text-sm text-gray-700">{insight.recommendation}</p>
                        </div>
                      )}
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">
                          📈 Expected Impact
                        </h4>
                        <p className="text-sm text-gray-700">{insight.impact}</p>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-3">
                        Generated {new Date(insight.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card p-12 text-center">
              <Brain className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights yet</h3>
              <p className="text-gray-600 mb-4">
                Click "Generate Insights" to analyze your platform metrics and get AI-powered recommendations.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-primary mx-auto"
              >
                <Sparkles size={20} className="mr-2" />
                Generate Your First Insights
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIInsightsPage;
