// ─── Enums ────────────────────────────────────────────────
export type RoleName       = 'gestor' | 'analista' | 'operador'
export type PermissionName =
  | 'dashboard.view' | 'dashboard.create'
  | 'catalog.view'   | 'catalog.edit'
  | 'data.read'      | 'data.write'
  | 'agents.trigger' | 'pipeline.view' | 'pipeline.edit'
  | 'team.manage'    | 'company.settings'

export type DataSourceType  = 'google_sheets' | 'rest_api' | 'postgresql' | 'mysql' | 'csv' | 'manual'
export type IngestionStatus = 'running' | 'success' | 'failed'
export type FieldType       = 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'currency' | 'percentage'
export type EntryStatus     = 'pending' | 'approved' | 'rejected' | 'flagged'
export type TemplateStatus  = 'draft' | 'active' | 'archived'
export type ModelStatus     = 'draft' | 'active' | 'archived'
export type DashboardStatus = 'draft' | 'published' | 'archived'
export type AgentStatus     = 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
export type AgentType       =
  | 'build_dashboard' | 'apply_rules' | 'analyze_data'
  | 'suggest_model'   | 'validate_entries' | 'generate_report'
export type WidgetType      = 'kpi' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'table' | 'text' | 'gauge' | 'scatter'
export type NotificationType =
  | 'entry_approved' | 'entry_rejected' | 'entry_flagged'
  | 'agent_done'     | 'rule_violated'  | 'model_refreshed' | 'dashboard_published'
export type RuleType        = 'validation' | 'transformation' | 'flag'
export type RuleSeverity    = 'info' | 'warning' | 'error'
export type AuditAction     = 'insert' | 'update' | 'delete'
export type ModelSourceType = 'form_template' | 'raw_records' | 'data_model'

// ─── Rows ─────────────────────────────────────────────────
export interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Role {
  id: string
  name: RoleName
  description: string | null
}

export interface Permission {
  id: string
  name: PermissionName
  description: string | null
}

export interface CompanyMember {
  id: string
  user_id: string
  company_id: string
  role_id: string
  joined_at: string
}

export interface MemberPermission {
  member_id: string
  permission_id: string
  granted: boolean
}

export interface DataSource {
  id: string
  company_id: string
  name: string
  type: DataSourceType
  config: Record<string, unknown>
  status: 'active' | 'inactive' | 'error'
  last_sync_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface IngestionJob {
  id: string
  source_id: string
  company_id: string
  schedule: string | null
  status: 'active' | 'paused'
  created_by: string | null
  created_at: string
}

export interface IngestionRun {
  id: string
  job_id: string
  company_id: string
  status: IngestionStatus
  rows_processed: number
  rows_failed: number
  error_log: unknown | null
  started_at: string
  finished_at: string | null
}

export interface RawRecord {
  id: string
  company_id: string
  source_id: string
  run_id: string | null
  payload: Record<string, unknown>
  ingested_at: string
}

export interface FormTemplate {
  id: string
  company_id: string
  name: string
  description: string | null
  status: TemplateStatus
  version: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FormField {
  id: string
  template_id: string
  name: string
  label: string
  field_type: FieldType
  required: boolean
  order_index: number
  options: { label: string; value: string }[] | null
  validations: Record<string, unknown> | null
  default_value: string | null
  help_text: string | null
}

export interface DataEntry {
  id: string
  company_id: string
  template_id: string
  values: Record<string, unknown>
  status: EntryStatus
  submitted_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  submitted_at: string
}

export interface AuditLog {
  id: string
  company_id: string
  table_name: string
  record_id: string
  action: AuditAction
  actor_id: string | null
  diff: { before?: unknown; after?: unknown } | null
  created_at: string
}

export interface BusinessRule {
  id: string
  company_id: string
  template_id: string | null
  name: string
  description: string | null
  rule_type: RuleType
  condition: Record<string, unknown>
  action: Record<string, unknown>
  severity: RuleSeverity
  status: 'active' | 'inactive'
  version: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RuleValidation {
  id: string
  entry_id: string
  rule_id: string
  company_id: string
  passed: boolean
  message: string | null
  evaluated_at: string
}

export interface DataModel {
  id: string
  company_id: string
  name: string
  description: string | null
  status: ModelStatus
  version: number
  refresh_schedule: string | null
  last_refreshed_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ModelField {
  id: string
  model_id: string
  name: string
  label: string
  field_type: FieldType
  order_index: number
  is_dimension: boolean
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' | null
  format: string | null
}

export interface ModelSource {
  id: string
  model_id: string
  source_type: ModelSourceType
  source_id: string
  field_mapping: Record<string, string>
  filters: unknown | null
}

export interface ModelRecord {
  id: string
  model_id: string
  company_id: string
  values: Record<string, unknown>
  source_entry_id: string | null
  certified_by: string | null
  created_at: string
}

export interface Dashboard {
  id: string
  company_id: string
  name: string
  description: string | null
  status: DashboardStatus
  version: number
  layout: unknown[]
  created_by: string | null
  published_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface DashboardWidget {
  id: string
  dashboard_id: string
  widget_type: WidgetType
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, unknown>
  model_id: string | null
  query_config: Record<string, unknown>
}

export interface AgentRequest {
  id: string
  company_id: string
  requested_by: string
  agent_type: AgentType
  context: Record<string, unknown>
  prompt: string | null
  status: AgentStatus
  created_at: string
}

export interface AgentRun {
  id: string
  request_id: string
  company_id: string
  status: 'running' | 'done' | 'failed'
  result: unknown | null
  log: string | null
  tokens_used: number | null
  started_at: string
  finished_at: string | null
}

export interface Notification {
  id: string
  company_id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  read: boolean
  link: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Sessão ativa ─────────────────────────────────────────
export interface ActiveSession {
  companyId: string
  companyName: string
  role: RoleName
  permissions: PermissionName[]
}
