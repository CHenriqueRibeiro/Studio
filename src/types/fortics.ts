export interface ForticsAgentInstruction {
  objective: string;
  role: string;
  steps: string[];
}

export interface ForticsAgent {
  id: string;
  name: string;
  description: string;
  audience: string;
  cat: string;
  color: string;
  icon: string;
  emojis: boolean;
  enabled: boolean;
  force_greetings: boolean;
  greetings: string;
  style: string;
  llm: string;
  llm_api_key: string;
  llm_model: string;
  llm_temperature: number;
  ocr_enabled: boolean;
  protected: boolean;
  webchat: boolean;
  template: boolean;
  voice_priority: boolean;
  void_context: boolean;
  tts_id: string;
  media_upload_enabled: boolean;
  offset: string;
  instruction: ForticsAgentInstruction;
  other_rules: string;
}

export interface InstructionsNode {
  id: string;
  type: 'instructions';
  __spec?: boolean;
  __spec_version?: string;
  content: string;
}

export interface CodeNode {
  id: string;
  name: string;
  type: 'code';
  __spec?: boolean;
  __spec_version?: string;
  error_message?: string;
  value: string;
}

export interface HeaderItem {
  key: string;
  value: string;
}

export interface QueryParamItem {
  key: string;
  value: string;
}

export interface RestNode {
  id: string;
  name: string;
  type: 'rest';
  __spec?: boolean;
  __spec_version?: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  uri: string;
  verify_ssl?: boolean;
  body_format?: string;
  credential_id?: string;
  headers?: HeaderItem[];
  params?: string;
  query_params?: QueryParamItem[];
  search_params?: string;
  file_params?: any[];
  body?: string;
}

export interface ConditionNode {
  id: string;
  type: 'condition';
  __spec?: boolean;
  __spec_version?: string;
  condition: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'empty' | 'not_empty';
  left: string;
  right: string;
  then: ForticsFlowNode[];
  else: ForticsFlowNode[];
}

export interface LabelNode {
  id: string;
  name: string;
  type: 'label';
}

export interface GotoNode {
  id: string;
  label: string;
  type: 'goto';
  __spec?: boolean;
  __spec_version?: string;
}

export interface RouteReturnNode {
  id: string;
  type: 'route_return';
  __spec?: boolean;
  __spec_version?: string;
  content_type?: string;
  status_code?: string;
  value: string;
}

export type ForticsFlowNode =
  | InstructionsNode
  | CodeNode
  | RestNode
  | ConditionNode
  | LabelNode
  | GotoNode
  | RouteReturnNode;

export interface ForticsWorkflowOptions {
  abort_keyword: string;
  abort_message: string;
  finish_message: string;
  inactivity_message: string;
  inactivity_warning: string;
  inactivity_warning_time: number;
  timeout: number;
}

export interface ForticsWorkflow {
  id: string;
  name: string;
  enabled: boolean;
  allow_workflow_import: boolean;
  protected: boolean;
  options: ForticsWorkflowOptions;
  flow: ForticsFlowNode[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  location: string;
  fixSuggestion?: string;
}

export interface VariableFlowTrace {
  name: string;
  sourceType: 'sz_context' | 'workflow_code' | 'workflow_rest' | 'agent_captured';
  sourceNodeId?: string;
  consumedBy: string[];
}

export interface ValidationReport {
  isValid: boolean;
  agentScore: number;
  workflowScore: number;
  issues: ValidationIssue[];
  variableTraces: VariableFlowTrace[];
  routingTokensDetected: string[];
  docstringArgsMatched: {
    argName: string;
    inInstructions: boolean;
    inAgentRules: boolean;
  }[];
}

export interface OrderedApiStep {
  id: string;
  order: number;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  pathOrUrl: string;
  requiredInputData?: string;
  requestBodySample?: string;
  responseSample: string;
  outputDataForNextIntegration?: string;
  purposeDescription?: string;
}

export interface ConfiguredWorkflow {
  id: string;
  name: string;
  description?: string;
  curlItems?: CurlItem[];
  sampleResponse?: string;
  filterRules?: string;
  apiCalls?: OrderedApiStep[];
}

export interface CurlItem {
  id: string;
  name: string;
  curl: string;
  treatmentMode?: 'auto_ai' | 'natural_language' | 'target_schema';
  responseSample?: string;
  targetOutputModel?: string; // Modelo de saída desejado (JSON ou texto)
  filterRules?: string; // Instrução em linguagem natural do que extrair/filtrar
  generatedJsCode?: string; // Código JavaScript de tratamento gerado
  nodeName?: string; // e.g. "token", "busca_cadastro", "gravar_agendamento"
  outputVarName?: string; // e.g. "token.token", "dados_cliente.id"
}

export interface EndpointIntegration {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description?: string;
  requestBody?: string;
  responseBody?: string;
  selected: boolean;
  isCustomMidpoint?: boolean;
}

export interface CustomMidpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  description: string;
  isGeneric?: boolean;
}

export interface AuthRouteConfig {
  enabled: boolean;
  authType: 'oauth2_client_credentials' | 'bearer_token_login' | 'api_key_header' | 'basic_auth' | 'custom_endpoint';
  name: string;
  method: 'GET' | 'POST';
  pathOrUrl: string;
  headers?: string;
  requestBodySample?: string;
  tokenExtractionPath: string; // e.g. "access_token" or "token"
  tokenVariableTarget: string; // e.g. "_vars.auth_token"
  headerAppliedToSubsequentCalls: string; // e.g. "Authorization: Bearer {{auth_token}}"
}

export type LLMProvider = 'gemini' | 'openai' | 'anthropic';

export interface GenerationRequest {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  temperature?: number;
  mode: 'new' | 'refactor';
  studioMode?: 'both' | 'workflow_only';
  inputMode?: 'freeform' | 'structured' | 'workflow_driven';
  freeformPrompt?: string;
  businessContext: string;
  naturalAlgorithm?: string;
  naturalSteps?: string;
  naturalRules?: string;
  workflowArchitectureMode?: 'single_pipeline' | 'multiple_modular' | 'single_consolidated';
  authRoute?: AuthRouteConfig;
  apiDocs?: string;
  responseModelSample?: string;
  businessFilters?: string;
  curlItems?: CurlItem[];
  configuredWorkflows?: ConfiguredWorkflow[];
  orderedApiSteps?: OrderedApiStep[];
  selectedIntegrations?: string[];
  customMidpoints?: CustomMidpoint[];
  manualGuidelines1?: string;
  manualGuidelines2?: string;
  existingAgentJson?: string;
  existingWorkflowJson?: string;
  options?: {
    monoSkillEnforced?: boolean;
    antiHallucinationStrict?: boolean;
    includeFencedJsonEntityBlock?: boolean;
    useSZVariables?: boolean;
    customSZVariables?: string;
  };
}

export interface GenerationResponse {
  success: boolean;
  agent: ForticsAgent;
  workflow: ForticsWorkflow;
  workflows?: ForticsWorkflow[]; // Array of separate workflows (e.g. 1. Consultar Cliente, 2. Listar Itens, 3. Registrar)
  summary: string;
  variableChainSummary: string;
  validation: ValidationReport;
  error?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system' | 'workflow';
  text: string;
  timestamp: string;
  fencedJsonPayload?: Record<string, any>;
  workflowExecutionTrace?: {
    nodeId: string;
    nodeType: string;
    nodeName?: string;
    input?: any;
    output?: any;
    status: 'success' | 'error';
  }[];
  routingTokenTriggered?: string;
}
