export type PriorityCategory = "none" | "senior_citizen" | "pregnant_woman" | "differently_abled";

export type BookingStatus = "WAITING" | "SERVING" | "COMPLETED" | "SKIPPED" | "CANCELLED";

export interface PredictWaitTimeRequest {
  queue_depth: number;
  arrival_hour?: number;
  day_of_week?: number;
  priority_category: string;
  avg_service_duration: number;
  active_counters: number;
}

export interface PredictWaitTimeResponse {
  predicted_wait_time_minutes: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  model_name: string;
  benchmark_mae: number;
  benchmark_rmse: number;
  adaptive_priority_weight: number;
  calculated_at: string;
}

export interface LiveQueueUpdatePayload {
  officeId: string;
  serviceId?: string;
  currentServing: {
    tokenNumber: string;
    counterNumber: number;
    priorityCategory: string;
  } | null;
  waitingTokens: Array<{
    id: string;
    tokenNumber: string;
    priorityCategory: string;
    priorityScore: number;
    fifoPosition: number;
    predictedWaitMinutes: number;
    createdAt: string;
  }>;
  nowServingList: Array<{
    tokenNumber: string;
    counterNumber: number;
    staffName: string;
    priorityCategory: string;
  }>;
  totalWaiting: number;
  openCountersCount: number;
  timestamp: string;
}
