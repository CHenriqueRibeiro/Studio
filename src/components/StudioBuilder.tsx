import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  Workflow, 
  FileCode2, 
  ArrowUp, 
  ArrowDown, 
  Key, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Lock, 
  Eye, 
  EyeOff,
  Globe,
  Database,
  Bot,
  ListOrdered,
  ShieldCheck,
  Code2,
  HelpCircle,
  FileText,
  Columns,
  Copy,
  Zap,
  BrainCircuit,
  Wrench,
  Edit3
} from 'lucide-react';
import { 
  GenerationRequest, 
  ForticsAgent, 
  ForticsWorkflow, 
  OrderedApiStep, 
  ConfiguredWorkflow,
  AuthRouteConfig,
  CurlItem
} from '../types/fortics';

interface StudioBuilderProps {
  onGenerate: (req: GenerationRequest) => Promise<void>;
  isGenerating: boolean;
  currentAgent: ForticsAgent | null;
  currentWorkflow: ForticsWorkflow | null;
}

export const StudioBuilder: React.FC<StudioBuilderProps> = ({
  onGenerate,
  isGenerating,
}) => {
  // Provider and Keys state
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'anthropic'>(() => {
    return (localStorage.getItem('fortics_llm_provider') as any) || 'gemini';
  });
  
  const [model, setModel] = useState<string>(() => {
    return localStorage.getItem('fortics_llm_model') || 'gemini-3.7-flash';
  });

  const [geminiKey, setGeminiKey] = useState<string>(() => localStorage.getItem('fortics_gemini_key') || '');
  const [openaiKey, setOpenaiKey] = useState<string>(() => localStorage.getItem('fortics_openai_key') || '');
  const [anthropicKey, setAnthropicKey] = useState<string>(() => localStorage.getItem('fortics_anthropic_key') || '');
  const [showApiKeySettings, setShowApiKeySettings] = useState<boolean>(false);
  const [showKeyVisible, setShowKeyVisible] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('fortics_llm_provider', provider);
  }, [provider]);

  useEffect(() => {
    localStorage.setItem('fortics_llm_model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('fortics_gemini_key', geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    localStorage.setItem('fortics_openai_key', openaiKey);
  }, [openaiKey]);

  useEffect(() => {
    localStorage.setItem('fortics_anthropic_key', anthropicKey);
  }, [anthropicKey]);

  const handleProviderChange = (newProvider: 'gemini' | 'openai' | 'anthropic') => {
    setProvider(newProvider);
    if (newProvider === 'gemini') setModel('gemini-3.7-flash');
    else if (newProvider === 'openai') setModel('gpt-4o');
    else if (newProvider === 'anthropic') setModel('claude-3-7-sonnet-20250219');
  };

  // Agent Identification & Role
  const [businessContext, setBusinessContext] = useState<string>(
    'Atendimento Inteligente com consulta de cadastro de clientes e abertura de chamados técnicos com protocolo.'
  );

  // Input Mode: 'freeform' (Prompt Único onde a IA separa Passos e Regras) vs 'structured' (Passos e Regras em caixas separadas)
  const [inputMode, setInputMode] = useState<'freeform' | 'structured'>('freeform');

  // Unified Freeform Prompt
  const [freeformPrompt, setFreeformPrompt] = useState<string>(
`- Cumprimentar o cliente e identificar pelo nome
- Pedir o CPF ou CNPJ do titular do contrato
- Consultar o cadastro do cliente via integração para verificar se o contrato está ativo
- Identificar qual sistema ou módulo apresenta problema
- Coletar a descrição detalhada dos sintomas observados
- Apresentar resumo dos dados e pedir confirmação expressa antes de registrar
- Executar a integração para gravar o chamado no HelpDesk
- Informar o número de protocolo oficial e o prazo de resposta
- Finalizar o atendimento com cordialidade

Regras e Validações de Negócio:
- O CPF deve ser validado e formatado no padrão XXX.XXX.XXX-XX (11 dígitos numéricos)
- O CNPJ deve ser validado no padrão XX.XXX.XXX/XXXX-XX (14 dígitos numéricos)
- Solicitar confirmação expressa do cliente (Sim/Não) com resumo antes de disparar o workflow de gravação
- Não alucinar prazos ou protocolos; repassar estritamente o retornado pela integração
- Se o cliente solicitar atendente humano ou demonstrar insatisfação, retornar SOMENTE a tag #SUPORTE_HUMANO
- Respeitar escopo mono skill e manter foco estrito no atendimento`
  );

  // 1. Steps (O QUE FAZER -> instruction.steps)
  const [naturalSteps, setNaturalSteps] = useState<string>(
`- Cumprimentar o cliente e identificar pelo nome
- Pedir o CPF ou CNPJ do titular do contrato
- Consultar o cadastro do cliente via integração
- Identificar qual sistema ou módulo apresenta problema
- Coletar a descrição detalhada dos sintomas observados
- Apresentar resumo dos dados e pedir confirmação expressa antes de registrar
- Executar a integração para gravar o chamado no HelpDesk
- Informar o número de protocolo oficial e o prazo de resposta
- Finalizar o atendimento com cordialidade`
  );

  // 2. Rules & Validations (COMO FAZER -> other_rules)
  const [naturalRules, setNaturalRules] = useState<string>(
`- O CPF deve ser validado e formatado no padrão XXX.XXX.XXX-XX ou apenas 11 dígitos numéricos
- O CNPJ deve ser validado no padrão XX.XXX.XXX/XXXX-XX ou apenas 14 dígitos numéricos
- Solicitar confirmação expressa do cliente (Sim/Não) com resumo antes de disparar o workflow
- Não alucinar prazos ou protocolos; repassar estritamente o retornado pela integração
- Se o cliente solicitar atendente humano ou demonstrar insatisfação, retornar SOMENTE #SUPORTE_HUMANO
- Respeitar escopo mono skill e manter foco estrito no atendimento de suporte`
  );

  // Sync helpers between freeform prompt and structured steps/rules
  const handleFreeformPromptChange = (text: string) => {
    setFreeformPrompt(text);
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const stepsList: string[] = [];
    const rulesList: string[] = [];
    let isRuleSection = false;

    lines.forEach(line => {
      const lineLower = line.toLowerCase();
      if (lineLower.includes('regra') || lineLower.includes('validação') || lineLower.includes('diretrizes') || lineLower.includes('como fazer') || lineLower.includes('outras regras')) {
        isRuleSection = true;
        return;
      }
      if (lineLower.includes('passo') || lineLower.includes('o que fazer') || lineLower.includes('fluxo') || lineLower.includes('etapa')) {
        isRuleSection = false;
        return;
      }

      if (isRuleSection) {
        rulesList.push(line.startsWith('-') ? line : `- ${line}`);
      } else {
        stepsList.push(line.startsWith('-') ? line : `- ${line}`);
      }
    });

    if (stepsList.length > 0) setNaturalSteps(stepsList.join('\n'));
    if (rulesList.length > 0) setNaturalRules(rulesList.join('\n'));
  };

  const handleStructuredStepsChange = (text: string) => {
    setNaturalSteps(text);
    setFreeformPrompt(`PASSOS DO ATENDIMENTO:\n${text}\n\nREGRAS E VALIDAÇÕES:\n${naturalRules}`);
  };

  const handleStructuredRulesChange = (text: string) => {
    setNaturalRules(text);
    setFreeformPrompt(`PASSOS DO ATENDIMENTO:\n${naturalSteps}\n\nREGRAS E VALIDAÇÕES:\n${text}`);
  };

  // 3. Workflows with nested API integrations
  const [configuredWorkflows, setConfiguredWorkflows] = useState<ConfiguredWorkflow[]>([
    {
      id: 'wf-1',
      name: 'Consultar Cadastro do Cliente',
      description: 'Consulta os dados cadastrais do titular e valida status do contrato',
      apiCalls: [
        {
          id: 'step-1-1',
          order: 1,
          name: 'Consultar Cadastro por CPF',
          method: 'GET',
          pathOrUrl: 'https://api.empresa.com.br/v1/clientes/{cpf}',
          requiredInputData: 'cpf (coletado do cliente no chat)',
          requestBodySample: '',
          responseSample: `{\n  "cliente_id": "CLI-89021",\n  "nome": "Tech Solutions Ltda",\n  "status": "ATIVO",\n  "plano": "Enterprise"\n}`,
          outputDataForNextIntegration: 'cliente_id (necessário para abrir o chamado) e status',
          purposeDescription: 'Verifica se o cliente está ativo e obtém o ID do cliente.'
        }
      ]
    }
  ]);

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('wf-1');

  // Workflow Architecture Mode
  const [workflowArchitectureMode, setWorkflowArchitectureMode] = useState<'multiple_modular' | 'single_consolidated'>('multiple_modular');

  // Optional Auth Route
  const [authRoute, setAuthRoute] = useState<AuthRouteConfig>({
    enabled: false,
    authType: 'bearer_token_login',
    name: 'Autenticação / Token de Acesso',
    method: 'POST',
    pathOrUrl: 'https://api.empresa.com.br/oauth/token',
    headers: 'Content-Type: application/json',
    requestBodySample: `{\n  "client_id": "{{FORTICS_CLIENT_ID}}",\n  "client_secret": "{{FORTICS_CLIENT_SECRET}}"\n}`,
    tokenExtractionPath: 'access_token',
    tokenVariableTarget: '_vars.auth_token',
    headerAppliedToSubsequentCalls: 'Authorization: Bearer {{auth_token}}'
  });

  const [showAuthSection, setShowAuthSection] = useState<boolean>(false);

  // Technical API Documentation / Swagger / cURL / Postman / Raw Endpoints & Sample Responses
  const [apiDocs, setApiDocs] = useState<string>('');
  const [responseModelSample, setResponseModelSample] = useState<string>('');
  const [businessFilters, setBusinessFilters] = useState<string>('');
  const [showApiDocsSection, setShowApiDocsSection] = useState<boolean>(true);
  const [curlEntryMode, setCurlEntryMode] = useState<'cards' | 'raw_unified'>('cards');
  const [curlList, setCurlList] = useState<CurlItem[]>([
    {
      id: 'curl-1',
      name: '1. Buscar Cliente por CPF / Documento',
      curl: "curl --location 'https://gogenier.pertec.net.br:8002/api/clientes/buscar?cpf=07395837355' \\\n--header 'Authorization: Bearer l1nR4i4JqPdErQJRDrZ-CMUCLlTJTte3gBS-3kmuRE6LHLMMZNxPqVxxT-pfb6Up'",
      responseSample: '{\n  "result": {\n    "items": [\n      {\n        "id": 1,\n        "crm": 7308,\n        "nin": "07674944905",\n        "name": "Bruno Diniz - CLINIC",\n        "specialist": "Físico médico",\n        "sector": "CAIXA"\n      }\n    ]\n  }\n}',
      filterRules: 'Extrair o ID do cliente, nome e especialidade para exibir na conversa antes de invocar a próxima chamada.'
    }
  ]);

  const handleAddCurlItem = () => {
    const nextIdx = curlList.length + 1;
    setCurlList(prev => [
      ...prev,
      {
        id: `curl-${Date.now()}`,
        name: `${nextIdx}. Nova Integração / cURL`,
        curl: '',
        responseSample: '',
        filterRules: ''
      }
    ]);
  };

  const handleDuplicateCurlItem = (item: CurlItem) => {
    const nextIdx = curlList.length + 1;
    setCurlList(prev => [
      ...prev,
      {
        id: `curl-${Date.now()}`,
        name: `${nextIdx}. ${item.name} (Cópia)`,
        curl: item.curl,
        responseSample: item.responseSample,
        filterRules: item.filterRules
      }
    ]);
  };

  const handleRemoveCurlItem = (id: string) => {
    if (curlList.length <= 1) {
      setCurlList([
        {
          id: `curl-${Date.now()}`,
          name: '1. Integração / cURL',
          curl: '',
          responseSample: '',
          filterRules: ''
        }
      ]);
      return;
    }
    setCurlList(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateCurlItem = (id: string, field: keyof CurlItem, value: string) => {
    setCurlList(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Workflow Management
  const handleAddWorkflow = () => {
    const nextIdx = configuredWorkflows.length + 1;
    const newWf: ConfiguredWorkflow = {
      id: `wf-${Date.now()}`,
      name: `Novo Workflow ${nextIdx}`,
      description: `Finalidade do workflow ${nextIdx}`,
      apiCalls: [
        {
          id: `step-${Date.now()}`,
          order: 1,
          name: `API de ${nextIdx === 2 ? 'Registro' : 'Operação'}`,
          method: nextIdx === 2 ? 'POST' : 'GET',
          pathOrUrl: 'https://api.empresa.com.br/v1/endpoint',
          requiredInputData: 'parâmetros coletados no chat',
          requestBodySample: '{\n  "campo": "{{request.campo}}"\n}',
          responseSample: '{\n  "status": "sucesso",\n  "protocolo": "2026-001"\n}',
          purposeDescription: 'Execução de integração da ferramenta'
        }
      ]
    };
    setConfiguredWorkflows(prev => [...prev, newWf]);
    setSelectedWorkflowId(newWf.id);
  };

  const handleRemoveWorkflow = (wfId: string) => {
    if (configuredWorkflows.length <= 1) {
      alert('É necessário ter ao menos 1 workflow configurado.');
      return;
    }
    const remaining = configuredWorkflows.filter(w => w.id !== wfId);
    setConfiguredWorkflows(remaining);
    if (selectedWorkflowId === wfId) {
      setSelectedWorkflowId(remaining[0].id);
    }
  };

  const handleUpdateWorkflowInfo = (wfId: string, field: 'name' | 'description', value: string) => {
    setConfiguredWorkflows(prev =>
      prev.map(w => (w.id === wfId ? { ...w, [field]: value } : w))
    );
  };

  // API Call Management inside Selected Workflow
  const handleAddApiCall = (wfId: string) => {
    setConfiguredWorkflows(prev =>
      prev.map(w => {
        if (w.id !== wfId) return w;
        const newOrder = w.apiCalls.length + 1;
        const newStep: OrderedApiStep = {
          id: `call-${Date.now()}`,
          order: newOrder,
          name: `Integração REST ${newOrder}`,
          method: 'GET',
          pathOrUrl: 'https://api.empresa.com.br/v1/rota',
          requiredInputData: 'parâmetros coletados',
          requestBodySample: '',
          responseSample: '{\n  "status": "sucesso"\n}',
          purposeDescription: 'Execução de chamada REST'
        };
        return { ...w, apiCalls: [...w.apiCalls, newStep] };
      })
    );
  };

  const handleRemoveApiCall = (wfId: string, callId: string) => {
    setConfiguredWorkflows(prev =>
      prev.map(w => {
        if (w.id !== wfId) return w;
        const filtered = w.apiCalls.filter(c => c.id !== callId);
        return {
          ...w,
          apiCalls: filtered.map((c, idx) => ({ ...c, order: idx + 1 }))
        };
      })
    );
  };

  const handleUpdateApiCall = (
    wfId: string,
    callId: string,
    field: keyof OrderedApiStep,
    value: any
  ) => {
    setConfiguredWorkflows(prev =>
      prev.map(w => {
        if (w.id !== wfId) return w;
        return {
          ...w,
          apiCalls: w.apiCalls.map(c => (c.id === callId ? { ...c, [field]: value } : c))
        };
      })
    );
  };

  const handleMoveApiCall = (wfId: string, index: number, direction: 'up' | 'down') => {
    setConfiguredWorkflows(prev =>
      prev.map(w => {
        if (w.id !== wfId) return w;
        const newCalls = [...w.apiCalls];
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= newCalls.length) return w;
        const temp = newCalls[index];
        newCalls[index] = newCalls[targetIdx];
        newCalls[targetIdx] = temp;
        return {
          ...w,
          apiCalls: newCalls.map((c, idx) => ({ ...c, order: idx + 1 }))
        };
      })
    );
  };

  const [studioMode, setStudioMode] = useState<'both' | 'workflow_only' | 'agent_only'>('both');
  const [agentToolsInput, setAgentToolsInput] = useState<string>(
    'consultar_cadastro(cpf): Consulta os dados cadastrais do cliente\nemitir_segunda_via(id_contrato): Gera a 2ª via da fatura'
  );
  const [agentTransferTag, setAgentTransferTag] = useState<string>('#SUPORTE_HUMANO');

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let activeKey: string | undefined = undefined;
    if (provider === 'openai') {
      activeKey = openaiKey.trim();
      if (!activeKey) {
        alert('Por favor, informe sua chave OpenAI API (sk-...) nas configurações.');
        setShowApiKeySettings(true);
        return;
      }
    } else if (provider === 'anthropic') {
      activeKey = anthropicKey.trim();
      if (!activeKey) {
        alert('Por favor, informe sua chave Anthropic API (sk-ant-...) nas configurações.');
        setShowApiKeySettings(true);
        return;
      }
    } else if (provider === 'gemini' && geminiKey.trim()) {
      activeKey = geminiKey.trim();
    }

    const combinedAlgorithm = `PASSOS (O QUE FAZER):\n${naturalSteps}\n\nREGRAS (COMO FAZER):\n${naturalRules}${studioMode === 'agent_only' && agentTransferTag ? `\n- Se o cliente solicitar atendente humano, use a tag ${agentTransferTag}` : ''}`;

    // Flatten all API calls for backward compatibility
    const flatApiSteps: OrderedApiStep[] = [];
    let currentGlobalOrder = 1;
    configuredWorkflows.forEach(wf => {
      wf.apiCalls.forEach(call => {
        flatApiSteps.push({
          ...call,
          order: currentGlobalOrder++
        });
      });
    });

    await onGenerate({
      provider,
      model,
      apiKey: activeKey,
      temperature: 0.0,
      mode: 'new',
      studioMode,
      inputMode,
      freeformPrompt: studioMode === 'agent_only' && agentToolsInput.trim()
        ? `${freeformPrompt}\n\nFERRAMENTAS/TOOLS QUE O AGENTE POSSUI:\n${agentToolsInput}\nTAG DE TRANSBORDO: ${agentTransferTag}`
        : freeformPrompt,
      businessContext,
      naturalAlgorithm: combinedAlgorithm,
      naturalSteps,
      naturalRules,
      workflowArchitectureMode,
      authRoute: authRoute.enabled ? authRoute : undefined,
      apiDocs: apiDocs.trim() ? apiDocs : undefined,
      responseModelSample: responseModelSample.trim() ? responseModelSample : undefined,
      businessFilters: businessFilters.trim() ? businessFilters : undefined,
      curlItems: curlList.filter(c => c.curl.trim() || c.responseSample?.trim() || c.filterRules?.trim()),
      configuredWorkflows,
      orderedApiSteps: flatApiSteps,
      options: {
        monoSkillEnforced: true,
        antiHallucinationStrict: true,
        useSZVariables: false,
        customSZVariables: '{{nome}}, {{telefone}}, {{cpf}}',
        includeFencedJsonEntityBlock: true
      }
    });
  };

  const activeWorkflow = configuredWorkflows.find(w => w.id === selectedWorkflowId) || configuredWorkflows[0];

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-w-full">
      
      {/* 0. Studio Mode Switcher: Agente + Workflow vs Apenas Workflow vs Apenas Agente */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setStudioMode('both')}
          className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 ${
            studioMode === 'both'
              ? 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/50'
              : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <div className={`p-2 rounded-lg ${studioMode === 'both' ? 'bg-white/20' : 'bg-slate-800 text-emerald-400'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">Agente + Workflows</div>
            <div className={`text-[10px] truncate ${studioMode === 'both' ? 'text-emerald-100' : 'text-slate-500'}`}>
              Criação & Integração Completa
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStudioMode('workflow_only')}
          className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 ${
            studioMode === 'workflow_only'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50'
              : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <div className={`p-2 rounded-lg ${studioMode === 'workflow_only' ? 'bg-white/20' : 'bg-slate-800 text-cyan-400'}`}>
            <Zap className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">Apenas Workflows & APIs</div>
            <div className={`text-[10px] truncate ${studioMode === 'workflow_only' ? 'text-cyan-100' : 'text-slate-500'}`}>
              Nós REST, cURLs, Modelos & JSON
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStudioMode('agent_only')}
          className={`p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3 ${
            studioMode === 'agent_only'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-400/50'
              : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <div className={`p-2 rounded-lg ${studioMode === 'agent_only' ? 'bg-white/20' : 'bg-slate-800 text-indigo-400'}`}>
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">Apenas Agente Fortics</div>
            <div className={`text-[10px] truncate ${studioMode === 'agent_only' ? 'text-indigo-100' : 'text-slate-500'}`}>
              Prompt, Steps, Rules, Tools & Tags
            </div>
          </div>
        </button>
      </div>

      {/* 1. Top Bar: Title & Model Selector Settings */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {studioMode === 'both' && <Sparkles className="w-5 h-5 text-emerald-400" />}
            {studioMode === 'workflow_only' && <Zap className="w-5 h-5 text-cyan-400" />}
            {studioMode === 'agent_only' && <BrainCircuit className="w-5 h-5 text-indigo-400" />}
            <span>
              {studioMode === 'both' && 'Configuração Integrada: Agente & Workflows'}
              {studioMode === 'workflow_only' && 'Configurador & Editor de Workflows Fortics'}
              {studioMode === 'agent_only' && 'Configurador & Editor de Agente Fortics'}
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            {studioMode === 'both' && 'Defina o papel do bot, os passos de atendimento e os Workflows com suas APIs interligadas.'}
            {studioMode === 'workflow_only' && 'Desenhe nós REST, rotas de autenticação, cURLs com modelos de resposta e gere arquivos .json de workflows.'}
            {studioMode === 'agent_only' && 'Defina instruções (steps), regras de validação (other_rules), transbordo (#SUPORTE_HUMANO) e gere o agente.json.'}
          </p>
        </div>

        {/* Engine Quick Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleProviderChange('gemini')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                provider === 'gemini' 
                  ? 'bg-emerald-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Gemini
            </button>
            <button
              type="button"
              onClick={() => handleProviderChange('openai')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                provider === 'openai' 
                  ? 'bg-indigo-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              OpenAI
            </button>
            <button
              type="button"
              onClick={() => handleProviderChange('anthropic')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                provider === 'anthropic' 
                  ? 'bg-amber-600 text-white font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Claude
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowApiKeySettings(!showApiKeySettings)}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Configurar chaves de API personalizadas"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Optional Custom API Keys Dropdown */}
      {showApiKeySettings && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Chaves de API Personalizadas (Opcional)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowKeyVisible(!showKeyVisible)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              {showKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showKeyVisible ? 'Ocultar' : 'Mostrar'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Gemini API Key (ou usa padrão)</label>
              <input
                type={showKeyVisible ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">OpenAI API Key (para GPT-4o)</label>
              <input
                type={showKeyVisible ? 'text' : 'password'}
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Anthropic Key (para Claude)</label>
              <input
                type={showKeyVisible ? 'text' : 'password'}
                value={anthropicKey}
                onChange={e => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Objetivo Geral */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          {studioMode === 'workflow_only' && 'Propósito / Contexto dos Workflows'}
          {studioMode === 'agent_only' && 'Papel & Objetivo Principal do Agente'}
          {studioMode === 'both' && 'Objetivo e Papel do Agente'}
        </label>
        <input
          type="text"
          value={businessContext}
          onChange={e => setBusinessContext(e.target.value)}
          placeholder={
            studioMode === 'workflow_only'
              ? 'Ex: Integração REST para consulta de cadastro e emissão de fatura...'
              : 'Ex: Atendimento Inteligente para Consulta de Débitos e Emissão de 2ª Via de Fatura...'
          }
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          required
        />
      </div>

      {/* 3. SEÇÃO DO AGENTE (Exibida em modo 'both' e 'agent_only') */}
      {studioMode !== 'workflow_only' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-indigo-400" />
              <span>Instruções & Regras do Agente</span>
            </label>

            {/* Alternador de Modo: Texto Livre Único vs Passos & Regras Separados */}
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('freeform')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'freeform'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Texto Livre (com IA)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('structured')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'structured'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Passos & Regras (Separados)</span>
                </button>
              </div>

              <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
                Padrão Oficial Fortics
              </span>
            </div>
          </div>

          {/* Renderização de acordo com o modo selecionado */}
          {inputMode === 'freeform' ? (
            /* Modo Texto Livre Único */
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-emerald-400" />
                  <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Instruções Gerais do Atendimento (Texto Livre)
                  </label>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-mono">
                  Separação inteligente de Passos & Regras
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Escreva livremente como o bot deve atender. A IA identifica automaticamente o que são os <strong>Passos (o que fazer)</strong> e as <strong>Regras (como fazer)</strong>.
              </p>
              <textarea
                rows={10}
                value={freeformPrompt}
                onChange={e => handleFreeformPromptChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                placeholder="Exemplo: Cumprimentar o cliente, solicitar CPF/CNPJ, consultar cadastro no sistema, listar contratos ativos e emitir segunda via se solicitado. Regras: validar CPF com 11 dígitos, pedir confirmação expressa antes de gravar e retornar #SUPORTE_HUMANO se o cliente pedir atendente..."
                required={studioMode !== 'workflow_only'}
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                <span>Dica: Use palavras como "Passos" e "Regras" ou tópicos com hífen (-) para orientar o fluxo.</span>
                <span>{freeformPrompt.length} caracteres</span>
              </div>
            </div>
          ) : (
            /* Modo Campos Separados Estruturados */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Passos do Agente */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-emerald-400" />
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Passos do Agente (O que fazer)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">instruction.steps</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Escreva cada ação em uma linha. O gerador compilará no padrão limpo sem números nem prefixos.
                </p>
                <textarea
                  rows={8}
                  value={naturalSteps}
                  onChange={e => handleStructuredStepsChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="- Cumprimentar o cliente e identificar pelo nome&#10;- Pedir o CPF ou CNPJ do titular&#10;- Consultar o cadastro via integração&#10;- Confirmar os dados antes de prosseguir..."
                  required={studioMode !== 'workflow_only'}
                />
              </div>

              {/* Regras e Validações */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Regras & Validações (Como fazer)
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">other_rules</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Regras de validação (CPF/CNPJ), confirmação expressa antes de gravar, tags de transbordo (#SUPORTE_HUMANO).
                </p>
                <textarea
                  rows={8}
                  value={naturalRules}
                  onChange={e => handleStructuredRulesChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="- Validar CPF no padrão XXX.XXX.XXX-XX&#10;- Pedir confirmação expressa antes de gravar&#10;- Se solicitar atendente, retornar #SUPORTE_HUMANO..."
                  required={studioMode !== 'workflow_only'}
                />
              </div>

            </div>
          )}

          {/* Seção Exclusiva de Tools & Transbordo em Modo 'agent_only' */}
          {studioMode === 'agent_only' && (
            <div className="bg-slate-900/70 border border-indigo-500/30 rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Ferramentas (Tools) & Tags de Transbordo
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Tools/Workflows que o Agente pode chamar</span>
                    <span className="text-[10px] text-slate-500 font-mono">agent.tools</span>
                  </label>
                  <textarea
                    rows={4}
                    value={agentToolsInput}
                    onChange={e => setAgentToolsInput(e.target.value)}
                    placeholder="consultar_cadastro(cpf): Consulta dados cadastrais&#10;emitir_segunda_via(id_contrato): Gera 2ª via da fatura"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-indigo-200 font-mono leading-relaxed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    A IA gerará as definições de schema de tools e as orientações no prompt para quando o bot deve chamá-las.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span>Tag de Transbordo para Atendente Humano</span>
                    <span className="text-[10px] text-slate-500 font-mono">tag de transbordo</span>
                  </label>
                  <input
                    type="text"
                    value={agentTransferTag}
                    onChange={e => setAgentTransferTag(e.target.value)}
                    placeholder="#SUPORTE_HUMANO"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400">
                    Tag enviada pelo Agente quando o cliente pede suporte humano ou quando os dados não puderem ser resolvidos.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. WORKFLOWS & INTEGRAÇÕES DE API (cURL por cURL) (Exibido em modo 'both' e 'workflow_only') */}
      {studioMode !== 'agent_only' && (
        <div className="space-y-4 pt-2">
          
          {/* Header da Seção de cURLs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Workflow className="w-4.5 h-4.5" />
                <span>Workflows & Integrações de API (cURL por cURL)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Cadastre cada integração individualmente: informe o cURL, o modelo de resposta JSON e o que precisa ser extraído.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddCurlItem}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar cURL</span>
            </button>
          </div>

          {/* Informative cURL-First Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-cyan-950/30 border border-cyan-900/50 text-xs text-cyan-200">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Mapeamento Direto para Workflows Fortics:</strong> Cada item abaixo gerará um Workflow Fortics completo com nó <code className="text-cyan-300 font-mono">instructions</code>, nó Code <code className="text-indigo-300 font-mono">request</code>, nó <code className="text-cyan-300 font-mono">REST</code> com headers/token e nó Code <code className="text-emerald-300 font-mono">tratar_dados</code> com as extrações e filtros especificados.
            </p>
          </div>

          {/* Lista de Cards cURL */}
          <div className="space-y-4">
            {curlList.map((item, idx) => (
              <div
                key={item.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all shadow-sm"
              >
                {/* Header do Card cURL */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-2.5 py-1 rounded-md">
                      cURL #{idx + 1}
                    </span>
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => handleUpdateCurlItem(item.id, 'name', e.target.value)}
                      placeholder="Nome da Chamada (ex: Buscar Cliente por CPF)"
                      className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg text-xs font-bold text-slate-100 focus:outline-none px-2.5 py-1 flex-1 min-w-[160px]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicateCurlItem(item)}
                      title="Duplicar este cURL"
                      className="px-2.5 py-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicar</span>
                    </button>
                    {curlList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCurlItem(item.id)}
                        title="Remover este cURL"
                        className="px-2.5 py-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-900/50 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Campo 1: Comando cURL */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    Comando cURL da API
                  </label>
                  <textarea
                    rows={4}
                    value={item.curl}
                    onChange={e => handleUpdateCurlItem(item.id, 'curl', e.target.value)}
                    placeholder="curl --location 'https://api.empresa.com.br/v1/clientes?cpf=07395837355' \&#10;--header 'Authorization: Bearer seu_token_aqui'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-cyan-200 font-mono leading-relaxed focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                    required={studioMode !== 'agent_only'}
                  />
                </div>

                {/* Grid: Modelo de Resposta JSON + Regras de Filtro */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* Modelo de Resposta */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Modelo de Resposta da API (JSON de Exemplo)
                    </label>
                    <textarea
                      rows={6}
                      value={item.responseSample || ''}
                      onChange={e => handleUpdateCurlItem(item.id, 'responseSample', e.target.value)}
                      placeholder={`{\n  "result": {\n    "items": [\n      {\n        "id": 1,\n        "crm": 7308,\n        "nin": "07674944905",\n        "name": "Bruno Diniz - CLINIC",\n        "specialist": "Físico médico"\n      }\n    ]\n  }\n}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-emerald-200 font-mono leading-relaxed focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Regras de Filtro / Extração */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      O que precisa extrair / Filtros / Regras
                    </label>
                    <textarea
                      rows={6}
                      value={item.filterRules || ''}
                      onChange={e => handleUpdateCurlItem(item.id, 'filterRules', e.target.value)}
                      placeholder="Exemplo:&#10;- Extrair o ID do cliente, nome e especialidade para confirmar no chat antes da próxima chamada&#10;- Filtrar apenas contratos com status ATIVO&#10;- Descartar campos internos irrelevantes para o bot"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-amber-200 font-mono leading-relaxed focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                </div>

              </div>
            ))}
          </div>

          {/* Botão de Adicionar cURL no final da lista */}
          <button
            type="button"
            onClick={handleAddCurlItem}
            className="w-full py-3 rounded-2xl border border-dashed border-cyan-800 hover:border-cyan-400 hover:bg-cyan-950/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Adicionar outro cURL / Endpoint</span>
          </button>

        </div>
      )}

      {/* 5. Arquitetura de Workflows Fortics */}
      {studioMode !== 'agent_only' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Arquitetura de Exportação dos Workflows
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              {workflowArchitectureMode === 'multiple_modular' ? 'Múltiplos Workflows (.json)' : 'Workflow Único'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setWorkflowArchitectureMode('multiple_modular')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                workflowArchitectureMode === 'multiple_modular'
                  ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/30 text-white'
                  : 'bg-slate-950/50 border-slate-800 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5" />
                  <span>Workflows Modulares (Recomendado)</span>
                </span>
                {workflowArchitectureMode === 'multiple_modular' && (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Gera 1 workflow isolado para cada operação cadastrada acima, facilitando o download e importação direta.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setWorkflowArchitectureMode('single_consolidated')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                workflowArchitectureMode === 'single_consolidated'
                  ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/30 text-white'
                  : 'bg-slate-950/50 border-slate-800 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>Workflow Único Consolidado</span>
                </span>
                {workflowArchitectureMode === 'single_consolidated' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Gera todas as chamadas em sequência em um único arquivo de workflow integrado.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* 6. Botão de Ação Principal */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isGenerating}
          className={`w-full py-4 px-6 rounded-2xl text-white font-black text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            studioMode === 'workflow_only'
              ? 'bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-950/50'
              : studioMode === 'agent_only'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-950/50'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-500 hover:to-cyan-500 shadow-emerald-950/50'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>
                {studioMode === 'workflow_only' && 'Gerando Workflows Fortics (.json)...'}
                {studioMode === 'agent_only' && 'Gerando Agente Fortics (.json)...'}
                {studioMode === 'both' && 'Gerando Agente e Workflows Fortics...'}
              </span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <span>
                {studioMode === 'workflow_only' && 'Gerar Workflows & Integrações (.json)'}
                {studioMode === 'agent_only' && 'Gerar Agente Fortics (.json)'}
                {studioMode === 'both' && 'Gerar Agente e Workflows Fortics'}
              </span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
