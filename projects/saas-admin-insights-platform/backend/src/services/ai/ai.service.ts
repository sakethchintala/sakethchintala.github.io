import OpenAI from 'openai';
import { getMongoDb } from '../../config/database';
import { logger } from '../../utils/logger';
import {
  AIInsight,
  AIAnalysisContext,
  InsightType,
  InsightSeverity,
  ValidationError,
} from '../../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * AI Service for generating insights using OpenAI
 * 
 * This service demonstrates production-ready AI integration:
 * - Grounded in actual platform data (no hallucinations)
 * - Structured prompts for consistent output
 * - Error handling and fallbacks
 * - Caching of insights
 */
class AIService {
  private openai: OpenAI | null = null;
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.warn('⚠️  OpenAI API key not configured. AI features will be disabled.');
    } else {
      this.openai = new OpenAI({ apiKey });
      logger.info('✅ OpenAI client initialized');
    }
  }
  
  /**
   * Generate AI insights for a tenant based on their metrics and usage patterns
   */
  async generateInsights(context: AIAnalysisContext): Promise<AIInsight[]> {
    if (!this.openai) {
      throw new ValidationError('AI service not configured. Please set OPENAI_API_KEY.');
    }
    
    try {
      const prompt = this.buildAnalysisPrompt(context);
      
      logger.info(`Generating AI insights for tenant: ${context.tenant.name}`);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      
      const responseText = completion.choices[0]?.message?.content;
      
      if (!responseText) {
        throw new Error('Empty response from OpenAI');
      }
      
      // Parse AI response into structured insights
      const insights = this.parseInsights(responseText, context.tenant.id);
      
      // Store insights in MongoDB
      await this.storeInsights(insights);
      
      logger.info(`Generated ${insights.length} insights for tenant ${context.tenant.id}`);
      
      return insights;
    } catch (error) {
      logger.error('Failed to generate AI insights:', error);
      
      // Return fallback rule-based insights
      return this.generateFallbackInsights(context);
    }
  }
  
  /**
   * Get existing insights for a tenant
   */
  async getInsights(tenantId: string, limit: number = 10): Promise<AIInsight[]> {
    const db = getMongoDb();
    const collection = db.collection('ai_insights');
    
    const insights = await collection
      .find({ tenantId, dismissed: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    return insights.map(doc => ({
      id: doc._id.toString(),
      tenantId: doc.tenantId,
      type: doc.type,
      severity: doc.severity,
      title: doc.title,
      description: doc.description,
      recommendation: doc.recommendation,
      impact: doc.impact,
      confidence: doc.confidence,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      dismissed: doc.dismissed,
    }));
  }
  
  /**
   * Chat with AI assistant
   */
  async chat(tenantId: string, message: string, context?: any): Promise<string> {
    if (!this.openai) {
      return 'AI assistant is not available. Please configure OpenAI API key.';
    }
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful SaaS platform assistant. Provide concise, actionable advice based on the user\'s question and their platform metrics.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });
      
      return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      logger.error('AI chat error:', error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  }
  
  /**
   * Build analysis prompt from context
   */
  private buildAnalysisPrompt(context: AIAnalysisContext): string {
    return `
Analyze the following SaaS platform metrics and provide actionable insights:

Tenant Information:
- Name: ${context.tenant.name}
- Plan: ${context.tenant.plan}
- Industry: ${context.tenant.industry || 'Not specified'}
- Company Size: ${context.tenant.companySize || 'Not specified'}

Current Metrics:
- Total Users: ${context.metrics.totalUsers}
- Active Users: ${context.metrics.activeUsers} (${Math.round((context.metrics.activeUsers / context.metrics.totalUsers) * 100)}% engagement)
- API Calls Today: ${context.metrics.apiCallsToday}
- Storage Used: ${(context.metrics.storageUsed / 1024 / 1024 / 1024).toFixed(2)} GB
- Average Response Time: ${context.metrics.avgResponseTime}ms
- Error Rate: ${(context.metrics.errorRate * 100).toFixed(2)}%

Trends:
- User Growth Rate: ${(context.trends.userGrowthRate * 100).toFixed(1)}%
- API Usage Pattern: ${context.trends.apiUsagePattern}
- Storage Growth Rate: ${(context.trends.storageGrowthRate * 100).toFixed(1)}%

${context.issues ? `
Issues Detected:
- Failed Logins: ${context.issues.failedLogins}
- Slow Queries: ${context.issues.slowQueries}
- Error Spikes: ${context.issues.errorSpikes ? 'Yes' : 'No'}
` : ''}

Please provide 3-5 insights in the following JSON format:
[
  {
    "type": "anomaly|recommendation|prediction|alert|optimization",
    "severity": "low|medium|high|critical",
    "title": "Brief title",
    "description": "Detailed description of the insight",
    "recommendation": "Specific action to take",
    "impact": "Expected impact of taking action",
    "confidence": 0.0-1.0
  }
]

Focus on:
1. Anomaly detection (unusual patterns)
2. Cost optimization opportunities
3. Performance improvements
4. Security concerns
5. Growth predictions
`;
  }
  
  /**
   * System prompt for AI assistant
   */
  private getSystemPrompt(): string {
    return `You are an expert SaaS operations analyst specializing in platform health, performance optimization, and business intelligence.

Your role is to:
1. Analyze metrics and identify anomalies, trends, and patterns
2. Provide actionable recommendations based on data
3. Predict potential issues before they become critical
4. Suggest optimizations for cost, performance, and user experience
5. Maintain a professional, data-driven tone

Guidelines:
- Base all insights on the provided data
- Provide specific, actionable recommendations
- Include confidence scores for predictions
- Prioritize by business impact
- Be concise but thorough
- Never make up data or metrics

Output Format:
Always return valid JSON array of insights. Each insight must have all required fields.`;
  }
  
  /**
   * Parse AI response into structured insights
   */
  private parseInsights(response: string, tenantId: string): AIInsight[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return parsed.map((item: any) => ({
        id: uuidv4(),
        tenantId,
        type: item.type as InsightType,
        severity: item.severity as InsightSeverity,
        title: item.title,
        description: item.description,
        recommendation: item.recommendation,
        impact: item.impact,
        confidence: item.confidence,
        metadata: {},
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        dismissed: false,
      }));
    } catch (error) {
      logger.error('Failed to parse AI insights:', error);
      return [];
    }
  }
  
  /**
   * Store insights in MongoDB
   */
  private async storeInsights(insights: AIInsight[]): Promise<void> {
    if (insights.length === 0) return;
    
    const db = getMongoDb();
    const collection = db.collection('ai_insights');
    
    await collection.insertMany(insights);
  }
  
  /**
   * Generate rule-based insights when AI is unavailable
   */
  private generateFallbackInsights(context: AIAnalysisContext): AIInsight[] {
    const insights: AIInsight[] = [];
    
    // High error rate alert
    if (context.metrics.errorRate > 0.05) {
      insights.push({
        id: uuidv4(),
        tenantId: context.tenant.id,
        type: InsightType.ALERT,
        severity: InsightSeverity.HIGH,
        title: 'High Error Rate Detected',
        description: `Your application error rate is ${(context.metrics.errorRate * 100).toFixed(2)}%, which is above the healthy threshold of 5%.`,
        recommendation: 'Review recent deployments and check error logs for common failure patterns.',
        impact: 'Reducing errors will improve user experience and reduce support tickets.',
        confidence: 0.95,
        createdAt: new Date(),
        dismissed: false,
      });
    }
    
    // Low user engagement
    const engagementRate = context.metrics.activeUsers / context.metrics.totalUsers;
    if (engagementRate < 0.3) {
      insights.push({
        id: uuidv4(),
        tenantId: context.tenant.id,
        type: InsightType.RECOMMENDATION,
        severity: InsightSeverity.MEDIUM,
        title: 'Low User Engagement',
        description: `Only ${Math.round(engagementRate * 100)}% of your users are active. This suggests potential onboarding or value realization issues.`,
        recommendation: 'Consider implementing in-app tutorials, email campaigns, or user feedback surveys.',
        impact: 'Increasing engagement can improve retention and reduce churn.',
        confidence: 0.85,
        createdAt: new Date(),
        dismissed: false,
      });
    }
    
    // High API usage
    if (context.metrics.apiCallsToday > 800) {
      insights.push({
        id: uuidv4(),
        tenantId: context.tenant.id,
        type: InsightType.PREDICTION,
        severity: InsightSeverity.LOW,
        title: 'Approaching API Limit',
        description: `You've made ${context.metrics.apiCallsToday} API calls today. Based on your ${context.tenant.plan} plan, you may hit limits soon.`,
        recommendation: 'Consider upgrading to a higher tier or implementing request caching.',
        impact: 'Avoiding rate limits prevents service interruptions.',
        confidence: 0.9,
        createdAt: new Date(),
        dismissed: false,
      });
    }
    
    return insights;
  }
}

// Note: uuid is not in package.json, using alternative
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const aiService = new AIService();
