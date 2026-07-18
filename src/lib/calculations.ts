// ============================================================================
// All automatic calculations for the Workforce Management System.
// Pure functions — fully unit-testable, no side effects, no DB calls.
// ============================================================================
import type {
  AttendanceRecord, AttendanceStatus, MonthlyAttendanceSummary,
  EvalLevel, SupervisorEvaluation,
} from '../types';

// ---------------------------------------------------------------------------
// 1) DAILY ATTENDANCE AGGREGATES
// ---------------------------------------------------------------------------
const LEAVE_STATUSES: AttendanceStatus[] = ['annual_leave', 'sick_leave', 'casual_leave'];

export function summarizeAttendance(
  employeeId: string,
  fullName: string,
  records: AttendanceRecord[],
): MonthlyAttendanceSummary {
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const leaves = records.filter(r => LEAVE_STATUSES.includes(r.status)).length;
  const permissions = records.filter(r => r.status === 'permission').length;
  const permissionHours = records.reduce((s, r) => s + (r.permission_hours || 0), 0);
  const overtimeHours = records.reduce((s, r) => s + (r.overtime_hours || 0), 0);
  const lateCount = records.filter(r => r.status === 'late').length;

  return {
    employee_id: employeeId,
    full_name: fullName,
    days_present: present,
    days_absent: absent,
    total_leaves: leaves,
    total_permissions: permissions,
    total_permission_hours: round2(permissionHours),
    total_overtime_hours: round2(overtimeHours),
    late_count: lateCount,
    total_days_recorded: total,
    attendance_pct: total > 0 ? round2((present / total) * 100) : 0,
    absenteeism_pct: total > 0 ? round2((absent / total) * 100) : 0,
  };
}

// ---------------------------------------------------------------------------
// 2) WORKER MONTHLY EVALUATION (weighted to 100)
//    Attendance 25% · Productivity 25% · Quality 20% · Discipline 15%
//    Teamwork 5% · Safety 10%
// ---------------------------------------------------------------------------
export const EVAL_WEIGHTS = {
  attendance: 25,
  productivity: 25,
  quality: 20,
  discipline: 15,
  teamwork: 5,
  safety: 10,
} as const;

export interface WorkerEvalInput {
  /** each sub-score is entered by the evaluator as a 0-100 raw rating;
   *  this function converts it into its weighted contribution automatically */
  attendanceRaw: number;    // 0-100
  productivityRaw: number;  // 0-100
  qualityRaw: number;       // 0-100
  disciplineRaw: number;    // 0-100
  teamworkRaw: number;      // 0-100
  safetyRaw: number;        // 0-100
}

export interface WorkerEvalResult {
  attendance_score: number;
  productivity_score: number;
  quality_score: number;
  discipline_score: number;
  teamwork_score: number;
  safety_score: number;
  total_score: number;
  level: EvalLevel;
}

export function calcWorkerEvaluation(input: WorkerEvalInput): WorkerEvalResult {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const attendance_score = round2((clamp(input.attendanceRaw) / 100) * EVAL_WEIGHTS.attendance);
  const productivity_score = round2((clamp(input.productivityRaw) / 100) * EVAL_WEIGHTS.productivity);
  const quality_score = round2((clamp(input.qualityRaw) / 100) * EVAL_WEIGHTS.quality);
  const discipline_score = round2((clamp(input.disciplineRaw) / 100) * EVAL_WEIGHTS.discipline);
  const teamwork_score = round2((clamp(input.teamworkRaw) / 100) * EVAL_WEIGHTS.teamwork);
  const safety_score = round2((clamp(input.safetyRaw) / 100) * EVAL_WEIGHTS.safety);
  const total_score = round2(
    attendance_score + productivity_score + quality_score + discipline_score + teamwork_score + safety_score,
  );
  return {
    attendance_score, productivity_score, quality_score,
    discipline_score, teamwork_score, safety_score,
    total_score, level: evalLevel(total_score),
  };
}

export function evalLevel(score: number): EvalLevel {
  if (score >= 95) return 'excellent';
  if (score >= 85) return 'very_good';
  if (score >= 75) return 'good';
  if (score >= 60) return 'acceptable';
  return 'poor';
}

export const EVAL_LEVEL_LABEL: Record<EvalLevel, { ar: string; en: string; color: string }> = {
  excellent:  { ar: 'ممتاز',   en: 'Excellent',  color: '#16a34a' },
  very_good:  { ar: 'جيد جدًا', en: 'Very Good',  color: '#65a30d' },
  good:       { ar: 'جيد',     en: 'Good',       color: '#ca8a04' },
  acceptable: { ar: 'مقبول',   en: 'Acceptable', color: '#ea580c' },
  poor:       { ar: 'ضعيف',    en: 'Poor',       color: '#dc2626' },
};

