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
  Edit3,
  Bookmark,
  Check,
  Server
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
import { TEMPLATES_LIBRARY } from '../data/forticsStandards';

export const PROVIDER_MODELS: Record<'gemini' | 'openai' | 'anthropic', Array<{ id: string; name: string; tag?: string }>> = {
  openai: [
    { id: 'gpt-5.6-sol', name: 'gpt-5.6-sol', tag: '🧠 Máxima capacidade | ⭐⭐⭐⭐⭐' },
    { id: 'gpt-5.6-terra', name: 'gpt-5.6-terra', tag: '⚖️ Inteligência + custo | ⭐⭐⭐⭐⭐' },
    { id: 'gpt-5.6-luna', name: 'gpt-5.6-luna', tag: '🚀 Alto volume + custo | ⭐⭐⭐⭐⭐' },
    { id: 'gpt-5.5', name: 'gpt-5.5', tag: 'Muito poderoso | ⭐⭐⭐⭐⭐' },
    { id: 'gpt-5.4', name: 'gpt-5.4', tag: 'Excelente equilíbrio | ⭐⭐⭐⭐⭐' },
    { id: 'gpt-5.4-mini', name: 'gpt-5.4-mini', tag: 'Rápido e barato | ⭐⭐⭐⭐' },
    { id: 'gpt-5.4-nano', name: 'gpt-5.4-nano', tag: 'Extremamente econômico | ⭐⭐⭐' },
    { id: 'gpt-5.5-pro', name: 'gpt-5.5-pro', tag: 'Raciocínio avançado | ⭐⭐⭐⭐' },
    { id: 'gpt-5.4-pro', name: 'gpt-5.4-pro', tag: 'Raciocínio avançado | ⭐⭐⭐⭐' },
    { id: 'chat-latest', name: 'chat-latest', tag: 'Otimizado para chat | ⭐⭐⭐⭐⭐' }
  ],
  anthropic: [
    { id: 'claude-opus-5', name: 'claude-opus-5', tag: 'Máximo raciocínio/qualidade | ⭐⭐⭐⭐⭐' },
    { id: 'claude-opus-4-8', name: 'claude-opus-4-8', tag: 'Raciocínio avançado | ⭐⭐⭐⭐⭐' },
    { id: 'claude-opus-4-7', name: 'claude-opus-4-7', tag: 'Agentes complexos | ⭐⭐⭐⭐⭐' },
    { id: 'claude-opus-4-6', name: 'claude-opus-4-6', tag: 'Agentes + contexto longo | ⭐⭐⭐⭐⭐' },
    { id: 'claude-sonnet-5', name: 'claude-sonnet-5', tag: 'Melhor equilíbrio geral | ⭐⭐⭐⭐⭐' },
    { id: 'claude-sonnet-4-6', name: 'claude-sonnet-4-6', tag: 'Produção / chatbot | ⭐⭐⭐⭐⭐' },
    { id: 'claude-sonnet-4-5', name: 'claude-sonnet-4-5', tag: 'Chat + ferramentas | ⭐⭐⭐⭐' },
    { id: 'claude-haiku-4-5', name: 'claude-haiku-4-5', tag: 'Alta velocidade / baixo custo | ⭐⭐⭐⭐' },
    { id: 'claude-opus-4-5', name: 'claude-opus-4-5', tag: 'Raciocínio avançado | ⭐⭐⭐⭐⭐' },
    { id: 'claude-sonnet-4', name: 'claude-sonnet-4', tag: 'Legado | ⭐⭐⭐⭐' }
  ],
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tag: 'Padrão Localhost Rápido' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tag: 'Raciocínio de Ponta' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tag: 'Geração Rápida' },
    { id: 'gemini-2.0-flash-thinking-exp-01-21', name: 'Gemini 2.0 Flash Thinking', tag: 'Raciocínio Explicativo' },
    { id: 'gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro Exp', tag: 'Experimental' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tag: '2 Milhões Contexto' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tag: 'Estável' },
    { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', tag: 'Micro' },
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', tag: 'Preview' }
  ]
};

interface StudioBuilderProps {
  onGenerate: (req: GenerationRequest) => Promise<void>;
  isGenerating: boolean;
  currentAgent: ForticsAgent | null;
  currentWorkflow: ForticsWorkflow | null;
  onSelectExternalTemplate?: (templateId: string) => void;
}

