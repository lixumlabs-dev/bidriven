/**
 * Condition DSL
 *
 * Leaf:     { field, operator, value? }
 * Compound: { all: [...] }  — AND
 *           { any: [...] }  — OR
 *           { not: {...} }  — NOT
 *
 * Operators: eq ne gt gte lt lte exists not_exists contains in not_in
 */

type Operator =
  | 'eq' | 'ne'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'exists' | 'not_exists'
  | 'contains'
  | 'in' | 'not_in'

interface LeafCondition {
  field: string
  operator: Operator
  value?: unknown
}

interface CompoundCondition {
  all?: Condition[]
  any?: Condition[]
  not?: Condition
}

type Condition = LeafCondition | CompoundCondition

function isLeaf(c: Condition): c is LeafCondition {
  return 'field' in c && 'operator' in c
}

function compareNumbers(a: unknown, op: Operator, b: unknown): boolean {
  const na = Number(a)
  const nb = Number(b)
  if (isNaN(na) || isNaN(nb)) return false
  switch (op) {
    case 'gt':  return na > nb
    case 'gte': return na >= nb
    case 'lt':  return na < nb
    case 'lte': return na <= nb
    default:    return false
  }
}

export function evaluateCondition(
  condition: Condition,
  values: Record<string, unknown>
): boolean {
  if (isLeaf(condition)) {
    const raw = values[condition.field]
    switch (condition.operator) {
      case 'exists':     return raw !== undefined && raw !== null && raw !== ''
      case 'not_exists': return raw === undefined || raw === null || raw === ''
      case 'eq':         return String(raw) === String(condition.value)
      case 'ne':         return String(raw) !== String(condition.value)
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':        return compareNumbers(raw, condition.operator, condition.value)
      case 'contains':   return String(raw).includes(String(condition.value))
      case 'in':         return Array.isArray(condition.value) && (condition.value as unknown[]).some(v => String(v) === String(raw))
      case 'not_in':     return Array.isArray(condition.value) && !(condition.value as unknown[]).some(v => String(v) === String(raw))
      default:           return false
    }
  }

  const compound = condition as CompoundCondition
  if (compound.all) return compound.all.every(c => evaluateCondition(c, values))
  if (compound.any) return compound.any.some(c  => evaluateCondition(c, values))
  if (compound.not) return !evaluateCondition(compound.not, values)

  return true
}

export interface RuleResult {
  ruleId:   string
  passed:   boolean
  message:  string
  ruleType: string
  severity: string
}

export async function runRulesForEntry(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  companyId: string,
  templateId: string,
  entryId: string,
  values: Record<string, unknown>
): Promise<RuleResult[]> {
  const { data: rules } = await supabase
    .from('business_rules')
    .select('id, name, rule_type, severity, condition, action, applies_to, template_id')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .or(`applies_to.eq.any,and(applies_to.eq.form_template,template_id.eq.${templateId})`)

  if (!rules || rules.length === 0) return []

  const results: RuleResult[] = []
  const validations = []

  for (const rule of rules) {
    let passed = true
    let message = ''

    try {
      const condition = rule.condition as Condition
      passed = evaluateCondition(condition, values)
      message = passed
        ? (rule.action as { success_message?: string })?.success_message ?? 'Validação aprovada'
        : (rule.action as { message?: string })?.message ?? `Regra "${rule.name}" não atendida`
    } catch {
      passed = false
      message = `Erro ao avaliar regra "${rule.name}"`
    }

    results.push({
      ruleId:   rule.id,
      passed,
      message,
      ruleType: rule.rule_type,
      severity: rule.severity,
    })

    validations.push({
      entry_id:     entryId,
      rule_id:      rule.id,
      passed,
      message,
      evaluated_at: new Date().toISOString(),
    })
  }

  if (validations.length > 0) {
    await supabase.from('rule_validations').insert(validations)
  }

  return results
}
