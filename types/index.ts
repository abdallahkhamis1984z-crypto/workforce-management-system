// ============================================================================
// Core domain types — mirrors supabase/schema.sql exactly
// ============================================================================

export type UserRole = 'admin' | 'hr_manager' | 'production_manager' | 'supervisor' | 'viewer';
export type ShiftType = 'morning' | 'evening' | 'night';
export type EmploymentStatus = 'active' | 'suspended' | 'resigned' | 'terminated' | 'on_leave';
export type AttendanceStatus =
  | 'present' | 'absent' | 'weekly_off' | 'annual_leave' | 'sick_leave' | 'casual_leave'
  | 'permission' | 'mission' | 'overtime' | 'late' | 'early_leave' | 'suspension';
export type EvalLevel = 'excellent' | 'very_good' | 'good' | 'acceptable' | 'poor';

export interface Department {
  id: string;
  name_ar: string;
  name_en: string;
}

export interface Section {
  id: string;
  department_id: string;
  name_ar: string;
  name_en: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  section_id: string | null;
  phone: string | null;
  is_active: boolean;
}

export interface Employee {
  id: string;
  employee_code: string;
  full_name: string;
  department_id: string;
  section_id: string | null;
  position: string;
  hiring_date: string;          // ISO date
  shift: ShiftType;
  supervisor_id: string | null;
  employment_status: EmploymentStatus;
  photo_url?: string | null;
  phone?: string | null;
  national_id?: string | null;
}

export interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  annual_entitlement: number;
  used: number;
  carried_over: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  record_date: string;          // ISO date
  status: AttendanceStatus;
  permission_hours: number;
  overtime_hours: number;
  late_minutes: number;
  early_leave_minutes: number;
  notes?: string | null;
  recorded_by?: string | null;
}

export interface WorkerEvaluation {
  id: string;
  employee_id: string;
  eval_year: number;
  eval_month: number;
  attendance_score: number;     // /25
  productivity_score: number;   // /25
  quality_score: number;        // /20
  discipline_score: number;     // /15
  teamwork_score: number;       // /5
  safety_score: number;         // /10
  total_score: number;          // /100 — generated column in DB
  level: EvalLevel;
  evaluated_by?: string | null;
  notes?: string | null;
}

export interface SupervisorEvaluation {
  id: string;
  supervisor_id: string;
  eval_year: number;
  eval_month: number;
  attendance_discipline: number;
  production_target_pct: number;
  oee_pct: number;
  team_absenteeism_pct: number;
  training_completion_pct: number;
  safety_performance_pct: number;
  employee_turnover_pct: number;
  quality_performance_pct: number;
  material_losses_pct: number;
  daily_reporting_completion_pct: number;
  total_score: number;
}

export interface AppNotification {
  id: string;
  type: 'excessive_absenteeism' | 'frequent_permissions' | 'poor_performance' | 'training_required' | 'leave_balance_low';
  severity: 'info' | 'warning' | 'critical';
  employee_id?: string | null;
  supervisor_id?: string | null;
  message_ar: string;
  message_en: string;
  is_read: boolean;
  created_at: string;
}

// ---- Derived / computed (not stored, calculated client-side or via view) ----
export interface MonthlyAttendanceSummary {
  employee_id: string;
  full_name: string;
  days_present: number;
  days_absent: number;
  total_leaves: number;
  total_permissions: number;
  total_permission_hours: number;
  total_overtime_hours: number;
  late_count: number;
  total_days_recorded: number;
  attendance_pct: number;   // computed: days_present / total_days_recorded * 100
  absenteeism_pct: number;  // computed: days_absent / total_days_recorded * 100
}