export const StudioBuilder: React.FC<StudioBuilderProps> = ({
  onGenerate,
  isGenerating,
}) => {
  // Provider and Keys state backed by sessionStorage (with fallback to localStorage)
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'anthropic'>(() => {
    return (sessionStorage.getItem('fortics_llm_provider') as any) ||
      (localStorage.getItem('fortics_llm_provider') as any) ||
      'gemini';
  });

  const [model, setModel] = useState<string>(() => {
    return sessionStorage.getItem('fortics_llm_model') ||
      localStorage.getItem('fortics_llm_model') ||
      'gemini-2.5-flash';
  });

  const [geminiKey, setGeminiKey] = useState<string>(() =>
    sessionStorage.getItem('fortics_gemini_key') || localStorage.getItem('fortics_gemini_key') || ''
  );
  const [openaiKey, setOpenaiKey] = useState<string>(() =>
    sessionStorage.getItem('fortics_openai_key') || localStorage.getItem('fortics_openai_key') || ''
  );
  const [anthropicKey, setAnthropicKey] = useState<string>(() =>
    sessionStorage.getItem('fortics_anthropic_key') || localStorage.getItem('fortics_anthropic_key') || ''
  );
  const [showApiKeySettings, setShowApiKeySettings] = useState<boolean>(false);
  const [showKeyVisible, setShowKeyVisible] = useState<boolean>(false);

  // Sync to sessionStorage & localStorage
  useEffect(() => {
    sessionStorage.setItem('fortics_llm_provider', provider);
    localStorage.setItem('fortics_llm_provider', provider);
  }, [provider]);

  useEffect(() => {
    sessionStorage.setItem('fortics_llm_model', model);
    localStorage.setItem('fortics_llm_model', model);
  }, [model]);

  useEffect(() => {
    sessionStorage.setItem('fortics_gemini_key', geminiKey);
    localStorage.setItem('fortics_gemini_key', geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    sessionStorage.setItem('fortics_openai_key', openaiKey);
    localStorage.setItem('fortics_openai_key', openaiKey);
  }, [openaiKey]);

  useEffect(() => {
    sessionStorage.setItem('fortics_anthropic_key', anthropicKey);
    localStorage.setItem('fortics_anthropic_key', anthropicKey);
  }, [anthropicKey]);

  const handleProviderChange = (newProvider: 'gemini' | 'openai' | 'anthropic') => {
    setProvider(newProvider);
    const defaultModel = PROVIDER_MODELS[newProvider][0].id;
    setModel(defaultModel);
  };

  // Agent Identification & Role
  const [businessContext, setBusinessContext] = useState<string>(
    'Atendimento Inteligente com consulta de cadastro de clientes e abertura de chamados técnicos com protocolo.'
  );

  // Input Mode: 'freeform' (Prompt Único onde a IA separa Passos e Regras) vs 'structured' (Passos e Regras em caixas separadas)
  const [inputMode, setInputMode] = useState<'freeform' | 'structured' | 'workflow_driven'>('workflow_driven');

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
  const [naturalRules, setNaturalRules] = useState<string>('');

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
      curl: "curl --location 'https://api.exemplo.com.br/v1/clientes/buscar?cpf=07395837355' \\\n--header 'Authorization: Bearer seu_token_jwt_aqui'",
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

  const [treatmentToast, setTreatmentToast] = useState<{ id: string; text: string } | null>(null);

  const showTreatmentToast = (id: string, text: string) => {
    setTreatmentToast({ id, text });
    setTimeout(() => setTreatmentToast(null), 3500);
  };

  const getDetectedKeysFromSample = (sampleJson?: string) => {
    if (!sampleJson || !sampleJson.trim()) return { arrayField: '', objectField: '', keys: [] };
    try {
      const parsed = JSON.parse(sampleJson.trim());
      let arrayField = '';
      let objectField = '';
      const keysSet = new Set<string>();

      const inspect = (obj: any, parentKey = '') => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          if (obj.length > 0 && typeof obj[0] === 'object' && obj[0] !== null && !Array.isArray(obj[0])) {
            Object.keys(obj[0]).forEach(k => keysSet.add(k));
          }
          return;
        }
        Object.keys(obj).forEach(k => {
          if (!parentKey) keysSet.add(k);
          const val = obj[k];
          if (val && typeof val === 'object' && !Array.isArray(val)) {
            if (!objectField && !parentKey && (k === 'cliente' || k === 'data' || k === 'result' || k === 'usuario' || k === 'dados' || k === 'item' || k === 'fatura')) {
              objectField = k;
            }
            Object.keys(val).forEach(subK => keysSet.add(subK));
          } else if (Array.isArray(val)) {
            if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
              if (!arrayField) arrayField = parentKey ? `${parentKey}.${k}` : k;
              Object.keys(val[0]).forEach(subK => keysSet.add(subK));
            }
          }
        });
      };

      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object') {
          inspect(parsed[0]);
        }
      } else {
        inspect(parsed);
      }

      const keys = Array.from(keysSet).filter(k => Boolean(k) && typeof k === 'string');
      return { arrayField, objectField, keys };
    } catch {
      return { arrayField: '', objectField: '', keys: [] };
    }
  };

  const handleGenerateJsTreatment = (itemId: string, sampleJson?: string, nodeName?: string, userPrompt?: string) => {
    if (!sampleJson || !sampleJson.trim()) {
      showTreatmentToast(itemId, '⚠️ Cole um exemplo de JSON de resposta antes de gerar o script.');
      return;
    }

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(sampleJson.trim());
      } catch {
        showTreatmentToast(itemId, '❌ O modelo de resposta não é um JSON válido. Verifique chaves e aspas.');
        return;
      }

      const { arrayField, objectField, keys: allKeys } = getDetectedKeysFromSample(sampleJson);

      if (allKeys.length === 0) {
        showTreatmentToast(itemId, '⚠️ Nenhum campo detectado no JSON fornecido.');
        return;
      }

      const promptLower = (userPrompt || '').toLowerCase();

      // Analyze natural language instructions: detect removals and inclusions
      const removedKeys: string[] = [];
      const includedKeys: string[] = [];

      allKeys.forEach(k => {
        const kLower = k.toLowerCase();
        // Negative patterns for this key
        const removeRegex = new RegExp(`(?:remover|retirar|tirar|sem|descartar|excluir|não quero|nao quero)\\s+(?:o\\s+|a\\s+|os\\s+|as\\s+|campo\\s+)?${kLower}`, 'i');
        if (removeRegex.test(promptLower)) {
          removedKeys.push(k);
        } else if (promptLower.includes(kLower)) {
          includedKeys.push(k);
        }
      });

      // Selected fields: if user specifically asked for certain fields, prioritize them. Otherwise all keys minus removed.
      let activeFields: string[] = [];
      if (includedKeys.length > 0) {
        activeFields = includedKeys.filter(k => !removedKeys.includes(k));
      } else {
        activeFields = allKeys.filter(k => !removedKeys.includes(k));
      }

      // If user typed "só o nome" or "apenas X, Y", ensure only those
      const onlyMatch = promptLower.match(/(?:só|apenas|somente)\s+([^,\.\n]+)/i);
      if (onlyMatch) {
        const onlyText = onlyMatch[1];
        const matched = allKeys.filter(k => onlyText.includes(k.toLowerCase()));
        if (matched.length > 0) {
          activeFields = matched.filter(k => !removedKeys.includes(k));
        }
      }

      if (activeFields.length === 0) {
        activeFields = allKeys.slice(0, 5);
      }

      const respVarName = nodeName ? `_vars.${nodeName.replace(/[^a-zA-Z0-9_]/g, '_')}` : '_vars.resposta_api';

      // Check if user asked for filter by status/active
      const filterActiveMatch = /(?:ativo|ativos|status ativo|somente ativo)/i.test(promptLower);
      const limitMatch = promptLower.match(/(\d+)\s*(?:primeiros|registros|itens|contratos|faturas)/i);
      const limitCount = limitMatch ? parseInt(limitMatch[1], 10) : 5;

      let generatedScript = '';
      if (arrayField) {
        generatedScript = `// Script de tratamento gerado com base no Modelo de Resposta e Regras
try {
    let raw = ${respVarName} || _vars.resposta_api;
    if (typeof raw === 'string') raw = JSON.parse(raw);

    let items = (raw && raw.${arrayField}) ? raw.${arrayField} :
                (raw && raw.data) ? raw.data :
                (raw && raw.result && raw.result.items) ? raw.result.items :
                Array.isArray(raw) ? raw : [raw];

${filterActiveMatch ? `    // Filtrar apenas registros com status ativo\n    items = items.filter(it => it && (it.status === 'ATIVO' || it.ativo === true || it.situacao === 'A'));\n` : ''}
    let total = items.length;
    let primeiro = total > 0 ? items[0] : null;

    return {
        status: total > 0 ? 'sucesso' : 'vazio',
        total: total,
        principal: primeiro ? {
${activeFields.map(k => `            ${k}: primeiro.${k} !== undefined ? primeiro.${k} : null`).join(',\n')}
        } : null,
        itens: items.slice(0, ${limitCount})
    };
} catch (e) {
    return { status: 'erro', message: 'Falha ao processar dados da API', details: e.message };
}`;
      } else {
        const objAccessor = objectField ? `(raw && raw.${objectField}) ? raw.${objectField} : ` : '';
        generatedScript = `// Script de tratamento gerado com base no Modelo de Resposta e Regras
