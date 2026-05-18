// src/services/backend/orchestratorClient.ts
// Mobile client for the /runWorkflow endpoint
// Calls the central orchestrator which chains all agentic steps

import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';

export interface WorkflowInput {
  rawText: string;
  customerUid?: string;
  mode: 'full' | 'step_by_step';
}

export interface WorkflowResult {
  success: boolean;
  workflowId: string;
  completedSteps: string[];
  failedStep: string | null;
  parsedRequest: any;
  providerCandidates: any[];
  rankedProviders: any[];
  selectedProvider: any;
  priceEstimate: any;
  bookingResult: any;
  outcomeEvaluation: any;
  traces: any[];
  warnings: string[];
  latencyMs: number;
}

/**
 * Run the full agentic workflow in one call
 * Chains: parse → discover → rank → price → book
 */
export async function runFullWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.RUN_WORKFLOW}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Workflow API Error ${response.status}: ${errorBody}`);
  }

  return response.json();
}
