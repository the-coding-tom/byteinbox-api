// Time series data point with smart interval formatting
export class TimeSeriesDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  displayDate: string; // Formatted for UI (e.g., "Sep, 15", "Oct, 03")
  value: number;
}

// Bounce rate breakdown
export class BounceRateBreakdown {
  transient: { count: number; percentage: number };
  permanent: { count: number; percentage: number };
  undetermined: { count: number; percentage: number };
}

// Complain rate breakdown
export class ComplainRateBreakdown {
  complained: { count: number; percentage: number };
}

// ============================================
// METRICS DATA
// ============================================
export class MetricsDataDto {
  sentEmails: {
    total: number; // Total sent emails for the period
    deliverabilityRate: number; // Percentage for the period
    timeSeriesData: TimeSeriesDataPoint[];
  };
  bounceRate: {
    total: number; // Current bounce rate percentage
    riskThreshold: number; // percentage (4%)
    timeSeriesData: TimeSeriesDataPoint[]; // Always 4 points
    breakdown: BounceRateBreakdown;
  };
  complainRate: {
    total: number; // Current complain rate percentage
    riskThreshold: number; // percentage (0.08%)
    timeSeriesData: TimeSeriesDataPoint[]; // Always 4 points
    breakdown: ComplainRateBreakdown;
  };
}

// ============================================
// METRICS META
// ============================================
export class MetricsMetaDto {
  start: string;
  end: string;
  interval: 'daily' | 'multi-day' | 'weekly'; // Smart interval type
  lastUpdatedAt: string; // When the metrics data was last prepared by cron
}

// ============================================
// METRICS FILTER
// ============================================
export class MetricsFilterDto {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  eventType?: string; // For "All Events" filter
}