try {
    let raw = ${respVarName} || _vars.resposta_api;
    if (typeof raw === 'string') raw = JSON.parse(raw);
    let principal = ${objAccessor}(raw && raw.data) ? raw.data : (raw && raw.result) ? raw.result : (raw || {});

    return {
        status: 'sucesso',
        dados: {
${activeFields.map(k => `            ${k}: principal.${k} !== undefined ? principal.${k} : (raw && raw.${k} !== undefined ? raw.${k} : null)`).join(',\n')}
        }
    };
} catch (e) {
    return { status: 'erro', message: 'Falha ao processar dados da API', details: e.message };
}`;
      }

      // Update both natural explanation and JS code
      const naturalSummary = userPrompt && userPrompt.trim()
        ? userPrompt
        : (arrayField
          ? `Extrair ${activeFields.join(', ')} da lista de ${arrayField}.`
          : `Extrair os campos ${activeFields.join(', ')}.`);

      setCurlList(prev => prev.map(c => c.id === itemId ? {
        ...c,
        filterRules: naturalSummary,
        generatedJsCode: generatedScript
      } : c));

      showTreatmentToast(itemId, '✨ Script JavaScript atualizado de acordo com a sua instrução!');
    } catch (err: any) {
      showTreatmentToast(itemId, `❌ Erro ao analisar: ${err.message}`);
    }
  };

  const handleToggleFieldInPrompt = (itemId: string, currentPrompt: string, fieldName: string, sampleJson?: string, nodeName?: string) => {
    let newPrompt = '';
    const lowerPrompt = (currentPrompt || '').toLowerCase();
    const fieldLower = fieldName.toLowerCase();

    if (lowerPrompt.includes(`remover ${fieldLower}`) || lowerPrompt.includes(`sem ${fieldLower}`)) {
      newPrompt = currentPrompt
        .replace(new RegExp(`(?:remover|retirar|tirar|sem|descartar)\\s+${fieldLower}`, 'gi'), '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!newPrompt.toLowerCase().includes(fieldLower)) {
        newPrompt += ` Incluir ${fieldName}.`;
      }
    } else if (lowerPrompt.includes(fieldLower)) {
      newPrompt = (currentPrompt ? currentPrompt + ' ' : '') + `Remover ${fieldName}.`;
    } else {
      newPrompt = (currentPrompt ? currentPrompt + ', ' : 'Extrair ') + `${fieldName}`;
    }

    handleGenerateJsTreatment(itemId, sampleJson, nodeName, newPrompt.trim());
  };

  const handleGenerateJsFromTargetSchema = (itemId: string, sampleJson?: string, targetSchema?: string, nodeName?: string) => {
    if (!sampleJson || !sampleJson.trim()) {
      showTreatmentToast(itemId, '⚠️ Cole um exemplo da resposta bruta da API antes de mapear.');
      return;
    }
    if (!targetSchema || !targetSchema.trim()) {
      showTreatmentToast(itemId, '⚠️ Cole ou digite o modelo do retorno desejado.');
      return;
    }

    try {
      let sourceObj: any;
      try {
        sourceObj = JSON.parse(sampleJson.trim());
      } catch {
        showTreatmentToast(itemId, '❌ O modelo de resposta da API não é um JSON válido.');
        return;
      }

      const { arrayField, objectField, keys: sourceKeys } = getDetectedKeysFromSample(sampleJson);

      let targetKeys: string[] = [];
      try {
        const parsedTarget = JSON.parse(targetSchema.trim());
        targetKeys = Object.keys(parsedTarget);
      } catch {
        targetKeys = targetSchema
          .split(/[\n,;]+/)
          .map(s => s.trim().replace(/[^a-zA-Z0-9_]/g, ''))
          .filter(Boolean);
      }

      if (targetKeys.length === 0) {
        showTreatmentToast(itemId, '⚠️ Nenhum campo identificado no modelo desejado.');
        return;
      }

      const mappingLines: string[] = [];
      targetKeys.forEach(tKey => {
        const tLower = tKey.toLowerCase();
        const exact = sourceKeys.find(s => s.toLowerCase() === tLower);
        const partial = sourceKeys.find(s => s.toLowerCase().includes(tLower) || tLower.includes(s.toLowerCase()));
        const matched = exact || partial || tKey;
        mappingLines.push(`            ${tKey}: principal.${matched} !== undefined ? principal.${matched} : (raw && raw.${matched} !== undefined ? raw.${matched} : null)`);
      });

      const respVarName = nodeName ? `_vars.${nodeName.replace(/[^a-zA-Z0-9_]/g, '_')}` : '_vars.resposta_api';

      let generatedScript = '';
      if (arrayField) {
        generatedScript = `// Script de mapeamento para o modelo de saída desejado
try {
    let raw = ${respVarName} || _vars.resposta_api;
    if (typeof raw === 'string') raw = JSON.parse(raw);

    let items = (raw && raw.${arrayField}) ? raw.${arrayField} :
                (raw && raw.data) ? raw.data :
                (raw && raw.result && raw.result.items) ? raw.result.items :
                Array.isArray(raw) ? raw : [raw];

    let principal = items.length > 0 ? items[0] : (raw || {});

    // Mapeamento transformado estritamente para o Modelo de Retorno Desejado
    return {
        status: items.length > 0 ? 'sucesso' : 'vazio',
        dados: {
${mappingLines.join(',\n')}
        }
    };
} catch (e) {
    return { status: 'erro', message: 'Falha ao mapear retorno da API', details: e.message };
}`;
      } else {
        const objAccessor = objectField ? `(raw && raw.${objectField}) ? raw.${objectField} : ` : '';
        generatedScript = `// Script de mapeamento para o modelo de saída desejado
