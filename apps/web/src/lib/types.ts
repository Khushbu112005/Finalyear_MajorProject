/**
 * CivicSphere Domain Type Definitions.
 * Canonical interfaces for all modules across frontend and API layers.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface CaseItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  location?: string | null;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  counsel_notes?: string | null;
  documents_count?: number;
}

export interface DocumentClassification {
  category?: string;
  confidence?: number;
  document_type?: string;
  [key: string]: unknown;
}

export interface DocumentEntity {
  name: string;
  type: string;
  confidence?: number;
}

export interface DocumentAnalysis {
  document_type?: string;
  authority?: string;
  legal_references?: string[];
  knowledge_node_ids?: string[];
  summary?: string;
  key_findings?: string[];
  action_points?: string[];
  [key: string]: unknown;
}

export interface DocumentItem {
  id: string;
  filename: string;
  original_filename?: string;
  file_type?: string;
  content_type?: string;
  file_size?: number;
  file_size_bytes?: number;
  status_message?: string;
  classification?: DocumentClassification;
  summary?: string;
  analysis?: DocumentAnalysis;
  entities?: DocumentEntity[];
  case_id?: string | null;
  uploaded_at?: string;
  created_at?: string;
  status?: string;
}

export interface LegalSource {
  source_id: string;
  section?: string;
  passage?: string;
  official_url?: string;
  act_title?: string;
  relevance_score?: number;
}

export interface LegalGuidance {
  query?: string;
  fail_safe_state?: string;
  what_i_understood?: string;
  relevant_legal_basis?: string[];
  legal_basis?: string;
  what_it_generally_means?: string;
  how_it_may_relate?: string;
  plain_meaning?: string;
  what_you_may_consider_doing?: string[];
  actionable_steps?: string[] | Array<{ step?: string; title?: string; description?: string }>;
  evidence_that_may_help?: string[];
  where_to_go?: string[];
  timeline_days?: number;
  competent_authorities?: string[];
  penalties_applicable?: string[];
  exceptions?: string[];
  sources?: LegalSource[];
  warnings?: string[];
  statutory_warning?: string;
  important_limitation?: string;
  confidence?: number;
  response?: string;
}

export interface LegalAct {
  id?: string;
  act_id?: string;
  source_id?: string;
  title: string;
  name?: string;
  year?: number;
  jurisdiction?: string;
  description?: string;
  sections_count?: number;
  publisher?: string;
  official_url?: string;
  source_type?: string;
  verification_status?: string;
}

export interface ProcedureStep {
  step_number?: number;
  step_title?: string;
  description?: string;
}

export interface GovScheme {
  service_id: string;
  id?: string;
  name?: string;
  title?: string;
  description: string;
  department?: string;
  ministry?: string;
  authority?: string;
  category?: string;
  is_verified?: boolean;
  sla_days?: number;
  benefits?: string[];
  eligibility_criteria?: string[];
  required_documents?: string[];
  procedure_steps?: Array<ProcedureStep | string>;
  official_url?: string;
  portal_url?: string;
  processing_time_days?: number;
}

export interface GovAnalysisResponse {
  analysis: {
    summary?: string;
    eligible_schemes?: string[];
    recommended_services?: string[];
    next_steps?: string[];
    [key: string]: unknown;
  };
  services: GovScheme[];
}

export interface EligibilityAssessment {
  eligible?: boolean;
  is_eligible?: boolean;
  reason?: string;
  reasons?: string[];
  criteria_met?: string[];
  criteria_missing?: string[];
  confidence?: number;
}

export interface GovEligibilityResponse {
  service_id: string;
  eligibility: EligibilityAssessment;
}

export interface KnowledgeSource {
  source_id: string;
  id?: string;
  title: string;
  publisher?: string;
  jurisdiction?: string;
  official_url?: string;
  url?: string;
  source_type?: string;
  version?: string;
  records_count?: number;
  last_synced?: string;
  description?: string;
}

export interface KnowledgeItem {
  source_title: string;
  section_number?: string;
  rerank_score: number;
  text: string;
  chunk_id: string;
}

export interface KnowledgeSearchResult {
  query: string;
  items?: KnowledgeItem[];
  total_results?: number;
}

export interface GraphNode {
  id: string;
  label?: string;
  type?: string;
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship?: string;
  properties?: Record<string, unknown>;
}

export interface GraphNeighborhood {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AgentTool {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  required_role?: string;
}

export interface AgentToolCall {
  tool_name: string;
  execution_time_ms?: number;
  input?: Record<string, unknown>;
  output?: unknown;
}

export interface AgentChatResponse {
  response?: string;
  agent_name?: string;
  steps_executed?: number;
  tool_calls?: AgentToolCall[];
  confidence?: number;
}

export interface AuditEvent {
  id: string;
  action: string;
  timestamp: string;
  user_id?: string;
  resource?: string;
  status: string;
  details?: Record<string, unknown>;
}
