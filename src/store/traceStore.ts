// src/store/traceStore.ts
// Simple trace state management — holds traces per workflow

import { TraceSummary, SAMPLE_TRACES } from '../types/agentTrace';

/**
 * In-memory trace store.
 * For MVP, we keep it simple — no Redux/Zustand overhead.
 */
class TraceStore {
  private traces: Map<string, TraceSummary[]> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Set traces for a workflow (from backend response).
   */
  setTraces(workflowId: string, traces: TraceSummary[]): void {
    this.traces.set(workflowId, traces);
    this.notify();
  }

  /**
   * Append a trace to an existing workflow.
   */
  addTrace(trace: TraceSummary): void {
    const existing = this.traces.get(trace.workflowId) || [];
    existing.push(trace);
    this.traces.set(trace.workflowId, existing);
    this.notify();
  }

  /**
   * Get traces for a workflow.
   */
  getTraces(workflowId: string): TraceSummary[] {
    return this.traces.get(workflowId) || [];
  }

  /**
   * Get sample traces for UI testing.
   */
  getSampleTraces(): TraceSummary[] {
    return SAMPLE_TRACES;
  }

  /**
   * Clear traces for a workflow.
   */
  clear(workflowId: string): void {
    this.traces.delete(workflowId);
    this.notify();
  }

  /**
   * Subscribe to changes.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Export all traces as JSON string.
   */
  exportJSON(workflowId: string): string {
    const traces = this.getTraces(workflowId);
    return JSON.stringify(
      {
        workflowId,
        exportedAt: new Date().toISOString(),
        totalSteps: traces.length,
        totalLatencyMs: traces.reduce((sum, t) => sum + t.latencyMs, 0),
        traces,
      },
      null,
      2
    );
  }
}

export const traceStore = new TraceStore();
