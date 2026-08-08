// ============================================================
// HumanAPI — Shared Types
// Central type definitions used by both frontend and backend
// ============================================================

// --- Enums ---

export enum PreferenceSource {
  USER_EXPLICIT = 'USER_EXPLICIT',
  USER_CORRECTION = 'USER_CORRECTION',
  AI_INFERRED = 'AI_INFERRED',
  IMPORTED = 'IMPORTED',
}

export enum PreferenceStatus {
  PROPOSED = 'PROPOSED',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED',
}

export enum PreferenceImportance {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DecisionOutcome {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  ASK_USER = 'ASK_USER',
}

export enum PolicyAction {
  AUTO_APPROVE = 'AUTO_APPROVE',
  ASK_USER = 'ASK_USER',
  REJECT = 'REJECT',
}

export enum SuggestionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IGNORED = 'IGNORED',
}

export enum AgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REVOKED = 'REVOKED',
}

export enum DecisionRequestStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  AWAITING_USER = 'AWAITING_USER',
  EXPIRED = 'EXPIRED',
}

// --- Interfaces ---

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Preference {
  id: string;
  user_id: string;
  category: string;
  key: string;
  value: any;
  source: PreferenceSource;
  confidence: number;
  importance: PreferenceImportance;
  status: PreferenceStatus;
  created_at: string;
  updated_at: string;
}

export interface PreferenceVersion {
  id: string;
  preference_id: string;
  value: any;
  source: PreferenceSource;
  changed_by: string;
  created_at: string;
}

export interface PreferenceSuggestion {
  id: string;
  user_id: string;
  category: string;
  key: string;
  proposed_value: any;
  reason: string;
  confidence: number;
  source: PreferenceSource;
  status: SuggestionStatus;
  created_at: string;
  resolved_at?: string;
}

export interface Policy {
  id: string;
  user_id: string;
  name: string;
  category: string;
  conditions: PolicyCondition[];
  action: PolicyAction;
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyCondition {
  field: string;
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq' | 'neq' | 'in' | 'not_in';
  value: any;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  api_key_hash?: string;
  status: AgentStatus;
  created_at: string;
  updated_at: string;
}

export interface AgentPermission {
  id: string;
  agent_id: string;
  permission: string;
  created_at: string;
}

export interface DecisionRequest {
  id: string;
  request_id: string;
  user_id: string;
  agent_id: string;
  decision_type: string;
  payload: FlightPayload | Record<string, any>;
  status: DecisionRequestStatus;
  created_at: string;
  completed_at?: string;
}

export interface FlightPayload {
  origin: string;
  destination: string;
  date: string;
  airline: string;
  price: number;
  currency: string;
  stops: number;
  seat?: string;
  cabin?: string;
  duration?: string;
}

export interface DecisionResult {
  id?: string;
  request_id: string;
  decision: DecisionOutcome;
  confidence: number;
  reason: string;
  matched_policies: string[];
  matched_preferences: string[];
  requires_user_action: boolean;
  created_at?: string;
}

export interface UserOverride {
  id: string;
  decision_id: string;
  user_id: string;
  original_decision: DecisionOutcome;
  override_decision: DecisionOutcome;
  reason?: string;
  remember_preference: boolean;
  created_at: string;
}

// --- API Request / Response Types ---

export interface DecisionRequestBody {
  request_id: string;
  agent_id: string;
  decision_type: string;
  payload: FlightPayload | Record<string, any>;
}

export interface DecisionResponseBody {
  request_id: string;
  decision: DecisionOutcome;
  confidence: number;
  reason: string;
  requires_user_action: boolean;
}

export interface AgentRegistrationBody {
  name: string;
  description: string;
  capabilities: string[];
}

export interface AgentRegistrationResponse {
  agent_id: string;
  api_key: string;
  name: string;
}

export interface OnboardingMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OnboardingChatRequest {
  messages: OnboardingMessage[];
  user_id: string;
}

export interface ExtractedPreference {
  category: string;
  key: string;
  value: any;
  type: 'preference' | 'policy';
  source: PreferenceSource;
  confidence: number;
  display_label: string;
}

export interface OnboardingChatResponse {
  reply: string;
  extracted_preferences: ExtractedPreference[];
  is_complete: boolean;
}

export interface OverrideRequestBody {
  override_decision: DecisionOutcome;
  reason?: string;
  remember_preference: boolean;
}

// --- Claude-specific types ---

export interface ClaudeDecisionInput {
  system_prompt: string;
  user_preferences: Preference[];
  user_policies: Policy[];
  request: DecisionRequestBody;
}

export interface ClaudeDecisionOutput {
  decision: DecisionOutcome;
  confidence: number;
  reason: string;
  matched_preferences: string[];
  matched_policies: string[];
  requires_user_action: boolean;
}

export interface ClaudeExtractionOutput {
  proposals: ExtractedPreference[];
}

// --- Dashboard types ---

export interface DashboardStats {
  total_decisions: number;
  approved: number;
  rejected: number;
  awaiting_user: number;
  pending_suggestions: number;
  agent_status: 'online' | 'offline';
}

export interface ActivityItem {
  decision_request: DecisionRequest;
  decision: DecisionResult;
  agent: Agent;
  override?: UserOverride;
}
