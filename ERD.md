# Entity Relationship Diagram — Workforce Management System

```mermaid
erDiagram
  DEPARTMENTS ||--o{ SECTIONS : has
  DEPARTMENTS ||--o{ EMPLOYEES : employs
  SECTIONS ||--o{ EMPLOYEES : contains
  PROFILES ||--o{ EMPLOYEES : supervises
  EMPLOYEES ||--o{ ATTENDANCE_RECORDS : has
  EMPLOYEES ||--o{ WORKER_EVALUATIONS : evaluated_in
  EMPLOYEES ||--o{ LEAVE_BALANCES : owns
  PROFILES ||--o{ SUPERVISOR_EVALUATIONS : evaluated_in
  PROFILES ||--o{ ATTENDANCE_RECORDS : records
  EMPLOYEES ||--o{ NOTIFICATIONS : triggers
  PROFILES ||--o{ NOTIFICATIONS : triggers
  PROFILES ||--o{ AUDIT_LOG : performs

  DEPARTMENTS {
    uuid id PK
    text name_ar
    text name_en
  }
  SECTIONS {
    uuid id PK
    uuid department_id FK
    text name_ar
    text name_en
  }
  PROFILES {
    uuid id PK "references auth.users"
    text full_name
    user_role role
    uuid department_id FK
    uuid section_id FK
  }
  EMPLOYEES {
    uuid id PK
    text employee_code UK
    text full_name
    uuid department_id FK
    uuid section_id FK
    text position
    date hiring_date
    shift_type shift
    uuid supervisor_id FK
    employment_status employment_status
  }
  LEAVE_BALANCES {
    uuid id PK
    uuid employee_id FK
    int year
    numeric annual_entitlement
    numeric used
    numeric carried_over
  }
  ATTENDANCE_RECORDS {
    uuid id PK
    uuid employee_id FK
    date record_date
    attendance_status status
    numeric permission_hours
    numeric overtime_hours
    int late_minutes
    int early_leave_minutes
    uuid recorded_by FK
  }
  WORKER_EVALUATIONS {
    uuid id PK
    uuid employee_id FK
    int eval_year
    int eval_month
    numeric attendance_score
    numeric productivity_score
    numeric quality_score
    numeric discipline_score
    numeric teamwork_score
    numeric safety_score
    numeric total_score
    eval_level level
  }
  SUPERVISOR_EVALUATIONS {
    uuid id PK
    uuid supervisor_id FK
    int eval_year
    int eval_month
    numeric attendance_discipline
    numeric production_target_pct
    numeric oee_pct
    numeric team_absenteeism_pct
    numeric training_completion_pct
    numeric safety_performance_pct
    numeric employee_turnover_pct
    numeric quality_performance_pct
    numeric material_losses_pct
    numeric daily_reporting_completion_pct
    numeric total_score
  }
  NOTIFICATIONS {
    uuid id PK
    text type
    text severity
    uuid employee_id FK
    uuid supervisor_id FK
    boolean is_read
  }
  AUDIT_LOG {
    uuid id PK
    uuid actor_id FK
    text action
    text table_name
    uuid record_id
  }
```

## Notes
- `profiles.id` is a 1:1 extension of Supabase `auth.users` — created automatically via a
  Postgres trigger (`on_auth_user_created`) recommended in `supabase/schema.sql` comments.
- `employees.supervisor_id` references `profiles.id` (a supervisor is a system user, an
  employee is a factory worker — they are separate entities so a supervisor doesn't need
  a worker-style record).
- `worker_evaluations.total_score` is a **generated column** (auto-computed by Postgres);
  `level` is set by the application layer (or an optional trigger) based on the score bands.
- `supervisor_evaluations.total_score` is computed in the application layer using the
  documented KPI weights (see `src/lib/calculations.ts`).