try {
    let raw = ${respVarName} || _vars.resposta_api;
    if (typeof raw === 'string') raw = JSON.parse(raw);
    let principal = ${objAccessor}(raw && raw.data) ? raw.data : (raw && raw.result) ? raw.result : (raw || {});

    // Mapeamento transformado estritamente para o Modelo de Retorno Desejado
    return {
        status: 'sucesso',
        dados: {
${mappingLines.join(',\n')}
        }
    };
} catch (e) {
    return { status: 'erro', message: 'Falha ao mapear retorno da API', details: e.message };
}`;
      }

      setCurlList(prev => prev.map(c => c.id === itemId ? {
        ...c,
        targetOutputModel: targetSchema,
        generatedJsCode: generatedScript
      } : c));

      showTreatmentToast(itemId, '✨ Mapeamento para o modelo de retorno gerado com sucesso!');
    } catch (err: any) {
      showTreatmentToast(itemId, `❌ Erro ao mapear: ${err.message}`);
    }
  };

  const handleMoveCurlUp = (index: number) => {
    if (index === 0) return;
    setCurlList(prev => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveCurlDown = (index: number) => {
    if (index >= curlList.length - 1) return;
    setCurlList(prev => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const [studioMode, setStudioMode] = useState<'both' | 'workflow_only'>('both');
  const [showArchitectureGuide, setShowArchitectureGuide] = useState<boolean>(false);
  const [agentToolsInput, setAgentToolsInput] = useState<string>(
    'consultar_cadastro(cpf): Consulta os dados cadastrais do cliente\nemitir_segunda_via(id_contrato): Gera a 2ª via da fatura'
  );
  const [agentTransferTag, setAgentTransferTag] = useState<string>('#SUPORTE_HUMANO');

  // Load standard template helper
  const handleLoadTemplate = (tplId: string) => {
    const tpl = TEMPLATES_LIBRARY.find(t => t.id === tplId);
    if (!tpl) return;

    setBusinessContext(tpl.sampleAgent.description || tpl.title);
    setNaturalSteps(tpl.sampleAgent.instruction.steps.map(s => `- ${s}`).join('\n'));
    setNaturalRules(tpl.sampleAgent.other_rules);
    setFreeformPrompt(`PASSOS DO ATENDIMENTO:\n${tpl.sampleAgent.instruction.steps.map(s => `- ${s}`).join('\n')}\n\nREGRAS E VALIDAÇÕES:\n${tpl.sampleAgent.other_rules}`);

    // Map sample workflow
    if (tpl.sampleWorkflow) {
      const restNodes = tpl.sampleWorkflow.flow.filter(n => n.type === 'rest') as any[];
      if (restNodes.length > 0) {
        setCurlList(restNodes.map((n, idx) => ({
          id: `curl-${idx + 1}`,
          name: `${idx + 1}. ${n.name || 'Integração REST'}`,
          curl: `curl --location '${n.uri || 'https://api.empresa.com.br'}' \\\n--header 'Content-Type: application/json'`,
          responseSample: '{\n  "status": "sucesso",\n  "resultado": "OK"\n}',
          filterRules: 'Extrair campos chave e repassar para a resposta'
        })));
      }
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let activeKey: string | undefined = undefined;
    if (provider === 'openai') {
      activeKey = openaiKey.trim();
      if (!activeKey) {
        alert('Por favor, informe sua chave OpenAI API (sk-...) nas configurações de IA.');
        setShowApiKeySettings(true);
        return;
      }
    } else if (provider === 'anthropic') {
      activeKey = anthropicKey.trim();
      if (!activeKey) {
        alert('Por favor, informe sua chave Anthropic API (sk-ant-...) nas configurações de IA.');
        setShowApiKeySettings(true);
        return;
      }
    } else if (provider === 'gemini' && geminiKey.trim()) {
      activeKey = geminiKey.trim();
    }

    let effectiveSteps = naturalSteps;
    if (inputMode === 'workflow_driven') {
      const activeCurls = curlList.filter(c => c.curl.trim() || c.responseSample?.trim() || c.filterRules?.trim());
      const cleanWfName = (raw: string) => (raw || 'Consulta de Informações').replace(/^[0-9.\-_ ]+/, '').trim().toLowerCase();
      effectiveSteps = [
        'Cumprimentar o cliente e solicitar documento/parâmetro inicial',
        ...activeCurls.map((c, idx) => {
          const name = cleanWfName(c.name);
          return idx === 0
            ? `Executar a ${name} com o documento informado`
            : `Com o identificador retornado na etapa anterior, executar a ${name}`;
        }),
        'Confirmar os dados e entregar o resultado estruturado ao cliente'
      ].join('\n');
    }

    const combinedAlgorithm = `PASSOS (O QUE FAZER):\n${effectiveSteps}\n\nREGRAS (COMO FAZER):\n${naturalRules}`;

    // Flatten all API steps from configuredWorkflows
    const flatApiSteps: OrderedApiStep[] = [];
    let globalOrder = 1;
    configuredWorkflows.forEach(wf => {
      wf.apiCalls.forEach(call => {
        flatApiSteps.push({
          ...call,
          order: globalOrder++,
          purposeDescription: `${wf.name}: ${call.purposeDescription || call.name}`
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
      freeformPrompt,
      businessContext,
      naturalAlgorithm: combinedAlgorithm,
      naturalSteps: effectiveSteps,
      naturalRules,
      workflowArchitectureMode: workflowArchitectureMode as any,
      authRoute: authRoute.enabled ? authRoute : undefined,
      apiDocs: apiDocs.trim() ? apiDocs : undefined,
      responseModelSample: responseModelSample.trim() ? responseModelSample : undefined,
      businessFilters: businessFilters.trim() ? businessFilters : undefined,
      curlItems: curlList.filter(c => c.curl.trim() || c.responseSample?.trim() || c.filterRules?.trim()),
      options: {
        monoSkillEnforced: true,
        antiHallucinationStrict: true,
        useSZVariables: false,
        customSZVariables: '{{nome}}, {{telefone}}, {{cpf}}',
        includeFencedJsonEntityBlock: true
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-7 max-w-full">

      {/* Studio Mode Switcher (2 Opções) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2 bg-[#061325]/90 border border-[#0066FF]/25 rounded-2xl shadow-inner">
        <button
          type="button"
          onClick={() => setStudioMode('both')}
          className={`p-4 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3.5 border ${studioMode === 'both'
            ? 'bg-gradient-to-r from-[#0066FF] to-[#0052FF] text-white shadow-xl shadow-[#0066FF]/35 border-[#00D2FF]/40'
            : 'bg-[#020b18]/60 text-slate-400 hover:text-slate-200 hover:bg-[#0066FF]/10 border-transparent'
            }`}
        >
          <div className={`p-2.5 rounded-xl ${studioMode === 'both' ? 'bg-white/20 text-white' : 'bg-[#061833] text-[#0066FF]'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Agente + Workflows (Completo)</div>
            <div className="text-[10px] text-slate-300 opacity-90">Gera agente.json e workflows conectados às APIs</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStudioMode('workflow_only')}
          className={`p-4 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3.5 border ${studioMode === 'workflow_only'
            ? 'bg-gradient-to-r from-[#0066FF] to-[#0052FF] text-white shadow-xl shadow-[#0066FF]/35 border-[#00D2FF]/40'
            : 'bg-[#020b18]/60 text-slate-400 hover:text-slate-200 hover:bg-[#0066FF]/10 border-transparent'
            }`}
        >
          <div className={`p-2.5 rounded-xl ${studioMode === 'workflow_only' ? 'bg-white/20 text-white' : 'bg-[#061833] text-[#00D2FF]'}`}>
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Apenas Workflows (cURL / REST / Pipeline)</div>
            <div className="text-[10px] text-slate-300 opacity-90">Gera fluxos com instruções, request, REST em cadeia e retorno</div>
          </div>
        </button>
      </div>

      {/* Model & API Key Configuration Accordion */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 sm:p-5 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Motor de IA & Provedor</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  {provider.toUpperCase()} : {model}
                </span>
                {provider === 'gemini' && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Server className="w-3 h-3" />
                    <span>Localhost Nativo</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {provider === 'gemini'
                  ? 'Utilizando o motor Gemini integrado ao servidor local (sem necessidade de chave manual).'
                  : provider === 'openai'
                    ? 'Utilizando a API direta da OpenAI com sua chave de acesso.'
                    : 'Utilizando a API direta da Anthropic (Claude) com sua chave de acesso.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowKeyVisible(!showKeyVisible)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
              title={showKeyVisible ? 'Ocultar chaves' : 'Mostrar chaves'}
            >
              {showKeyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setShowApiKeySettings(!showApiKeySettings)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer flex items-center gap-2 border border-slate-700"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{showApiKeySettings ? 'Recolher Painel de IA' : 'Configurar Provedor / Chaves'}</span>
              {showApiKeySettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Selected Provider Quick Row & Model Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-3 border-t border-slate-800/80">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Provedor Ativo</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${provider === 'gemini'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
              >
                <span>Gemini</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${provider === 'openai'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/60 shadow-md shadow-blue-950/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
              >
                <span>OpenAI</span>
              </button>

              <button
                type="button"
                onClick={() => handleProviderChange('anthropic')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${provider === 'anthropic'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md shadow-amber-950/40'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
              >
                <span>Claude</span>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Modelo ({PROVIDER_MODELS[provider].length} Oficiais + Custom)
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                ID Ativo: {model}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={PROVIDER_MODELS[provider].some(m => m.id === model) ? model : 'custom'}
                onChange={e => {
                  if (e.target.value !== 'custom') {
                    setModel(e.target.value);
                  }
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              >
                {PROVIDER_MODELS[provider].map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.tag ? `(${m.tag})` : ''}
                  </option>
                ))}
                <option value="custom">-- Outro modelo (digitar manualmente) --</option>
              </select>

              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder="ID exato do modelo (ex: gpt-5.6-sol ou custom)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Extended Credentials & Keys Settings Accordion */}
        {showApiKeySettings && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 mt-4 border-t border-slate-800 text-xs">

            {/* Google Gemini Card */}
            <div className={`p-3.5 rounded-xl border transition-all space-y-2 ${provider === 'gemini' ? 'bg-slate-950 border-emerald-500/50 shadow-md' : 'bg-slate-950/40 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="providerRadio"
                    value="gemini"
                    checked={provider === 'gemini'}
                    onChange={() => handleProviderChange('gemini')}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Google Gemini</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  Localhost Padrão
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Usa a API nativa do servidor local. Se desejar usar uma chave customizada, informe abaixo:
              </p>
              <input
                type={showKeyVisible ? 'text' : 'password'}
                value={geminiKey}
                onChange={e => setGeminiKey(e.target.value)}
                placeholder="Chave customizada (opcional)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">Salvo no sessionStorage</span>
            </div>

            {/* OpenAI Card */}
            <div className={`p-3.5 rounded-xl border transition-all space-y-2 ${provider === 'openai' ? 'bg-slate-950 border-blue-500/50 shadow-md' : 'bg-slate-950/40 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="providerRadio"
                    value="openai"
                    checked={provider === 'openai'}
                    onChange={() => handleProviderChange('openai')}
                    className="text-blue-500 focus:ring-blue-500"
                  />
                  <span>OpenAI Direct</span>
                </label>
                <span className="text-[10px] text-blue-400 font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">
                  BYOK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Informe sua chave OpenAI (sk-...) para usar GPT-4o, o3-mini ou o1:
              </p>
              <input
                type={showKeyVisible ? 'text' : 'password'}
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">Salvo no sessionStorage</span>
            </div>

            {/* Anthropic Claude Card */}
            <div className={`p-3.5 rounded-xl border transition-all space-y-2 ${provider === 'anthropic' ? 'bg-slate-950 border-amber-500/50 shadow-md' : 'bg-slate-950/40 border-slate-800'}`}>
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="providerRadio"
                    value="anthropic"
                    checked={provider === 'anthropic'}
                    onChange={() => handleProviderChange('anthropic')}
                    className="text-amber-500 focus:ring-amber-500"
                  />
                  <span>Anthropic Claude Direct</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  BYOK
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Informe sua chave Anthropic (sk-ant-...) para usar Claude 3.7 ou 3.5:
              </p>
              <input
                type={showKeyVisible ? 'text' : 'password'}
                value={anthropicKey}
                onChange={e => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 block">Salvo no sessionStorage</span>
            </div>

          </div>
        )}
      </div>

      {/* 2. Objetivo Geral (Opcional em workflow_only) */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          {studioMode === 'workflow_only' ? 'Propósito / Contexto dos Workflows (Opcional)' : 'Objetivo Geral e Papel do Agente'}
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
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          required={studioMode === 'both'}
        />
      </div>

      {/* 3. SEÇÃO DO AGENTE (Exibida em modo 'both' e 'agent_only') */}
      {studioMode !== 'workflow_only' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#00D2FF]" />
              <span>Orquestração do Agente (100% Automática pelos Workflows)</span>
            </label>
            <span className="text-[10px] font-mono text-[#00D2FF] bg-[#061833] border border-[#0066FF]/40 px-2.5 py-1 rounded-full">
              Padrão Oficial Fortics
            </span>
          </div>

          <div className="bg-[#061833]/90 border border-[#0066FF]/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#0066FF]/20 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#020b18] text-[#00D2FF] border border-[#0066FF]/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Dedução Automática do Agente (API-First)
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    O Studio deduz e constrói as instruções do robô (<code className="text-[#00D2FF]">instruction.steps</code>) diretamente a partir das integrações cURL configuradas abaixo.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-1 rounded-full hidden sm:inline-block">
                {curlList.length} {curlList.length === 1 ? 'Integração' : 'Integrações'}
              </span>
            </div>

            {/* Preview em Tempo Real da Esteira de Diálogo */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-[#00D2FF]" />
                <span>Fluxo de passos que o Agente executará no chat:</span>
              </label>
              <div className="p-3 bg-[#020b18] border border-[#0066FF]/30 rounded-xl space-y-1.5 text-xs text-slate-200 font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-[#0066FF] flex items-center justify-center text-[10px] font-black text-white shrink-0">1</span>
                  <span>Cumprimentar o cliente e solicitar documento/parâmetro inicial</span>
                </div>

                {curlList.map((c, idx) => {
                  const cleanName = (c.name || `Integração ${idx + 1}`).replace(/^[0-9.\-_ ]+/, '').trim();
                  return (
                    <div key={c.id || idx} className="flex items-center gap-2 text-cyan-200">
                      <span className="w-5 h-5 rounded-full bg-[#0066FF]/70 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{idx + 2}</span>
                      <span>
                        {idx === 0
                          ? <>Executar a <strong>{cleanName.toLowerCase()}</strong> com o documento informado</>
                          : <>Com o identificador retornado na etapa anterior, executar a <strong>{cleanName.toLowerCase()}</strong></>
                        }
                      </span>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">{curlList.length + 2}</span>
                  <span>Confirmar os dados e entregar o resultado estruturado ao cliente</span>
                </div>
              </div>
            </div>

            {/* Campo Opcional para Regras Adicionais */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Regras Extras de Negócio & Transbordo (Opcional)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">other_rules</span>
              </label>
              <textarea
                rows={3}
                value={naturalRules}
                onChange={e => handleStructuredRulesChange(e.target.value)}
                placeholder="Ex: - Aceitar CPF com 11 dígitos com ou sem pontuação (XXX.XXX.XXX-XX ou apenas números)&#10;- Não inventar informações além do retornado pela ferramenta..."
                className="w-full bg-[#020b18] border border-[#0066FF]/30 rounded-xl p-3 text-xs text-amber-200 font-sans leading-relaxed focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. SEÇÃO DE WORKFLOWS & cURLs */}
      <div className="space-y-4 pt-2">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#00D2FF]" />
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Integrações de API / Comandos cURL
            </label>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Architecture Switcher */}
            <div className="flex items-center bg-[#061325] p-1 rounded-full border border-[#0066FF]/30 text-[11px]">
              <button
                type="button"
                onClick={() => setWorkflowArchitectureMode('single_consolidated')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${workflowArchitectureMode === 'single_consolidated'
                  ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/40'
                  : 'text-slate-300 hover:text-white'
                  }`}
                title="Executa Autenticação, Consultas e Ações em sequência contínua no mesmo workflow.json"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1 Workflow com Várias Integrações (Em Cadeia)</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkflowArchitectureMode('multiple_modular')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${workflowArchitectureMode === 'multiple_modular'
                  ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/40'
                  : 'text-slate-300 hover:text-white'
                  }`}
                title="Gera 1 arquivo workflow.json isolado para cada função/ferramenta do robô"
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Workflows Separados (1 para Cada Função)</span>
              </button>
            </div>

            {/* Botão Tira-Dúvidas com Exemplos */}
            <button
              type="button"
              onClick={() => setShowArchitectureGuide(!showArchitectureGuide)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${showArchitectureGuide
                ? 'bg-[#0066FF] text-white border-[#00D2FF]'
                : 'bg-[#020b18] hover:bg-[#0066FF]/20 text-[#00D2FF] border-[#0066FF]/40'
                }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tira-Dúvidas: Qual Escolher?</span>
            </button>

            <button
              type="button"
              onClick={handleAddCurlItem}
              className="px-4 py-1.5 rounded-full bg-[#020b18] hover:bg-[#0066FF]/20 text-white border border-[#0066FF]/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#00D2FF]" />
              <span>
                {workflowArchitectureMode === 'single_consolidated'
                  ? 'Adicionar Próxima Etapa da Cadeia'
                  : 'Adicionar Outro Workflow Separado'}
              </span>
            </button>
          </div>
        </div>

        {/* Card Tira-Dúvidas com Exemplos Práticos */}
        {showArchitectureGuide && (
          <div className="bg-[#061833]/95 border border-[#0066FF]/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#0066FF]/25 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#020b18] text-[#00D2FF] border border-[#0066FF]/40">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Guia Prático: Escolha a Estrutura Ideal para o seu Atendimento
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowArchitectureGuide(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-0.5"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Opção 1: 1 Workflow com Várias Integrações */}
              <div className="p-3.5 rounded-xl bg-[#020b18]/80 border border-[#0066FF]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00D2FF]">
                  <Layers className="w-4 h-4" />
                  <span>1 Workflow com Várias Integrações (Em Cadeia)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Quando usar:</strong> Quando uma operação do sistema precisa de várias chamadas técnicas automáticas no backend, uma dependendo do resultado da outra, sem precisar perguntar nada ao cliente no meio do caminho.
                </p>
                <div className="p-2.5 bg-[#061325] rounded-lg border border-[#0066FF]/20 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-emerald-400 font-bold">💡 Exemplo Prático:</div>
                  <div>1º REST: Faz Login / Obtém Token OAuth</div>
                  <div>2º Code: Trata e salva _vars.token.token</div>
                  <div>3º REST: Consulta Débitos usando o Token</div>
                  <div>4º Code: Filtra a fatura mais vencida</div>
                  <div>5º Route Return: Devolve o JSON pronto pro Agente</div>
                </div>
                <div className="text-[10px] text-slate-400">
                  ✓ <strong>Vantagem:</strong> O robô executa toda a esteira em 1 único segundo com zero atrito pro cliente.
                </div>
              </div>

              {/* Opção 2: Workflows Separados */}
              <div className="p-3.5 rounded-xl bg-[#020b18]/80 border border-[#0066FF]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8]">
                  <Workflow className="w-4 h-4" />
                  <span>Workflows Separados (1 para Cada Função)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  <strong>Quando usar:</strong> Quando são ações independentes que o cliente pode escolher ou não durante o diálogo conforme a necessidade dele.
                </p>
                <div className="p-2.5 bg-[#061325] rounded-lg border border-[#0066FF]/20 text-[11px] font-mono text-slate-300 space-y-1">
                  <div className="text-cyan-400 font-bold">💡 Exemplo Prático:</div>
                  <div>• Workflow 1: <span className="text-white">consultar_cadastro.json</span> (se pedir dados)</div>
                  <div>• Workflow 2: <span className="text-white">emitir_segunda_via.json</span> (se pedir fatura)</div>
                  <div>• Workflow 3: <span className="text-white">agendar_visita.json</span> (se pedir técnico)</div>
                </div>
                <div className="text-[10px] text-slate-400">
                  ✓ <strong>Vantagem:</strong> Cada operação é uma ferramenta isolada que o Agente só chama quando o usuário pedir.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Banner de Resumo da Cadeia */}
        {workflowArchitectureMode === 'single_consolidated' && curlList.length > 1 && (
          <div className="p-3.5 bg-[#061833]/90 border border-[#0066FF]/30 rounded-2xl text-xs text-slate-200 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#020b18] text-[#00D2FF] border border-[#0066FF]/40 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white block">1 Workflow Consolidado ({curlList.length} Chamadas HTTP Encadeadas)</span>
              <span className="text-[11px] text-slate-300">
                O fluxo executará sequencialmente: {curlList.map((c, i) => `${i + 1}º ${c.nodeName || c.name || `Etapa ${i + 1}`}`).join(' ➔ ')} com nós de código intermediários tratando e repassando variáveis via <code className="text-[#00D2FF]">_vars</code> e <code className="text-[#00D2FF]">{"{{...}}"}</code>.
              </span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {curlList.map((item, idx) => {
            const defaultNodeName = idx === 0 && (item.curl.toLowerCase().includes('auth') || item.curl.toLowerCase().includes('token') || item.curl.toLowerCase().includes('login'))
              ? 'token'
              : (item.nodeName || `etapa_${idx + 1}`);

            return (
              <React.Fragment key={item.id}>
                <div
                  className={`bg-[#061325]/90 border rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all shadow-lg ${workflowArchitectureMode === 'single_consolidated'
                    ? 'border-[#0066FF]/30 hover:border-[#0066FF]/60'
                    : 'border-[#0066FF]/20 hover:border-emerald-500/40'
                    }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0066FF]/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md ${workflowArchitectureMode === 'single_consolidated'
                        ? 'bg-[#0066FF] shadow-[#0066FF]/30'
                        : 'bg-emerald-600 shadow-emerald-950/40'
                        }`}>
                        {idx + 1}
                      </span>

                      <div className="flex flex-col">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleUpdateCurlItem(item.id, 'name', e.target.value)}
                          className="bg-transparent text-xs font-bold text-white focus:outline-none border-b border-transparent hover:border-slate-600 focus:border-[#00D2FF] px-1 py-0.5"
                          placeholder={
                            workflowArchitectureMode === 'single_consolidated'
                              ? `Etapa ${idx + 1}: Nome da Chamada HTTP`
                              : `Workflow ${idx + 1}: Nome da Ferramenta`
                          }
                        />
                      </div>

                      {workflowArchitectureMode === 'single_consolidated' ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#0066FF]/20 text-[#00D2FF] border border-[#0066FF]/30 hidden sm:inline-block">
                          Cadeia Sequencial (mesmo JSON)
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 hidden sm:inline-block">
                          Workflow Independente (.json)
                        </span>
                      )}
                    </div>

                    {/* Controls: Move Up, Move Down, Duplicate, Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveCurlUp(idx)}
                        className={`p-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center ${idx === 0
                          ? 'bg-[#020b18]/40 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-[#020b18] hover:bg-[#0066FF]/20 border-[#0066FF]/30 text-slate-200'
                          }`}
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === curlList.length - 1}
                        onClick={() => handleMoveCurlDown(idx)}
                        className={`p-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer flex items-center ${idx === curlList.length - 1
                          ? 'bg-[#020b18]/40 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-[#020b18] hover:bg-[#0066FF]/20 border-[#0066FF]/30 text-slate-200'
                          }`}
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateCurlItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-[#020b18] hover:bg-[#0066FF]/20 text-slate-200 border border-[#0066FF]/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Duplicar"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Duplicar</span>
                      </button>

                      {curlList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCurlItem(item.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 border border-rose-800/40"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step Node Identifier & Variable Binding */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#020b18]/60 p-3 rounded-xl border border-[#0066FF]/15">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <span>
                          {workflowArchitectureMode === 'single_consolidated'
                            ? 'Identificador do Nó REST nesta cadeia (name):'
                            : 'Identificador do Nó REST no Workflow (name):'}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={item.nodeName || defaultNodeName}
                        onChange={e => handleUpdateCurlItem(item.id, 'nodeName', e.target.value)}
                        placeholder="Ex: token, consulta_cliente, emissao_boleto"
                        className="w-full bg-[#061325] border border-[#0066FF]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#00D2FF] font-mono focus:border-[#0066FF] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <span>
                          {workflowArchitectureMode === 'single_consolidated'
                            ? 'Variáveis Injetadas nas Próximas Etapas:'
                            : 'Variáveis Retornadas para o Agente:'}
                        </span>
                      </label>
                      <div className="text-xs font-mono text-emerald-400 bg-[#061325] border border-[#0066FF]/20 rounded-lg px-2.5 py-1.5 flex items-center justify-between">
                        <span>{"{{"}{item.nodeName || defaultNodeName}.campo{"}}"}</span>
                        <span className="text-[10px] text-slate-400 font-sans">ou _vars.{item.nodeName || defaultNodeName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Campo 1: Comando cURL */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#00D2FF] uppercase tracking-wider flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5" />
                      Comando cURL {workflowArchitectureMode === 'single_consolidated' ? `da Etapa ${idx + 1}` : `do Workflow ${idx + 1}`}
                    </label>
                    <textarea
                      rows={4}
                      value={item.curl}
                      onChange={e => handleUpdateCurlItem(item.id, 'curl', e.target.value)}
                      placeholder={
                        workflowArchitectureMode === 'single_consolidated'
                          ? `curl --location 'https://api.empresa.com.br/v1/${idx === 0 ? 'auth/token' : 'clientes?id={{' + (curlList[0]?.nodeName || 'token') + '.token}}'}' \\\n--header 'Content-Type: application/json'`
                          : `curl --location 'https://api.empresa.com.br/v1/clientes?cpf={{request.cpf}}' \\\n--header 'Content-Type: application/json'`
                      }
                      className="w-full bg-[#020b18] border border-[#0066FF]/30 rounded-xl p-3 text-xs text-cyan-200 font-mono leading-relaxed focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF] focus:outline-none"
                      required
                    />
                  </div>

                  {/* Bloco 2: Modelo de Resposta da API (JSON de Exemplo) - SEMPRE PRESENTE */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Modelo de Resposta da API (JSON de Exemplo da Resposta)
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans normal-case">
                        Cole o retorno da API (Postman / Swagger / Teste)
                      </span>
                    </label>
                    <textarea
                      rows={5}
                      value={item.responseSample || ''}
                      onChange={e => handleUpdateCurlItem(item.id, 'responseSample', e.target.value)}
                      placeholder={`{\n  "status": "success",\n  "clientes": [\n    {\n      "nome": "CARLOS SILVA",\n      "cpfcnpj": "12345678900",\n      "contratos": [{ "id": 101, "status": "ATIVO" }]\n    }\n  ]\n}`}
                      className="w-full bg-[#020b18] border border-[#0066FF]/30 rounded-xl p-3 text-xs text-emerald-200 font-mono leading-relaxed focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Bloco 3: Formas de Tratar o Retorno da API (3 Abas) */}
                  <div className="space-y-2.5 pt-2 border-t border-[#0066FF]/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                        Como você quer Tratar esse Retorno no Nó de Código?
                      </label>
                      <div className="flex items-center gap-1 p-0.5 bg-[#020b18] border border-[#0066FF]/30 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateCurlItem(item.id, 'treatmentMode', 'auto_ai');
                            if (item.responseSample) handleGenerateJsTreatment(item.id, item.responseSample, item.name);
                          }}
                          className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            (!item.treatmentMode || item.treatmentMode === 'auto_ai')
                              ? 'bg-linear-to-r from-[#0052FF] to-[#00D2FF] text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-cyan-300" />
                          <span>1. IA Automática</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateCurlItem(item.id, 'treatmentMode', 'natural_language')}
                          className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            item.treatmentMode === 'natural_language'
                              ? 'bg-linear-to-r from-amber-600 to-amber-400 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Edit3 className="w-3 h-3 text-amber-300" />
                          <span>2. Linguagem Natural</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateCurlItem(item.id, 'treatmentMode', 'target_schema')}
                          className={`py-1 px-2.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            item.treatmentMode === 'target_schema'
                              ? 'bg-linear-to-r from-emerald-600 to-teal-400 text-white shadow-sm'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Columns className="w-3 h-3 text-emerald-300" />
                          <span>3. Modelo de Saída Desejado</span>
                        </button>
                      </div>
                    </div>

                    {treatmentToast && treatmentToast.id === item.id && (
                      <div className="px-2.5 py-1 rounded-lg bg-[#041a38] border border-[#00D2FF]/40 text-[#00D2FF] text-[11px] font-medium flex items-center gap-1.5 animate-fadeIn">
                        <span>{treatmentToast.text}</span>
                      </div>
                    )}

                    {/* OPÇÃO 1: IA AUTOMÁTICA */}
                    {(!item.treatmentMode || item.treatmentMode === 'auto_ai') && (
                      <div className="p-3.5 rounded-xl bg-[#020b18]/80 border border-[#0066FF]/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#0066FF]/20 border border-[#00D2FF]/30 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-[#00D2FF]" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200">Extração 100% Automática com IA</div>
                            <div className="text-[11px] text-slate-400">A IA lê o Modelo de Resposta colado acima e gera automaticamente o script JavaScript com os principais campos e coleções tratados.</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleGenerateJsTreatment(item.id, item.responseSample, item.name)}
                          className="px-3 py-1.5 rounded-lg bg-linear-to-r from-[#0052FF] to-[#00D2FF] hover:brightness-110 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-cyan-200 animate-pulse" />
                          <span>Gerar JS do Modelo</span>
                        </button>
                      </div>
                    )}

                    {/* OPÇÃO 2: LINGUAGEM NATURAL */}
                    {item.treatmentMode === 'natural_language' && (
                      <div className="space-y-2 p-3 rounded-xl bg-[#020b18]/80 border border-amber-500/25">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Edit3 className="w-3.5 h-3.5" />
                            Instruções do que Extrair / Modificar (Linguagem Natural)
                          </label>
                          <button
                            type="button"
                            onClick={() => handleGenerateJsTreatment(item.id, item.responseSample, item.name, item.filterRules)}
                            className="px-2.5 py-0.5 rounded-md bg-linear-to-r from-amber-500/20 via-emerald-500/20 to-[#00D2FF]/20 hover:from-amber-500/30 hover:to-[#00D2FF]/30 border border-amber-400/40 hover:border-amber-300 text-amber-300 hover:text-amber-100 text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer transform active:scale-95"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                            <span>Atualizar Script JS</span>
                          </button>
                        </div>

                        <textarea
                          rows={3}
                          value={item.filterRules || ''}
                          onChange={e => handleUpdateCurlItem(item.id, 'filterRules', e.target.value)}
                          placeholder={`Ex: Extrair nome, CPF e contratos ativos. Remover o campo tipo e endereço.`}
                          className="w-full bg-[#030e20] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 font-sans leading-relaxed focus:border-amber-400 focus:outline-none"
                        />

                        {/* Chips de campos detectados no Modelo de Resposta */}
                        {(() => {
                          const detected = getDetectedKeysFromSample(item.responseSample);
                          if (detected.keys.length === 0) return null;
                          return (
                            <div className="pt-1">
                              <div className="text-[10px] text-slate-400 font-sans mb-1 flex items-center gap-1">
                                <span>Campos detectados no Modelo de Resposta (clique para incluir/remover):</span>
                              </div>
                              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                                {detected.keys.map(k => {
                                  const isRemoved = (item.filterRules || '').toLowerCase().includes(`remover ${k.toLowerCase()}`) || (item.filterRules || '').toLowerCase().includes(`sem ${k.toLowerCase()}`);
                                  return (
                                    <button
                                      key={k}
                                      type="button"
                                      onClick={() => handleToggleFieldInPrompt(item.id, item.filterRules || '', k, item.responseSample, item.name)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border ${
                                        isRemoved
                                          ? 'bg-rose-950/40 border-rose-600/40 text-rose-300 line-through'
                                          : 'bg-[#061e3d] border-[#0066FF]/40 text-cyan-300 hover:border-[#00D2FF] hover:bg-[#082a54]'
                                      }`}
                                    >
                                      {isRemoved ? `✕ ${k}` : `✓ ${k}`}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* OPÇÃO 3: MODELO DE SAÍDA DESEJADO */}
                    {item.treatmentMode === 'target_schema' && (
                      <div className="space-y-2 p-3 rounded-xl bg-[#020b18]/80 border border-teal-500/25">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Columns className="w-3.5 h-3.5" />
                            Modelo de Saída Desejado (JSON ou Texto com o Formato de Retorno)
                          </label>
                          <button
                            type="button"
                            onClick={() => handleGenerateJsFromTargetSchema(item.id, item.responseSample, item.targetOutputModel, item.name)}
                            className="px-2.5 py-0.5 rounded-md bg-linear-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-teal-400/40 text-teal-300 hover:text-white text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer transform active:scale-95"
                          >
                            <Sparkles className="w-3 h-3 text-teal-300 animate-pulse" />
                            <span>Mapear Retorno para Este Modelo</span>
                          </button>
                        </div>

                        <textarea
                          rows={4}
                          value={item.targetOutputModel || ''}
                          onChange={e => handleUpdateCurlItem(item.id, 'targetOutputModel', e.target.value)}
                          placeholder={`Cole o JSON ou campos que quer devolver pro Agente:\n{\n  "nome_cliente": "string",\n  "cpf": "string",\n  "contrato_ativo": 0\n}`}
                          className="w-full bg-[#030e20] border border-teal-500/30 rounded-xl p-3 text-xs text-teal-200 font-mono leading-relaxed focus:border-teal-400 focus:outline-none"
                        />
                      </div>
                    )}

                    {/* Bloco 4: Script JavaScript Gerado no Nó de Código (tratar_dados) */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-[#00D2FF] uppercase tracking-wider flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5" />
                          Script JavaScript Gerado no Nó de Código (tratar_dados)
                        </label>
                        {item.generatedJsCode && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.generatedJsCode || '');
                              showTreatmentToast(item.id, '📋 Script copiado!');
                            }}
                            className="px-2 py-0.5 rounded bg-[#061833] hover:bg-[#0b2854] border border-[#0066FF]/30 text-slate-300 hover:text-white text-[10px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Copy className="w-3 h-3 text-[#00D2FF]" />
                            <span>Copiar Código</span>
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={6}
                        value={item.generatedJsCode || ''}
                        onChange={e => handleUpdateCurlItem(item.id, 'generatedJsCode', e.target.value)}
                        placeholder={`// O script JavaScript do nó tratar_dados aparecerá aqui automaticamente com base no Modelo de Resposta e no modo selecionado.`}
                        className="w-full bg-[#010814] border border-[#0066FF]/30 rounded-xl p-3 text-xs text-amber-200 font-mono leading-relaxed focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                  </div>

                </div>

                {/* Flow Connector Arrow ONLY for single_consolidated mode */}
                {workflowArchitectureMode === 'single_consolidated' && idx < curlList.length - 1 && (
                  <div className="flex items-center justify-center gap-3 py-1">
                    <div className="h-px bg-gradient-to-r from-transparent via-[#0066FF]/40 to-transparent flex-1"></div>
                    <div className="px-4 py-1.5 rounded-full bg-[#061833] border border-[#0066FF]/40 text-[#00D2FF] text-[11px] font-mono flex items-center gap-2 shadow-md">
                      <span>⬇ Passo {idx + 1} ➔ Nó de Código (Tratar) ➔ Injeta em Passo {idx + 2}</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-[#0066FF]/40 to-transparent flex-1"></div>
                  </div>
                )}

                {/* Clean Visual Separation for multiple_modular mode */}
                {workflowArchitectureMode === 'multiple_modular' && idx < curlList.length - 1 && (
                  <div className="flex items-center justify-center gap-3 py-1 opacity-40">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1"></div>
                    <span className="text-[10px] text-slate-500 font-mono">próximo workflow independente</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent flex-1"></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Terminal Route Return Step Card */}


      </div>

      {/* Prominent Sticky Submit Bar */}
      <div className="sticky bottom-4 z-40 pt-4 flex justify-center items-center">
        <div className="bg-[#020b18]/95 backdrop-blur-xl border border-[#0066FF]/40 rounded-full p-2 sm:p-2.5 shadow-2xl shadow-[#0066FF]/30 flex items-center justify-center">
          <button
            type="submit"
            disabled={isGenerating}
            className={`w-full sm:w-auto px-10 py-3.5 rounded-full font-black text-xs tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer ${isGenerating
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'fortics-btn-primary hover:scale-[1.03] active:scale-[0.98]'
              }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Compilando com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#00D2FF]" />
                <span>{studioMode === 'workflow_only' ? 'Gerar Workflows' : 'Gerar Agente e Workflows'}</span>
              </>
            )}
          </button>
        </div>
      </div>

    </form>
  );
};

