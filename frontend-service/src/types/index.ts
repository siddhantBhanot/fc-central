export interface Microservice {
  id: string;
  name: string;
  description?: string;
  has_indexed_data?: boolean;
  doc_count?: number;
}

export type MessageStatus =
  | 'pending'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface SourceCitation {
  file: string;
  service?: string;
  doc_type?: string;
  docType?: string;
  class_name?: string;
  class?: string;
  method?: string;
  endpoint?: string;
  start_line?: number;
  end_line?: number;
  lineNumber?: number;
  snippet?: string;
  contentSnippet?: string;
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: MessageStatus;
  sources?: SourceCitation[];
  latencyMs?: number;
  provider?: string;
  model?: string;
  feedbackRating?: 'positive' | 'negative' | null;
  feedbackComment?: string;
}

// Backend API Request & Response Contracts

export interface QueryRequest {
  query: string;
  conversation_id?: string | null;
  share_token?: string | null;
  service?: string;
  model?: string | null;
  top_k?: number;
}

export interface QueryResponse {
  conversation_id: string;
  message_id: string;
  answer: string;
  sources: SourceCitation[];
  service: string;
  latency_ms: number;
  provider: string;
  model: string;
  forked?: boolean;
  forked_from?: string | null;
  created_at: string;
}

export interface FeedbackRequest {
  message_id: string;
  conversation_id: string;
  rating: 'positive' | 'negative';
  comment?: string;
}

export interface FeedbackResponse {
  id: string;
  message_id: string;
  conversation_id: string;
  rating: string;
  comment?: string;
  status: string;
  created_at: string;
}

export interface KnowledgeIngestRequest {
  service: string;
  source_path?: string | null;
}

export interface KnowledgeIngestResponse {
  job_id: string;
  service: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  source_path: string;
  total_files: number;
  total_chunks: number;
  files_indexed: string[];
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface KnowledgeUploadResponse {
  filename: string;
  service: string;
  size_bytes: number;
  status: string;
  extracted_files_count?: number | null;
  message: string;
}

export interface KnowledgeFileInfo {
  name: string;
  path: string;
  service: string;
  format: 'MD' | 'PDF' | string;
  size_bytes: number;
  status: 'pending' | 'ingested';
  modified_at: string;
}

export interface CourseUploadResponse {
  course_id: string;
  title: string;
  target_service: string;
  total_lessons: number;
  status: string;
  message: string;
}

export interface PendingCourseInfo {
  course_id: string;
  title: string;
  target_service: string;
  domain: string;
  difficulty: string;
  total_lessons: number;
  status: string;
  staged_at: string;
}

export interface CourseIngestResponse {
  course_id: string;
  status: string;
  chunks_indexed: number;
  message: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  service: string;
  environment: string;
  database: string;
  rag_mode: string;
  default_microservice: string;
}

export interface ConversationSummary {
  id: string;
  service: string;
  title?: string | null;
  share_token?: string | null;
  forked_from?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetailResponse {
  id: string;
  service: string;
  title?: string | null;
  share_token?: string | null;
  forked_from?: string | null;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    sources: SourceCitation[];
    created_at: string;
  }>;
}

export interface ShareResponse {
  conversation_id: string;
  share_token: string;
  share_url: string;
}

export interface SharedConversationDetailResponse {
  id: string;
  share_token: string;
  service: string;
  title?: string | null;
  forked_from?: string | null;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    sources: SourceCitation[];
    created_at: string;
  }>;
}

export interface ErrorResponse {
  code: string;
  message: string;
  request_id: string;
  details?: Record<string, any>;
}

// Authentication Contracts

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface DocumentDetailResponse {
  file: string;
  service: string;
  content: string;
  content_type: string;
  total_lines: number;
  size_bytes: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  description?: string;
  is_default: boolean;
}

export interface ModelsResponse {
  models: ModelInfo[];
  default_model: string;
}

// Knowledge Cafe E-Learning & KT Types

export interface KnowledgeCheck {
  question: string;
  type: string;
  options: string[];
  correct_option_index?: number;
  explanation?: string;
}

