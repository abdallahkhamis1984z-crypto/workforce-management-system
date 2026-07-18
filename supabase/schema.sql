-- ============================================================================
-- Workforce Management System — Database Schema (PostgreSQL / Supabase)
-- Designed for 500+ workers, multi-department food manufacturing plant
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------- ENUM TYPES ----------
create type user_role as enum ('admin','hr_manager','production_manager','supervisor','viewer');
create type shift_type as enum ('morning','evening','night');
create type employment_status as enum ('active','suspended','resigned','terminated','on_leave');
create type attendance_status as enum (
  'present','absent','weekly_off','annual_leave','sick_leave','casual_leave',
  'permission','mission','overtime','late','early_leave','suspension'
);
create type eval_level as enum ('excellent','very_good','good','acceptable','poor');

-- ---------- CORE ORG STRUCTURE ----------
create table departments (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  created_at timestamptz default now()
);

create table sections (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  created_at timestamptz default now()
);

-- ---------- USERS (mirrors auth.users, extends with app role) ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'viewer',
  department_id uuid references departments(id),
  section_id uuid references sections(id),
  phone text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------- EMPLOYEES ----------
create table employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text unique not null,          -- Employee ID (business key, e.g. EMP-0001)
  full_name text not null,
  department_id uuid references departments(id) not null,
  section_id uuid references sections(id),
  position text not null,
  hiring_date date not null,
  shift shift_type not null default 'morning',
  supervisor_id uuid references profiles(id),
  employment_status employment_status not null default 'active',
  photo_url text,
  phone text,
  national_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_employees_department on employees(department_id);
create index idx_employees_supervisor on employees(supervisor_id);
create index idx_employees_status on employees(employment_status);

-- ---------- LEAVE BALANCES (annual leave tracking) ----------
create table leave_balances (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  year int not null,
  annual_entitlement numeric(6,2) not null default 21,
  used numeric(6,2) not null default 0,
  carried_over numeric(6,2) not null default 0,
  unique(employee_id, year)
);

-- ---------- DAILY ATTENDANCE ----------
create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade not null,
  record_date date not null,
  status attendance_status not null,
  permission_hours numeric(4,2) default 0,      -- used when status = 'permission'
  overtime_hours numeric(4,2) default 0,
  late_minutes int default 0,
  early_leave_minutes int default 0,
  notes text,
  recorded_by uuid references profiles(id),     -- supervisor who entered it
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(employee_id, record_date)
);
create index idx_attendance_date on attendance_records(record_date);
create index idx_attendance_employee on attendance_records(employee_id);
create index idx_attendance_status on attendance_records(status);

-- ---------- MONTHLY WORKER EVALUATION ----------
create table worker_evaluations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade not null,
  eval_year int not null,
  eval_month int not null check (eval_month between 1 and 12),
  attendance_score numeric(5,2) not null default 0,     -- out of 25
  productivity_score numeric(5,2) not null default 0,   -- out of 25
  quality_score numeric(5,2) not null default 0,        -- out of 20
  discipline_score numeric(5,2) not null default 0,     -- out of 15
  teamwork_score numeric(5,2) not null default 0,       -- out of 5
  safety_score numeric(5,2) not null default 0,         -- out of 10
  total_score numeric(5,2) generated always as (
    attendance_score+productivity_score+quality_score+discipline_score+teamwork_score+safety_score
  ) stored,
  level eval_level,
  evaluated_by uuid references profiles(id),
  notes text,
  created_at timestamptz default now(),
  unique(employee_id, eval_year, eval_month)
);
create index idx_worker_eval_period on worker_evaluations(eval_year, eval_month);

-- ---------- SUPERVISOR MONTHLY KPI ----------
create table supervisor_evaluations (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid references profiles(id) not null,
  eval_year int not null,
  eval_month int not null check (eval_month between 1 and 12),
  attendance_discipline numeric(5,2) default 0,
  production_target_pct numeric(5,2) default 0,
  oee_pct numeric(5,2) default 0,
  team_absenteeism_pct numeric(5,2) default 0,
  training_completion_pct numeric(5,2) default 0,
  safety_performance_pct numeric(5,2) default 0,
  employee_turnover_pct numeric(5,2) default 0,
  quality_performance_pct numeric(5,2) default 0,
  material_losses_pct numeric(5,2) default 0,
  daily_reporting_completion_pct numeric(5,2) default 0,
  total_score numeric(5,2),
  created_at timestamptz default now(),
  unique(supervisor_id, eval_year, eval_month)
);

-- ---------- NOTIFICATIONS ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  severity text not null default 'warning',
  employee_id uuid references employees(id),
  supervisor_id uuid references profiles(id),
  message_ar text not null,
  message_en text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index idx_notifications_unread on notifications(is_read) where is_read = false;

-- ---------- AUDIT LOG ----------
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
alter table employees enable row level security;
alter table attendance_records enable row level security;
alter table worker_evaluations enable row level security;
alter table supervisor_evaluations enable row level security;
alter table notifications enable row level security;

create policy "admin_hr_full_access_employees" on employees for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hr_manager')));

create policy "production_manager_read_employees" on employees for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hr_manager','production_manager')));

create policy "supervisor_scoped_employees" on employees for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'supervisor')
    and supervisor_id = auth.uid()
  );

create policy "supervisor_insert_attendance" on attendance_records for insert
  with check (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hr_manager','production_manager','supervisor'))
  );

create policy "supervisor_read_own_team_attendance" on attendance_records for select
  using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('admin','hr_manager','production_manager'))
    or exists (select 1 from employees e where e.id = attendance_records.employee_id and e.supervisor_id = auth.uid())
  );

create policy "viewer_read_only_notifications" on notifications for select
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- NOTE: extend the same pattern (admin/hr full, production_manager dept-scoped,
-- supervisor own-team, viewer read-only) to worker_evaluations & supervisor_evaluations.

-- ============================================================================
-- HELPER VIEW — pre-aggregated monthly attendance summary per employee
-- ============================================================================
create view v_monthly_attendance_summary as
select
  e.id as employee_id, e.full_name, e.department_id, e.section_id,
  date_trunc('month', ar.record_date)::date as month,
  count(*) filter (where ar.status = 'present') as days_present,
  count(*) filter (where ar.status = 'absent') as days_absent,
  count(*) filter (where ar.status in ('annual_leave','sick_leave','casual_leave')) as total_leaves,
  count(*) filter (where ar.status = 'permission') as total_permissions,
  coalesce(sum(ar.permission_hours),0) as total_permission_hours,
  coalesce(sum(ar.overtime_hours),0) as total_overtime_hours,
  count(*) filter (where ar.status = 'late') as late_count,
  count(*) as total_days_recorded
from employees e
join attendance_records ar on ar.employee_id = e.id
group by e.id, e.full_name, e.department_id, e.section_id, date_trunc('month', ar.record_date);