// ---------------------------------------------------------------------------
// 3) SUPERVISOR MONTHLY KPI (equal-weighted composite; adjust WEIGHTS as needed)
// ---------------------------------------------------------------------------
export const SUPERVISOR_KPI_WEIGHTS = {
  attendance_discipline: 15,
  production_target_pct: 15,
  oee_pct: 15,
  team_absenteeism_pct: 10,   // inverted — lower absenteeism = higher score
  training_completion_pct: 10,
  safety_performance_pct: 10,
  employee_turnover_pct: 5,   // inverted — lower turnover = higher score
  quality_performance_pct: 10,
  material_losses_pct: 5,    // inverted — lower losses = higher score
  daily_reporting_completion_pct: 5,
} as const;

export type SupervisorKpiInput = Omit<
  SupervisorEvaluation, 'id' | 'supervisor_id' | 'eval_year' | 'eval_month' | 'total_score'
>;

export function calcSupervisorScore(input: SupervisorKpiInput): number {
  const clamp = (n: number) => Math.max(0, Math.min(100, n));
  const w = SUPERVISOR_KPI_WEIGHTS;
  let score = 0;
  score += (clamp(input.attendance_discipline) / 100) * w.attendance_discipline;
  score += (clamp(input.production_target_pct) / 100) * w.production_target_pct;
  score += (clamp(input.oee_pct) / 100) * w.oee_pct;
  score += (clamp(100 - input.team_absenteeism_pct) / 100) * w.team_absenteeism_pct;
  score += (clamp(input.training_completion_pct) / 100) * w.training_completion_pct;
  score += (clamp(input.safety_performance_pct) / 100) * w.safety_performance_pct;
  score += (clamp(100 - input.employee_turnover_pct) / 100) * w.employee_turnover_pct;
  score += (clamp(input.quality_performance_pct) / 100) * w.quality_performance_pct;
  score += (clamp(100 - input.material_losses_pct) / 100) * w.material_losses_pct;
  score += (clamp(input.daily_reporting_completion_pct) / 100) * w.daily_reporting_completion_pct;
  return round2(score);
}

// ---------------------------------------------------------------------------
// 4) YEARLY RANKING (workers & supervisors) — average of monthly totals
// ---------------------------------------------------------------------------
export function rankByAverageScore<T extends { id: string; name: string; scores: number[] }>(
  entities: T[],
): (T & { avg_score: number; rank: number })[] {
  const withAvg = entities.map(e => ({
    ...e,
    avg_score: e.scores.length ? round2(e.scores.reduce((a, b) => a + b, 0) / e.scores.length) : 0,
  }));
  return withAvg
    .sort((a, b) => b.avg_score - a.avg_score)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

// ---------------------------------------------------------------------------
// 5) NOTIFICATION RULES (thresholds — tune per factory policy)
// ---------------------------------------------------------------------------
export const NOTIFICATION_THRESHOLDS = {
  excessiveAbsenteeismPct: 10,     // absenteeism % above this in a month → alert
  frequentPermissionsCount: 4,     // permissions count above this in a month → alert
  poorPerformanceScore: 60,        // worker/supervisor total score below this → alert
  lowLeaveBalanceDays: 3,          // remaining annual leave days below this → alert
} as const;

export function evaluateNotificationRules(summary: MonthlyAttendanceSummary, evalScore?: number) {
  const alerts: { type: string; severity: 'warning' | 'critical'; message_ar: string; message_en: string }[] = [];
  if (summary.absenteeism_pct >= NOTIFICATION_THRESHOLDS.excessiveAbsenteeismPct) {
    alerts.push({
      type: 'excessive_absenteeism', severity: 'critical',
      message_ar: `نسبة غياب ${summary.full_name} وصلت ${summary.absenteeism_pct}% هذا الشهر`,
      message_en: `${summary.full_name}'s absenteeism reached ${summary.absenteeism_pct}% this month`,
    });
  }
  if (summary.total_permissions >= NOTIFICATION_THRESHOLDS.frequentPermissionsCount) {
    alerts.push({
      type: 'frequent_permissions', severity: 'warning',
      message_ar: `${summary.full_name} استأذن ${summary.total_permissions} مرات هذا الشهر`,
      message_en: `${summary.full_name} requested permission ${summary.total_permissions} times this month`,
    });
  }
  if (evalScore !== undefined && evalScore < NOTIFICATION_THRESHOLDS.poorPerformanceScore) {
    alerts.push({
      type: 'poor_performance', severity: 'critical',
      message_ar: `تقييم ${summary.full_name} هذا الشهر ${evalScore}/100 — أقل من الحد المقبول`,
      message_en: `${summary.full_name}'s evaluation this month is ${evalScore}/100 — below acceptable threshold`,
    });
  }
  return alerts;
}

// ---------------------------------------------------------------------------
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