export interface LessonSummary {
  id: string;
  lesson_index: number;
  title: string;
  summary: string;
  context_files: string[];
  status?: 'upcoming' | 'current' | 'completed';
  knowledge_check?: KnowledgeCheck;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  current_lesson_index: number;
  completed_lessons: string[];
  overall_progress: number;
  is_completed: boolean;
  knowledge_check_results?: Record<string, any>;
  updated_at: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  target_service: string;
  domain: string;
  target_audience: string;
  difficulty: string;
  estimated_duration: string;
  icon?: string;
  tags?: string[];
  total_lessons: number;
  enrollment?: CourseEnrollment | null;
}

export interface CourseDetail extends CourseSummary {
  lessons: LessonSummary[];
}

export interface LessonDoubt {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  question: string;
  answer: string;
  sources: SourceCitation[];
  created_at: string;
}

export interface LessonDetail {
  course_id: string;
  lesson_id: string;
  lesson_index: number;
  title: string;
  summary: string;
  content: string;
  takeaways: string[];
  sources: SourceCitation[];
  knowledge_check?: KnowledgeCheck;
  doubts: LessonDoubt[];
  is_completed: boolean;
  model: string;
}

export interface CompleteLessonResult {
  enrollment: CourseEnrollment;
  completed_lesson_id: string;
  next_lesson?: LessonSummary;
  is_course_completed: boolean;
}

export interface KnowledgeCheckResult {
  lesson_id: string;
  is_correct: boolean;
  correct_option_index: number;
  explanation: string;
}

export interface EnrollResult {
  enrollment: CourseEnrollment;
  course: CourseDetail;
  current_lesson?: LessonSummary;
}

// ============================================================================
// Saathi — Relationship Continuity Types
// ============================================================================

export type ClientTier =
  | 'Burgundy'
  | 'Burgundy Private'
  | 'NRI Elite'
  | 'Axis Wealth'
  | 'Priority Banking';

export type TransitionStatus =
  | 'initiated'
  | 'customer_review'
  | 'customer_confirmed'
  | 'handover_active'
  | 'completed';

export type ActionPriority = 'high' | 'medium' | 'low';
export type ActionStatus = 'pending' | 'in_progress' | 'completed';

export interface CRMInteraction {
  id: string;
  date: string;
  channel: string;
  rm_name: string;
  summary: string;
  tags: string[];
}

export interface TransitionActionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: ActionPriority;
  status: ActionStatus;
  sla_date: string;
  assigned_to: string;
}

export interface RelationshipBrief {
  client_sentiment: string;
  executive_summary: string;
  family_and_lifestage: string[];
  preferences_and_nuances: string[];
  active_portfolio_summary: string;
  key_discussion_topics: string[];
  conversation_starter: string;
  talking_points: string[];
  synthesized_at: string;
}

export interface CustomerFeedback {
  confirmed_at?: string | null;
  customer_notes?: string | null;
  corrected_items: string[];
  has_verified: boolean;
}

export interface CustomerRelationship {
  id: string;
  name: string;
  tier: ClientTier;
  segment_description: string;
  city: string;
  account_number_masked: string;
  aum_display: string;
  tenure_years: number;
  avatar_color: string;
  previous_rm_name: string;
  previous_rm_role: string;
  transfer_reason: string;
  new_rm_name: string;
  new_rm_role: string;
  new_rm_phone: string;
  new_rm_email: string;
  status: TransitionStatus;
  transition_date: string;
  interactions: CRMInteraction[];
  action_items: TransitionActionItem[];
  brief?: RelationshipBrief | null;
  feedback?: CustomerFeedback | null;
}

export interface CustomerSummaryDTO {
  id: string;
  name: string;
  tier: ClientTier;
  city: string;
  account_number_masked: string;
  aum_display: string;
  tenure_years: number;
  previous_rm_name: string;
  new_rm_name: string;
  status: TransitionStatus;
  transition_date: string;
  avatar_color: string;
  pending_actions_count: number;
}


