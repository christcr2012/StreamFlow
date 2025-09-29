// src/pages/api/dev/ai/models.ts

/**
 * 🤖 AI MODELS API
 * 
 * Developer API for managing AI models and configurations.
 * Provides model registry, performance metrics, and testing capabilities.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireDeveloperAuth, DeveloperUser } from '@/lib/developer-auth';

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  status: 'active' | 'testing' | 'deprecated';
  tokensUsed: number;
  costPerToken: number;
  accuracy: number;
  latency: number;
  lastUsed: string;
  configuration?: any;
}

// Mock AI models data - in production, this would come from a database
const mockModels: AIModel[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    status: 'active',
    tokensUsed: 1250000,
    costPerToken: 0.00003,
    accuracy: 0.94,
    latency: 1200,
    lastUsed: new Date().toISOString(),
    configuration: {
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0
    }
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    status: 'active',
    tokensUsed: 890000,
    costPerToken: 0.000015,
    accuracy: 0.92,
    latency: 950,
    lastUsed: new Date(Date.now() - 3600000).toISOString(),
    configuration: {
      maxTokens: 4096,
      temperature: 0.7
    }
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'google',
    status: 'testing',
    tokensUsed: 450000,
    costPerToken: 0.0000125,
    accuracy: 0.89,
    latency: 800,
    lastUsed: new Date(Date.now() - 7200000).toISOString(),
    configuration: {
      maxTokens: 2048,
      temperature: 0.8
    }
  },
  {
    id: 'local-llama',
    name: 'Local Llama 2',
    provider: 'local',
    status: 'deprecated',
    tokensUsed: 125000,
    costPerToken: 0,
    accuracy: 0.78,
    latency: 2500,
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
    configuration: {
      maxTokens: 2048,
      temperature: 0.9
    }
  }
];

export default requireDeveloperAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  user: DeveloperUser
) {
  try {
    if (req.method === 'GET') {
      // Get all AI models
      return res.status(200).json({
        ok: true,
        models: mockModels,
        totalModels: mockModels.length,
        activeModels: mockModels.filter(m => m.status === 'active').length,
        totalTokensUsed: mockModels.reduce((sum, m) => sum + m.tokensUsed, 0),
        totalCost: mockModels.reduce((sum, m) => sum + (m.tokensUsed * m.costPerToken), 0)
      });
    }

    if (req.method === 'POST') {
      // Add new AI model
      const { name, provider, configuration } = req.body;

      if (!name || !provider) {
        return res.status(400).json({
          ok: false,
          error: 'Name and provider are required'
        });
      }

      const newModel: AIModel = {
        id: `${provider}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name,
        provider,
        status: 'testing',
        tokensUsed: 0,
        costPerToken: 0.00001, // Default cost
        accuracy: 0,
        latency: 0,
        lastUsed: new Date().toISOString(),
        configuration: configuration || {}
      };

      mockModels.push(newModel);

      return res.status(201).json({
        ok: true,
        model: newModel,
        message: 'AI model added successfully'
      });
    }

    if (req.method === 'PUT') {
      // Update AI model
      const { id, ...updates } = req.body;

      if (!id) {
        return res.status(400).json({
          ok: false,
          error: 'Model ID is required'
        });
      }

      const modelIndex = mockModels.findIndex(m => m.id === id);
      if (modelIndex === -1) {
        return res.status(404).json({
          ok: false,
          error: 'Model not found'
        });
      }

      mockModels[modelIndex] = { ...mockModels[modelIndex], ...updates };

      return res.status(200).json({
        ok: true,
        model: mockModels[modelIndex],
        message: 'AI model updated successfully'
      });
    }

    if (req.method === 'DELETE') {
      // Delete AI model
      const { id } = req.query;

      if (!id || typeof id !== 'string') {
        return res.status(400).json({
          ok: false,
          error: 'Model ID is required'
        });
      }

      const modelIndex = mockModels.findIndex(m => m.id === id);
      if (modelIndex === -1) {
        return res.status(404).json({
          ok: false,
          error: 'Model not found'
        });
      }

      const deletedModel = mockModels.splice(modelIndex, 1)[0];

      return res.status(200).json({
        ok: true,
        model: deletedModel,
        message: 'AI model deleted successfully'
      });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed'
    });

  } catch (error) {
    console.error('AI models API error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Calculate AI model performance metrics
 */
function calculateModelMetrics(model: AIModel) {
  return {
    efficiency: model.accuracy / (model.latency / 1000), // Accuracy per second
    costEfficiency: model.accuracy / model.costPerToken, // Accuracy per cost unit
    usageScore: Math.log(model.tokensUsed + 1) / 10, // Logarithmic usage score
    overallScore: (model.accuracy * 0.4) + 
                  ((2000 - model.latency) / 2000 * 0.3) + 
                  ((0.0001 - model.costPerToken) / 0.0001 * 0.3)
  };
}

/**
 * Get model recommendations based on use case
 */
export function getModelRecommendations(useCase: 'speed' | 'accuracy' | 'cost' | 'balanced') {
  const modelsWithMetrics = mockModels
    .filter(m => m.status === 'active')
    .map(model => ({
      ...model,
      metrics: calculateModelMetrics(model)
    }));

  switch (useCase) {
    case 'speed':
      return modelsWithMetrics.sort((a, b) => a.latency - b.latency);
    case 'accuracy':
      return modelsWithMetrics.sort((a, b) => b.accuracy - a.accuracy);
    case 'cost':
      return modelsWithMetrics.sort((a, b) => a.costPerToken - b.costPerToken);
    case 'balanced':
    default:
      return modelsWithMetrics.sort((a, b) => b.metrics.overallScore - a.metrics.overallScore);
  }
}
