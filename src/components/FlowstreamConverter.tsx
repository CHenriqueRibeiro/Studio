import React, { useState, useEffect } from 'react';
import {
  ForticsWorkflow,
  ForticsAgent,
  CurlItem,
  ConfiguredWorkflow,
  GenerationRequest,
  LLMProvider,
  HeaderItem
} from '../types/fortics';
import {
  Workflow,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  Code,
  Terminal,
  HelpCircle,
  Plus,
  Trash2,
  Bot,
  ListOrdered,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Code2,
  Key,
  Eye,
  EyeOff,
  Server,
  FileJson,
  CheckCheck,
  GitMerge,
  ArrowRight,
  Columns,
  Edit3,
  Copy,
  FileText
} from 'lucide-react';

export const PROVIDER_MODELS: Record<LLMProvider, Array<{ id: string; name: string; tag?: string }>> = {
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

interface FlowstreamConverterProps {
  onGenerate: (req: GenerationRequest) => Promise<void>;
  isGenerating: boolean;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const FlowstreamConverter: React.FC<FlowstreamConverterProps> = ({
  onGenerate,
  isGenerating,
  showToast
}) => {
  // Mode: Both (Agente + Workflows) vs Workflow Only
  const [studioMode, setStudioMode] = useState<'both' | 'workflow_only'>('both');

  // Total.js FlowStream Raw JSON State
  const [rawJson, setRawJson] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [streamName, setStreamName] = useState<string>('');

  // Provider & Model State
  const [provider, setProvider] = useState<LLMProvider>(() => {
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
  const [showKeyVisible, setShowKeyVisible] = useState<boolean>(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState<boolean>(false);

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

  // Workflow Architecture Mode
  const [workflowArchitectureMode, setWorkflowArchitectureMode] = useState<'single_consolidated' | 'multiple_modular'>('multiple_modular');
  const [showArchitectureGuide, setShowArchitectureGuide] = useState<boolean>(false);

  // Extracted Routes / Workflows from Total.js (each route can have 1 or multiple chained HTTP calls)
  const [routesList, setRoutesList] = useState<ConfiguredWorkflow[]>([]);

  // Optional extra business rules
  const [naturalRules, setNaturalRules] = useState<string>('');

  // Example FlowStream Total.js JSON containing:
  // Route 1: Chained / Aninhado with 2 HTTP Requests (Auth/Token + Search Client)
  // Route 2: Single HTTP Request (List Invoices)
  const loadExampleFlowstream = () => {
    const exampleFlowstream = {
      "id": "flow_exemplo_financeiro",
      "name": "Consulta de Clientes e Faturas",
      "variables": {
        "host": "https://api.empresa.com.br",
        "token": "BEARER_TOKEN_EXEMPLO",
        "app": "FORTICS.AI"
      },
      "design": {
        "trigger_rota_1": {
          "id": "trigger_rota_1",
          "config": {
            "name": "Consultar Cadastro e Contratos",
            "url": "/v1/clientes/consultar",
            "method": "POST"
          },
          "component": "genieragent",
          "connections": {
            "output": [{ "id": "code_login", "index": "input" }]
          }
        },
        "code_login": {
          "id": "code_login",
          "config": {
            "name": "Preparar Token",
            "code": "$.send('output', { app: $.variables('{app}'), secret: 'SECRET_API' });"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "req_auth", "index": "payload" }]
          }
        },
        "req_auth": {
          "id": "req_auth",
          "config": {
            "name": "Obter Token OAuth",
            "url": "{{host}}/v1/auth/token",
            "method": "POST"
          },
          "component": "request",
          "connections": {
            "response": [{ "id": "code_tratar_auth", "index": "input" }]
          }
        },
        "code_tratar_auth": {
          "id": "code_tratar_auth",
          "config": {
            "name": "Armazenar Token",
            "code": "$.variables('bearer', data.access_token);\n$.send('output', { documento: data.body });"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "req_busca_cliente", "index": "payload" }]
          }
        },
        "req_busca_cliente": {
          "id": "req_busca_cliente",
          "config": {
            "name": "Consultar Dados do Cliente",
            "url": "{{host}}/v1/clientes/consultar",
            "method": "POST"
          },
          "component": "request",
          "connections": {
            "response": [{ "id": "code_tratar_cliente", "index": "input" }]
          }
        },
        "code_tratar_cliente": {
          "id": "code_tratar_cliente",
          "config": {
            "name": "Tratar Retorno do Cliente",
            "code": "if(!data.cliente){\n  $.send('output', { status: 'erro', mensagem: 'Cliente não localizado.' });\n} else {\n  $.send('output', { status: 'sucesso', id_cliente: data.cliente.id, nome: data.cliente.nome, contratos: data.cliente.contratos });\n}"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "resp_rota_1", "index": "input" }]
          }
        },
        "resp_rota_1": {
          "id": "resp_rota_1",
          "config": { "type": "json", "code": 200 },
          "component": "tresponse"
        },
        "trigger_rota_2": {
          "id": "trigger_rota_2",
          "config": {
            "name": "Listar Faturas",
            "url": "/v1/financeiro/faturas",
            "method": "POST"
          },
          "component": "genieragent",
          "connections": {
            "output": [{ "id": "code_prep_faturas", "index": "input" }]
          }
        },
        "code_prep_faturas": {
          "id": "code_prep_faturas",
          "config": {
            "name": "Code",
            "code": "$.send('output', { token: $.variables('{token}'), app: $.variables('{app}'), documento: data.body });"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "req_faturas", "index": "payload" }]
          }
        },
        "req_faturas": {
          "id": "req_faturas",
          "config": {
            "name": "Buscar Faturas",
            "url": "{{host}}/v1/financeiro/faturas",
            "method": "POST"
          },
          "component": "request",
          "connections": {
            "response": [{ "id": "code_tratar_faturas", "index": "input" }]
          }
        },
        "code_tratar_faturas": {
          "id": "code_tratar_faturas",
          "config": {
            "name": "Code",
            "code": "if(!data.faturas || data.faturas.length == 0){\n  $.send('output', { status: 'sucesso', mensagem: 'Nenhuma fatura pendente.', faturas: [] });\n} else {\n  $.send('output', { status: 'sucesso', faturas: data.faturas });\n}"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "resp_rota_2", "index": "input" }]
          }
        },
        "resp_rota_2": {
          "id": "resp_rota_2",
          "config": { "type": "json", "code": 200 },
          "component": "tresponse"
        }
      }
    };
    setRawJson(JSON.stringify(exampleFlowstream, null, 2));
    showToast('info', 'Exemplo carregado! Rota 1 detectada como Cadeia Aninhada (2 HTTPs) e Rota 2 com 1 HTTP.');
  };

  // Helper to replace variables like {{host}}, {host}, {token}
  const replaceGlobalVars = (text: string, vars: Record<string, string>): string => {
    if (!text) return '';
    let result = text;
    Object.keys(vars).forEach(vKey => {
      const val = vars[vKey] || '';
      result = result
        .split(`{{${vKey}}}`).join(val)
        .split(`{${vKey}}`).join(val)
        .split(`$.variables("{${vKey}}")`).join(`"${val}"`)
        .split(`$.variables('{${vKey}}')`).join(`"${val}"`)
        .split(`$.variables("${vKey}")`).join(`"${val}"`)
        .split(`$.variables('${vKey}')`).join(`"${val}"`);
    });
    return result;
  };

  // Topological Traversal to extract routes and their chained HTTP requests
  useEffect(() => {
    if (!rawJson.trim()) {
      setParseError(null);
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      const vars: Record<string, string> = parsed.variables || {};
      const design: Record<string, any> = parsed.design || {};

      setStreamName(parsed.name || 'Total.js FlowStream');

      if (Object.keys(design).length === 0) {
        setParseError('Nenhum nó encontrado no campo "design" do JSON.');
        return;
      }

      // Find all Entry triggers (component === 'genieragent' or with config.url & connections.output)
      const entryNodeIds: string[] = [];
      Object.keys(design).forEach(key => {
        const node = design[key];
        if (node.component === 'genieragent' || (node.config && node.config.url && node.connections?.output)) {
          entryNodeIds.push(key);
        }
      });

      if (entryNodeIds.length === 0) {
        const allConnectedTargets = new Set<string>();
        Object.values(design).forEach((n: any) => {
          if (n.connections) {
            Object.values(n.connections).forEach((targets: any) => {
              if (Array.isArray(targets)) {
                targets.forEach(t => allConnectedTargets.add(t.id));
              }
            });
          }
        });
        Object.keys(design).forEach(key => {
          if (!allConnectedTargets.has(key) && design[key].component !== 'print') {
            entryNodeIds.push(key);
          }
        });
      }

      if (entryNodeIds.length === 0) {
        setParseError('Não foi possível identificar nós de entrada no JSON.');
        return;
      }

      setParseError(null);

      // For EACH entry trigger, traverse and collect ALL HTTP requests chained in that branch
      const extractedWorkflows: ConfiguredWorkflow[] = entryNodeIds.map((triggerId, routeIndex) => {
        const triggerNode = design[triggerId];
        const rawPath = (triggerNode.config?.url || `/operacao_${routeIndex + 1}`).replace(/^\/+/, '');
        const cleanName = rawPath
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        const wfName = triggerNode.config?.name || cleanName || `Operação ${routeIndex + 1}`;

        // Topological traversal of this specific route branch
        const visited = new Set<string>();
        const orderedBranchNodes: Array<{ id: string; node: any }> = [];
        const queue = [triggerId];

        while (queue.length > 0) {
          const currId = queue.shift()!;
          if (!currId || visited.has(currId)) continue;
          visited.add(currId);
          const curr = design[currId];
          if (!curr) continue;

          if (curr.component !== 'print') {
            orderedBranchNodes.push({ id: currId, node: curr });
          }

          if (curr.connections) {
            const targets = [
              ...(curr.connections.output || []),
              ...(curr.connections.response || []),
              ...(curr.connections.output1 || []),
              ...(curr.connections.output2 || [])
            ];
            targets.forEach((t: any) => {
              if (t?.id && !visited.has(t.id)) {
                queue.push(t.id);
              }
            });
          }
        }

        // Collect ALL 'request' component nodes in this branch
        const requestNodesInBranch = orderedBranchNodes.filter(c => c.node.component === 'request');
        const codeNodesInBranch = orderedBranchNodes.filter(c => c.node.component === 'code');

        let detectedParam = 'documento';
        if (rawPath.includes('contrato') || rawPath.includes('desbloqueio')) {
          detectedParam = 'contrato';
        }

        // Build curlItems for all request nodes in this route
        let branchCurlItems: CurlItem[] = [];

        if (requestNodesInBranch.length > 0) {
          branchCurlItems = requestNodesInBranch.map((reqItem, stepIdx) => {
            const reqNode = reqItem.node;
            const reqConfig = reqNode.config || {};
            const reqUrl = reqConfig.url ? replaceGlobalVars(reqConfig.url, vars) : `${vars.host || 'https://api.empresa.com.br'}/${rawPath}`;
            const reqMethod = (reqConfig.method || 'POST').toUpperCase();

            let headersList = ['-H "Content-Type: application/json"'];
            if (reqConfig.headers && Object.keys(reqConfig.headers).length > 0) {
              Object.keys(reqConfig.headers).forEach(k => {
                const val = replaceGlobalVars(reqConfig.headers[k], vars);
                headersList.push(`-H "${k}: ${val}"`);
              });
            } else if (stepIdx > 0) {
              headersList.push('-H "Authorization: Bearer {{token.token}}"');
            }

            let bodyPayload = '';
            if (reqUrl.includes('auth') || reqUrl.includes('token') || reqUrl.includes('login')) {
              bodyPayload = JSON.stringify({
                app: vars.app || 'FORTICS.AI',
                secret: 'SECRET_API'
              }, null, 2);
            } else if (vars.token || vars.app) {
              bodyPayload = JSON.stringify({
                app: vars.app || 'FORTICS.AI',
                token: vars.token || 'BEARER_TOKEN',
                [detectedParam]: `{{request.${detectedParam}}}`
              }, null, 2);
            } else {
              bodyPayload = JSON.stringify({
                [detectedParam]: `{{request.${detectedParam}}}`
              }, null, 2);
            }

            const stepName = reqConfig.name || (reqUrl.includes('token') || reqUrl.includes('auth') ? 'Autenticação / Token' : `${wfName} (Etapa ${stepIdx + 1})`);
            const curlString = `curl -X ${reqMethod} "${reqUrl}" \\\n  ${headersList.join(' \\\n  ')} \\\n  -d '${bodyPayload.replace(/\n\s*/g, ' ')}'`;

            let stepResponse = '{\n  "status": "sucesso",\n  "resultado": "Dados processados"\n}';
            if (reqUrl.includes('token') || reqUrl.includes('auth')) {
              stepResponse = '{\n  "access_token": "TOKEN_JWT_EXEMPLO",\n  "expires_in": 3600\n}';
            } else if (reqUrl.includes('faturas')) {
              stepResponse = '{\n  "status": "sucesso",\n  "faturas": [\n    {\n      "id": "1001",\n      "valor": 129.90,\n      "vencimento": "2026-09-10",\n      "status": "aberto"\n    }\n  ]\n}';
            } else if (reqUrl.includes('cliente')) {
              stepResponse = '{\n  "status": "sucesso",\n  "cliente": {\n    "id": 5542,\n    "nome": "João da Silva",\n    "contratos": ["CTR-8812"]\n  }\n}';
            }

            return {
              id: crypto.randomUUID(),
              name: stepName,
              nodeName: stepIdx === 0 && (reqUrl.includes('auth') || reqUrl.includes('token')) ? 'token' : `etapa_${stepIdx + 1}`,
              curl: curlString,
              responseSample: stepResponse,
              filterRules: 'Tratar dados para repasse à próxima etapa ou retorno.'
            };
          });
        } else {
          // If no request node was explicit, create 1 default step
          const finalUri = `${vars.host || 'https://api.empresa.com.br'}/${rawPath}`;
          const bodyPayload = JSON.stringify({ [detectedParam]: `{{request.${detectedParam}}}` }, null, 2);
          branchCurlItems = [{
            id: crypto.randomUUID(),
            name: wfName,
            nodeName: `etapa_1`,
            curl: `curl -X POST "${finalUri}" \\\n  -H "Content-Type: application/json" \\\n  -d '${bodyPayload.replace(/\n\s*/g, ' ')}'`,
            responseSample: '{\n  "status": "sucesso",\n  "resultado": "Operação processada"\n}',
            filterRules: 'Tratar dados para retorno.'
          }];
        }

        return {
          id: crypto.randomUUID(),
          name: wfName,
          description: `Realiza ${wfName.toLowerCase()} utilizando as informações do atendimento.`,
          curlItems: branchCurlItems,
          sampleResponse: branchCurlItems[branchCurlItems.length - 1]?.responseSample,
          filterRules: 'Extrair campos estruturados e formatar para resposta ao cliente.'
        };
      });

      setRoutesList(extractedWorkflows);
      const totalCalls = extractedWorkflows.reduce((acc, r) => acc + r.curlItems.length, 0);
      showToast('success', `✨ ${extractedWorkflows.length} Rotas extraídas do FlowStream (${totalCalls} chamadas HTTP no total)!`);

    } catch (err: any) {
      setParseError(err.message || 'JSON inválido');
    }
  }, [rawJson]);

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    const defaultModel = PROVIDER_MODELS[newProvider][0].id;
    setModel(defaultModel);
  };

  // Route & Step Management
  const handleUpdateRouteName = (routeId: string, newName: string) => {
    setRoutesList(prev => prev.map(r => r.id === routeId ? { ...r, name: newName } : r));
  };

  const handleRemoveRoute = (routeId: string) => {
    setRoutesList(prev => prev.filter(r => r.id !== routeId));
  };

  const handleAddRoute = () => {
    const newRouteNum = routesList.length + 1;
    const newRoute: ConfiguredWorkflow = {
      id: crypto.randomUUID(),
      name: `Nova Operação ${newRouteNum}`,
      description: `Operação ${newRouteNum} do sistema.`,
      curlItems: [
        {
          id: crypto.randomUUID(),
          name: `Etapa 1`,
          curl: `curl -X POST "https://api.empresa.com.br/v1/endpoint" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n  "documento": "{{request.documento}}"\n}'`,
          responseSample: '{\n  "status": "sucesso",\n  "dados": {}\n}',
          filterRules: 'Tratar dados para resposta ao cliente.'
        }
      ]
    };
    setRoutesList(prev => [...prev, newRoute]);
  };

  const handleAddStepToRoute = (routeId: string) => {
    setRoutesList(prev => prev.map(r => {
      if (r.id !== routeId) return r;
      const stepNum = r.curlItems.length + 1;
      const newStep: CurlItem = {
        id: crypto.randomUUID(),
        name: `Etapa ${stepNum} da Cadeia`,
        curl: `curl -X GET "https://api.empresa.com.br/v1/detalhes/{{token.token}}" \\\n  -H "Authorization: Bearer {{token.token}}"`,
        responseSample: '{\n  "status": "sucesso",\n  "detalhes": {}\n}',
        filterRules: 'Tratar dados da etapa.'
      };
      return { ...r, curlItems: [...r.curlItems, newStep] };
    }));
  };

  const handleRemoveStepFromRoute = (routeId: string, stepId: string) => {
    setRoutesList(prev => prev.map(r => {
      if (r.id !== routeId) return r;
      if (r.curlItems.length <= 1) return r; // Keep at least 1 step
      return { ...r, curlItems: r.curlItems.filter(s => s.id !== stepId) };
    }));
  };

  const handleUpdateStep = (routeId: string, stepId: string, field: keyof CurlItem, value: string) => {
    setRoutesList(prev => prev.map(r => {
      if (r.id !== routeId) return r;
      return {
        ...r,
        curlItems: r.curlItems.map(s => s.id === stepId ? { ...s, [field]: value } : s)
      };
    }));
  };

  const getDetectedKeysFromSample = (sampleJson?: string) => {
    if (!sampleJson || !sampleJson.trim()) return { arrayField: '', keys: [] };
    try {
      const parsed = JSON.parse(sampleJson.trim());
      let arrayField = '';
      let itemObj: any = parsed;

      if (Array.isArray(parsed)) {
        itemObj = parsed.length > 0 ? parsed[0] : {};
      } else if (typeof parsed === 'object' && parsed !== null) {
        for (const k of Object.keys(parsed)) {
          if (Array.isArray(parsed[k])) {
            arrayField = k;
            itemObj = parsed[k].length > 0 ? parsed[k][0] : {};
            break;
          } else if (parsed[k] && typeof parsed[k] === 'object') {
            for (const sk of Object.keys(parsed[k])) {
              if (Array.isArray(parsed[k][sk])) {
                arrayField = `${k}.${sk}`;
                itemObj = parsed[k][sk].length > 0 ? parsed[k][sk][0] : {};
                break;
              }
            }
          }
        }
      }

      const keys = (itemObj && typeof itemObj === 'object' && !Array.isArray(itemObj)) ? Object.keys(itemObj) : [];
      return { arrayField, keys };
    } catch {
      return { arrayField: '', keys: [] };
    }
  };

  const handleGenerateStepJsTreatment = (routeId: string, stepId: string, sampleJson?: string, nodeName?: string, userPrompt?: string) => {
    if (!sampleJson || !sampleJson.trim()) {
      showToast('error', 'Cole um exemplo de JSON de resposta antes de gerar o script.');
      return;
    }

    try {
      let parsed: any;
      try {
        parsed = JSON.parse(sampleJson.trim());
      } catch {
        showToast('error', 'O modelo de resposta não é um JSON válido.');
        return;
      }

      let arrayField = '';
      let itemObj: any = parsed;

      if (Array.isArray(parsed)) {
        itemObj = parsed.length > 0 ? parsed[0] : {};
      } else if (typeof parsed === 'object' && parsed !== null) {
        for (const k of Object.keys(parsed)) {
          if (Array.isArray(parsed[k])) {
            arrayField = k;
            itemObj = parsed[k].length > 0 ? parsed[k][0] : {};
            break;
          } else if (parsed[k] && typeof parsed[k] === 'object') {
            for (const sk of Object.keys(parsed[k])) {
              if (Array.isArray(parsed[k][sk])) {
                arrayField = `${k}.${sk}`;
                itemObj = parsed[k][sk].length > 0 ? parsed[k][sk][0] : {};
                break;
              }
            }
          }
        }
      }

      const allKeys = (itemObj && typeof itemObj === 'object' && !Array.isArray(itemObj)) ? Object.keys(itemObj) : [];

      if (allKeys.length === 0) {
        showToast('error', 'Nenhum campo detectado no JSON fornecido.');
        return;
      }

      const promptLower = (userPrompt || '').toLowerCase();
      const removedKeys: string[] = [];
      const includedKeys: string[] = [];

      allKeys.forEach(k => {
        const kLower = k.toLowerCase();
        const removeRegex = new RegExp(`(?:remover|retirar|tirar|sem|descartar|excluir|não quero|nao quero)\\s+(?:o\\s+|a\\s+|os\\s+|as\\s+|campo\\s+)?${kLower}`, 'i');
        if (removeRegex.test(promptLower)) {
          removedKeys.push(k);
        } else if (promptLower.includes(kLower)) {
          includedKeys.push(k);
        }
      });

      let activeFields: string[] = [];
      if (includedKeys.length > 0) {
        activeFields = includedKeys.filter(k => !removedKeys.includes(k));
      } else {
        activeFields = allKeys.filter(k => !removedKeys.includes(k));
      }

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
${activeFields.map(k => `            ${k}: primeiro.${k}`).join(',\n')}
        } : null,
        itens: items.slice(0, ${limitCount})
    };
} catch (e) {
    return { status: 'erro', message: 'Falha ao formatar dados da API', details: e.message };
}`;
      } else {
        generatedScript = `// Script de tratamento gerado com base no Modelo de Resposta e Regras
try {
    let raw = ${respVarName} || _vars.resposta_api;
    if (typeof raw === 'string') raw = JSON.parse(raw);
    let data = (raw && raw.data) ? raw.data : (raw && raw.result) ? raw.result : (raw || {});

    return {
        status: 'sucesso',
        dados: {
${activeFields.map(k => `            ${k}: data.${k}`).join(',\n')}
        }
    };
} catch (e) {
    return { status: 'erro', message: 'Falha ao formatar dados da API', details: e.message };
}`;
      }

      setRoutesList(prev => prev.map(r => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          curlItems: r.curlItems.map(s => s.id === stepId ? {
            ...s,
            filterRules: userPrompt !== undefined ? userPrompt : s.filterRules,
            generatedJsCode: generatedScript
          } : s)
        };
      }));

      showToast('success', 'Script JavaScript de tratamento gerado com sucesso!');
    } catch (err: any) {
      showToast('error', `Erro: ${err.message}`);
    }
  };

  const handleGenerateStepJsFromTargetSchema = (routeId: string, stepId: string, sampleJson?: string, targetSchema?: string, nodeName?: string) => {
    if (!sampleJson || !sampleJson.trim()) {
      showToast('error', 'Cole um exemplo da resposta bruta da API antes de mapear.');
      return;
    }
    if (!targetSchema || !targetSchema.trim()) {
      showToast('error', 'Cole ou digite o modelo do retorno desejado.');
      return;
    }

    try {
      let sourceObj: any;
      try {
        sourceObj = JSON.parse(sampleJson.trim());
      } catch {
        showToast('error', 'O modelo de resposta da API não é um JSON válido.');
        return;
      }

      let arrayField = '';
      let itemObj: any = sourceObj;

      if (Array.isArray(sourceObj)) {
        itemObj = sourceObj.length > 0 ? sourceObj[0] : {};
      } else if (typeof sourceObj === 'object' && sourceObj !== null) {
        for (const k of Object.keys(sourceObj)) {
          if (Array.isArray(sourceObj[k])) {
            arrayField = k;
            itemObj = sourceObj[k].length > 0 ? sourceObj[k][0] : {};
            break;
          } else if (sourceObj[k] && typeof sourceObj[k] === 'object') {
            for (const sk of Object.keys(sourceObj[k])) {
              if (Array.isArray(sourceObj[k][sk])) {
                arrayField = `${k}.${sk}`;
                itemObj = sourceObj[k][sk].length > 0 ? sourceObj[k][sk][0] : {};
                break;
              }
            }
          }
        }
      }

      const sourceKeys = (itemObj && typeof itemObj === 'object') ? Object.keys(itemObj) : [];

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
        showToast('error', 'Nenhum campo identificado no modelo desejado.');
        return;
      }

      const mappingLines: string[] = [];
      targetKeys.forEach(tKey => {
        const tLower = tKey.toLowerCase();
        const exact = sourceKeys.find(s => s.toLowerCase() === tLower);
        const partial = sourceKeys.find(s => s.toLowerCase().includes(tLower) || tLower.includes(s.toLowerCase()));
        const matched = exact || partial || tKey;
        mappingLines.push(`            ${tKey}: principal.${matched} !== undefined ? principal.${matched} : null`);
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
        generatedScript = `// Script de mapeamento para o modelo de saída desejado
try {
    let raw = ${respVarName} || _vars.resposta_api;
    if (typeof raw === 'string') raw = JSON.parse(raw);
    let principal = (raw && raw.data) ? raw.data : (raw && raw.result) ? raw.result : (raw || {});

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

      setRoutesList(prev => prev.map(r => {
        if (r.id !== routeId) return r;
        return {
          ...r,
          curlItems: r.curlItems.map(s => s.id === stepId ? {
            ...s,
            targetOutputModel: targetSchema,
            generatedJsCode: generatedScript
          } : s)
        };
      }));

      showToast('success', 'Mapeamento para o modelo de retorno gerado com sucesso!');
    } catch (err: any) {
      showToast('error', `Erro ao mapear: ${err.message}`);
    }
  };

  const handleToggleStepFieldInPrompt = (routeId: string, stepId: string, currentPrompt: string, fieldName: string, sampleJson?: string, nodeName?: string) => {
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

    handleGenerateStepJsTreatment(routeId, stepId, sampleJson, nodeName, newPrompt.trim());
  };

  // Submit and Generate
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (routesList.length === 0) {
      showToast('error', 'Por favor, cole um JSON válido do FlowStream ou adicione ao menos 1 rota.');
      return;
    }

    const cleanWfName = (raw: string) => (raw || 'Consulta de Informações').replace(/^[0-9.\-_ ]+/, '').trim().toLowerCase();
    const effectiveSteps = [
      'Cumprimentar o cliente e solicitar documento/parâmetro inicial',
      ...routesList.map((r, idx) => {
        const name = cleanWfName(r.name);
        return idx === 0
          ? `Executar a ${name} com o documento informado`
          : `Com o identificador retornado na etapa anterior, executar a ${name}`;
      }),
      'Confirmar os dados e entregar o resultado estruturado ao cliente'
    ].join('\n');

    let activeKey: string | undefined = undefined;
    if (provider === 'openai') {
      activeKey = openaiKey.trim();
      if (!activeKey) {
        showToast('error', 'Por favor, informe sua chave OpenAI API (sk-...) nas configurações de IA.');
        setShowApiKeySettings(true);
        return;
      }
    } else if (provider === 'anthropic') {
      activeKey = anthropicKey.trim();
      if (!activeKey) {
        showToast('error', 'Por favor, informe sua chave Anthropic API (sk-ant-...) nas configurações de IA.');
        setShowApiKeySettings(true);
        return;
      }
    } else if (provider === 'gemini' && geminiKey.trim()) {
      activeKey = geminiKey.trim();
    }

    // Flatten all curlItems for backward compatibility
    const allCurlItems = routesList.flatMap(r => r.curlItems);

    await onGenerate({
      mode: 'new',
      studioMode,
      inputMode: 'workflow_driven',
      businessContext: streamName || 'Atendimento Inteligente integrado via Total.js FlowStream',
      freeformPrompt: '',
      naturalSteps: effectiveSteps,
      naturalRules: naturalRules.trim(),
      provider,
      model,
      apiKey: activeKey,
      temperature: 0.1,
      workflowArchitectureMode,
      configuredWorkflows: routesList,
      curlItems: allCurlItems
    });
  };

  const totalCallsCount = routesList.reduce((acc, r) => acc + r.curlItems.length, 0);

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">

      {/* 1. Header Hero Banner */}
      <div className="bg-[#061833]/80 border border-[#0066FF]/30 rounded-3xl p-6 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-[#020b18] border border-[#0066FF]/40 rounded-2xl text-[#00D2FF] shadow-md">
                <Workflow className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Conversor Total.js para Workflow
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Cole o JSON exportado do <strong>Total.js</strong>. O conversor extrai com precisão as rotas e identifica se uma rota possui <strong>1 chamada REST ou múltiplas chamadas HTTP encadeadas em cadeia (aninhadas)</strong>, gerando os <strong>Workflows (.json)</strong> e o <strong>Agente Oficial Fortics</strong>!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={loadExampleFlowstream}
              className="px-4 py-2 bg-[#020b18] hover:bg-[#0066FF]/20 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-[#0066FF]/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-[#00D2FF]" />
              <span>Carregar Exemplo FlowStream</span>
            </button>
          </div>
        </div>
      </div>

      {/* TOP BOX: Import Total.js FlowStream JSON */}
      <div className="bg-[#040f24] border border-[#0066FF]/30 rounded-2xl p-5 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-white flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#00D2FF]" />
            <span>JSON do FlowStream (Total.js)</span>
          </label>

          {routesList.length > 0 && (
            <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[11px] font-bold rounded-lg flex items-center gap-1">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{routesList.length} Rotas ({totalCallsCount} Chamadas HTTP)</span>
            </span>
          )}
        </div>

        <textarea
          value={rawJson}
          onChange={(e) => setRawJson(e.target.value)}
          rows={6}
          placeholder='Cole aqui o JSON do FlowStream:&#10;{&#10;  "id": "...",&#10;  "name": "Integração API",&#10;  "variables": { "host": "https://...", "token": "..." },&#10;  "design": { ... }&#10;}'
          className="w-full bg-[#020b18] border border-[#0066FF]/30 rounded-xl p-3.5 text-xs font-mono text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-[#00D2FF] transition-all resize-y leading-relaxed"
        />

        {parseError && (
          <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
      </div>

      {/* SEÇÃO 1: MODO DE CRIAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setStudioMode('both')}
          className={`p-4 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3.5 border ${studioMode === 'both'
            ? 'bg-linear-to-r from-[#0066FF] to-[#0052FF] text-white shadow-xl shadow-[#0066FF]/35 border-[#00D2FF]/40'
            : 'bg-[#020b18]/60 text-slate-400 hover:text-slate-200 hover:bg-[#0066FF]/10 border-transparent'
            }`}
        >
          <div className={`p-2.5 rounded-xl ${studioMode === 'both' ? 'bg-white/20 text-white' : 'bg-[#061833] text-[#0066FF]'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Agente + Workflows (Completo)</div>
            <div className="text-[10px] text-slate-300 opacity-90">Gera agente.json e workflows conectados às rotas do Total.js</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStudioMode('workflow_only')}
          className={`p-4 rounded-xl text-left transition-all cursor-pointer flex items-center gap-3.5 border ${studioMode === 'workflow_only'
            ? 'bg-linear-to-r from-[#0066FF] to-[#0052FF] text-white shadow-xl shadow-[#0066FF]/35 border-[#00D2FF]/40'
            : 'bg-[#020b18]/60 text-slate-400 hover:text-slate-200 hover:bg-[#0066FF]/10 border-transparent'
            }`}
        >
          <div className={`p-2.5 rounded-xl ${studioMode === 'workflow_only' ? 'bg-white/20 text-white' : 'bg-[#061833] text-[#00D2FF]'}`}>
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Apenas Workflows (Total.js / REST)</div>
            <div className="text-[10px] text-slate-300 opacity-90">Gera fluxos com instruções, request, REST e retorno</div>
          </div>
        </button>
      </div>

      {/* SEÇÃO 2: MOTOR DE IA & PROVEDOR */}
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
                  ? 'Utilizando o motor Gemini integrado ao servidor local.'
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

        {/* Provedor Ativo & Seletor de Modelo */}
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
                placeholder="ID exato do modelo (ex: gpt-5.6-sol)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Chaves de API */}
        {showApiKeySettings && (
          <div className="pt-3 mt-3 border-t border-slate-800/80 space-y-3">
            {provider === 'openai' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>Chave da OpenAI (sk-...)</span>
                </label>
                <input
                  type={showKeyVisible ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={e => setOpenaiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-blue-300 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {provider === 'anthropic' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  <span>Chave da Anthropic (sk-ant-...)</span>
                </label>
                <input
                  type={showKeyVisible ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={e => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* SEÇÃO 3: ORQUESTRAÇÃO DO AGENTE (AUTOMÁTICA PELOS WORKFLOWS) */}
      {studioMode === 'both' && (
        <div className="space-y-3 pt-2">
          <div className="p-4 bg-[#061833]/90 border border-[#0066FF]/40 rounded-2xl space-y-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#00D2FF]" />
                <span>Orquestração do Agente (100% Automática pelas Rotas do Total.js)</span>
              </label>
              <span className="px-2.5 py-0.5 bg-[#0066FF]/20 border border-[#0066FF]/40 text-[#00D2FF] text-[10px] font-bold rounded-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Fluxo Deduzido Automaticamente</span>
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              O comportamento do robô, a ordem de coleta de dados e as ferramentas acionadas são orquestradas automaticamente a partir das rotas extraídas do FlowStream.
            </p>

            {/* Preview em Tempo Real dos Passos */}
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

                {routesList.map((r, idx) => {
                  const cleanName = (r.name || `Operação ${idx + 1}`).replace(/^[0-9.\-_ ]+/, '').trim();
                  const isChained = r.curlItems.length > 1;
                  return (
                    <div key={r.id || idx} className="flex items-center gap-2 text-cyan-200">
                      <span className="w-5 h-5 rounded-full bg-[#0066FF]/70 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{idx + 2}</span>
                      <span>
                        {idx === 0
                          ? <>Executar a <strong>{cleanName.toLowerCase()}</strong> com o documento informado {isChained && <span className="text-[10px] text-amber-400 font-sans">({r.curlItems.length} chamadas em cadeia interna)</span>}</>
                          : <>Com o identificador retornado na etapa anterior, executar a <strong>{cleanName.toLowerCase()}</strong> {isChained && <span className="text-[10px] text-amber-400 font-sans">({r.curlItems.length} chamadas em cadeia interna)</span>}</>
                        }
                      </span>
                    </div>
                  );
                })}

                <div className="flex items-center gap-2 text-emerald-300">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">{routesList.length + 2}</span>
                  <span>Confirmar os dados e entregar o resultado estruturado ao cliente</span>
                </div>
              </div>
            </div>

            {/* Campo Opcional para Regras Adicionais */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Regras Extras de Negócio & Diretrizes (Opcional)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">other_rules</span>
              </label>
              <textarea
                rows={3}
                value={naturalRules}
                onChange={e => setNaturalRules(e.target.value)}
                placeholder="Ex: - Aceitar CPF com 11 dígitos com ou sem pontuação (XXX.XXX.XXX-XX ou apenas números)&#10;- Não inventar informações além do retornado pela ferramenta..."
                className="w-full bg-[#020b18] border border-[#0066FF]/30 rounded-xl p-3 text-xs text-amber-200 font-sans leading-relaxed focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 4: ROTAS E WORKFLOWS EXTRAÍDOS DO TOTAL.JS */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#00D2FF]" />
            <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Rotas Extraídas do FlowStream ({routesList.length} Workflows / {totalCallsCount} Chamadas HTTP)
            </label>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Architecture Switcher */}
            <div className="flex items-center bg-[#061325] p-1 rounded-full border border-[#0066FF]/30 text-[11px]">
              <button
                type="button"
                onClick={() => setWorkflowArchitectureMode('multiple_modular')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${workflowArchitectureMode === 'multiple_modular'
                  ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/40'
                  : 'text-slate-300 hover:text-white'
                  }`}
              >
                <Workflow className="w-3.5 h-3.5" />
                <span>Workflows Separados (1 para Cada Rota do Total.js)</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkflowArchitectureMode('single_consolidated')}
                className={`px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer flex items-center gap-1.5 ${workflowArchitectureMode === 'single_consolidated'
                  ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/40'
                  : 'text-slate-300 hover:text-white'
                  }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1 Único Workflow Consolidado (Tudo em 1 Cadeia)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowArchitectureGuide(!showArchitectureGuide)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${showArchitectureGuide
                ? 'bg-[#0066FF] text-white border-[#00D2FF]'
                : 'bg-[#020b18] hover:bg-[#0066FF]/20 text-[#00D2FF] border-[#0066FF]/40'
                }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Tira-Dúvidas</span>
            </button>

            <button
              type="button"
              onClick={handleAddRoute}
              className="px-4 py-1.5 rounded-full bg-[#020b18] hover:bg-[#0066FF]/20 text-white border border-[#0066FF]/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-[#00D2FF]" />
              <span>Adicionar Mais 1 Rota</span>
            </button>
          </div>
        </div>

        {/* Tira Dúvidas Guia */}
        {showArchitectureGuide && (
          <div className="bg-[#061833]/95 border border-[#0066FF]/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#0066FF]/25 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#020b18] text-[#00D2FF] border border-[#0066FF]/40">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Guia do Conversor Total.js: Workflows Separados vs Em Cadeia
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
              <div className="p-3.5 rounded-xl bg-[#020b18]/80 border border-[#0066FF]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00D2FF]">
                  <Workflow className="w-4 h-4" />
                  <span>Workflows Separados (Padrão Recomendado para Total.js)</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Cada rota independente do Total.js vira 1 arquivo <code className="text-[#00D2FF]">workflow.json</code> próprio. Se uma rota contiver 2 ou mais HTTP Requests (ex: Auth + Busca), ela já é gerada <strong>internamente em cadeia (aninhada)</strong> dentro do seu próprio workflow!
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#020b18]/80 border border-[#0066FF]/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8]">
                  <Layers className="w-4 h-4" />
                  <span>1 Único Workflow Consolidado</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Unifica todas as rotas e todas as chamadas de API em uma única esteira contínua dentro de 1 único <code className="text-[#00D2FF]">workflow.json</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cards de Rotas Extraídas */}
        <div className="space-y-6">
          {routesList.map((route, routeIdx) => {
            const isChained = route.curlItems.length > 1;

            return (
              <div
                key={route.id || routeIdx}
                className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-5 space-y-4 hover:border-[#00D2FF]/50 transition-all shadow-lg"
              >
                {/* Route Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0066FF]/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-[#0066FF] flex items-center justify-center text-xs font-black text-white shrink-0">
                      {routeIdx + 1}
                    </span>
                    <div>
                      <input
                        type="text"
                        value={route.name}
                        onChange={e => handleUpdateRouteName(route.id, e.target.value)}
                        placeholder={`Nome da Rota / Workflow ${routeIdx + 1}`}
                        className="bg-transparent border-b border-[#0066FF]/30 px-2 py-0.5 text-sm font-bold text-white focus:border-[#00D2FF] focus:outline-none min-w-[240px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {isChained ? (
                      <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-full flex items-center gap-1.5">
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>⚡ Cadeia com {route.curlItems.length} Chamadas HTTP Aninhadas</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>1 Chamada HTTP</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAddStepToRoute(route.id)}
                      className="px-3 py-1 bg-[#020b18] hover:bg-[#0066FF]/20 text-[#00D2FF] border border-[#0066FF]/40 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      title="Adicionar outra chamada HTTP encadeada nesta rota"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar Etapa HTTP</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveRoute(route.id)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remover esta rota"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub-steps (curlItems) of this Route */}
                <div className="space-y-3.5 pl-2">
                  {route.curlItems.map((step, stepIdx) => (
                    <div
                      key={step.id || stepIdx}
                      className="bg-[#020b18]/80 border border-[#0066FF]/25 rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0066FF]/15 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[#00D2FF] bg-[#061325] px-2 py-0.5 rounded-md border border-[#0066FF]/30">
                            Etapa {routeIdx + 1}.{stepIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={step.name}
                            onChange={e => handleUpdateStep(route.id, step.id, 'name', e.target.value)}
                            placeholder="Nome da Chamada HTTP"
                            className="bg-transparent text-xs font-semibold text-slate-200 focus:text-white border-b border-transparent focus:border-[#00D2FF] focus:outline-none px-1"
                          />
                        </div>

                        {route.curlItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStepFromRoute(route.id, step.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 text-xs cursor-pointer"
                            title="Remover esta etapa da cadeia"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* cURL Field */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-[#00D2FF] uppercase tracking-wider flex items-center gap-1.5">
                          <Terminal className="w-3 h-3" />
                          <span>Comando cURL da Etapa {stepIdx + 1}</span>
                        </label>
                        <textarea
                          rows={3}
                          value={step.curl}
                          onChange={e => handleUpdateStep(route.id, step.id, 'curl', e.target.value)}
                          className="w-full bg-[#040f24] border border-[#0066FF]/20 rounded-xl p-2.5 text-xs font-mono text-cyan-200 placeholder:text-slate-600 focus:border-[#00D2FF] focus:outline-none leading-relaxed"
                        />
                      </div>

                      {/* Bloco 2: Modelo de Resposta da API (JSON de Exemplo) - SEMPRE PRESENTE */}
                      <div className="space-y-1 pt-1">
                        <label className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3 h-3" />
                            Modelo de Resposta da API (JSON de Exemplo)
                          </span>
                          <span className="text-[9px] text-slate-400 font-sans normal-case">
                            Cole o retorno bruto (Postman / Swagger)
                          </span>
                        </label>
                        <textarea
                          rows={4}
                          value={step.responseSample || ''}
                          onChange={e => handleUpdateStep(route.id, step.id, 'responseSample', e.target.value)}
                          placeholder={`{\n  "status": "success",\n  "clientes": [\n    { "nome": "CARLOS", "cpfcnpj": "12345678900", "contratos": [{ "id": 101, "status": "ATIVO" }] }\n  ]\n}`}
                          className="w-full bg-[#020b18] border border-[#0066FF]/30 rounded-xl p-2.5 text-xs text-emerald-200 font-mono leading-relaxed focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Bloco 3: Formas de Tratar o Retorno da API (3 Abas) */}
                      <div className="space-y-2 pt-2 border-t border-[#0066FF]/20">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            Como Tratar esse Retorno no Nó de Código?
                          </label>
                          <div className="flex items-center gap-1 p-0.5 bg-[#020b18] border border-[#0066FF]/30 rounded-lg">
                            <button
                              type="button"
                              onClick={() => {
                                handleUpdateStep(route.id, step.id, 'treatmentMode', 'auto_ai');
                                if (step.responseSample) handleGenerateStepJsTreatment(route.id, step.id, step.responseSample, step.name);
                              }}
                              className={`py-1 px-2 rounded-md text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                (!step.treatmentMode || step.treatmentMode === 'auto_ai')
                                  ? 'bg-linear-to-r from-[#0052FF] to-[#00D2FF] text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                              <span>1. IA Automática</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStep(route.id, step.id, 'treatmentMode', 'natural_language')}
                              className={`py-1 px-2 rounded-md text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                step.treatmentMode === 'natural_language'
                                  ? 'bg-linear-to-r from-amber-600 to-amber-400 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Edit3 className="w-2.5 h-2.5 text-amber-300" />
                              <span>2. Linguagem Natural</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStep(route.id, step.id, 'treatmentMode', 'target_schema')}
                              className={`py-1 px-2 rounded-md text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                step.treatmentMode === 'target_schema'
                                  ? 'bg-linear-to-r from-emerald-600 to-teal-400 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Columns className="w-2.5 h-2.5 text-emerald-300" />
                              <span>3. Modelo de Saída</span>
                            </button>
                          </div>
                        </div>

                        {/* OPÇÃO 1: IA AUTOMÁTICA */}
                        {(!step.treatmentMode || step.treatmentMode === 'auto_ai') && (
                          <div className="p-3 rounded-xl bg-[#020b18]/80 border border-[#0066FF]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-[#0066FF]/20 border border-[#00D2FF]/30 flex items-center justify-center shrink-0">
                                <Bot className="w-3.5 h-3.5 text-[#00D2FF]" />
                              </div>
                              <div className="text-[11px] text-slate-300">
                                Extração 100% Automática a partir do Modelo de Resposta.
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleGenerateStepJsTreatment(route.id, step.id, step.responseSample, step.name)}
                              className="px-2.5 py-1 rounded-lg bg-linear-to-r from-[#0052FF] to-[#00D2FF] hover:brightness-110 text-white text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                            >
                              <Sparkles className="w-3 h-3 text-cyan-200 animate-pulse" />
                              <span>Gerar JS do Modelo</span>
                            </button>
                          </div>
                        )}

                        {/* OPÇÃO 2: LINGUAGEM NATURAL */}
                        {step.treatmentMode === 'natural_language' && (
                          <div className="space-y-2 p-2.5 rounded-xl bg-[#020b18]/80 border border-amber-500/25">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Edit3 className="w-3 h-3" />
                                O que Extrair / Modificar (Linguagem Natural)
                              </label>
                              <button
                                type="button"
                                onClick={() => handleGenerateStepJsTreatment(route.id, step.id, step.responseSample, step.name, step.filterRules)}
                                className="px-2 py-0.5 rounded-md bg-linear-to-r from-amber-500/20 via-emerald-500/20 to-[#00D2FF]/20 hover:from-amber-500/30 hover:to-[#00D2FF]/30 border border-amber-400/40 text-amber-300 hover:text-white text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
                                <span>Atualizar Script JS</span>
                              </button>
                            </div>

                            <textarea
                              rows={2}
                              value={step.filterRules || ''}
                              onChange={e => handleUpdateStep(route.id, step.id, 'filterRules', e.target.value)}
                              placeholder={`Ex: Extrair nome, CPF e contratos ativos. Remover o campo tipo e endereço.`}
                              className="w-full bg-[#030e20] border border-amber-500/30 rounded-xl p-2 text-xs text-amber-200 font-sans leading-relaxed focus:border-amber-400 focus:outline-none"
                            />

                            {/* Chips de campos detectados */}
                            {(() => {
                              const detected = getDetectedKeysFromSample(step.responseSample);
                              if (detected.keys.length === 0) return null;
                              return (
                                <div className="pt-0.5">
                                  <div className="text-[9px] text-slate-400 font-sans mb-1">Campos detectados no JSON (clique para incluir/remover):</div>
                                  <div className="flex flex-wrap gap-1 max-h-14 overflow-y-auto">
                                    {detected.keys.map(k => {
                                      const isRemoved = (step.filterRules || '').toLowerCase().includes(`remover ${k.toLowerCase()}`) || (step.filterRules || '').toLowerCase().includes(`sem ${k.toLowerCase()}`);
                                      return (
                                        <button
                                          key={k}
                                          type="button"
                                          onClick={() => handleToggleStepFieldInPrompt(route.id, step.id, step.filterRules || '', k, step.responseSample, step.name)}
                                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all cursor-pointer border ${
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
                        {step.treatmentMode === 'target_schema' && (
                          <div className="space-y-2 p-2.5 rounded-xl bg-[#020b18]/80 border border-teal-500/25">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-[10px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                                <Columns className="w-3 h-3" />
                                Modelo de Saída Desejado (JSON ou Texto)
                              </label>
                              <button
                                type="button"
                                onClick={() => handleGenerateStepJsFromTargetSchema(route.id, step.id, step.responseSample, step.targetOutputModel, step.name)}
                                className="px-2 py-0.5 rounded-md bg-linear-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-teal-400/40 text-teal-300 hover:text-white text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Sparkles className="w-2.5 h-2.5 text-teal-300 animate-pulse" />
                                <span>Mapear Retorno (Gerar JS)</span>
                              </button>
                            </div>

                            <textarea
                              rows={3}
                              value={step.targetOutputModel || ''}
                              onChange={e => handleUpdateStep(route.id, step.id, 'targetOutputModel', e.target.value)}
                              placeholder={`Cole o formato desejado:\n{\n  "nome": "string",\n  "cpf": "string"\n}`}
                              className="w-full bg-[#030e20] border border-teal-500/30 rounded-xl p-2 text-xs text-teal-200 font-mono leading-relaxed focus:border-teal-400 focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Bloco 4: Script JavaScript Gerado no Nó de Código (tratar_dados) */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-[#00D2FF] uppercase tracking-wider flex items-center gap-1.5">
                              <Code2 className="w-3 h-3" />
                              Script JavaScript Gerado no Nó de Código (tratar_{step.nodeName || `etapa_${stepIdx + 1}`})
                            </label>
                            {step.generatedJsCode && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(step.generatedJsCode || '');
                                  showToast('success', 'Script copiado!');
                                }}
                                className="px-2 py-0.5 rounded bg-[#061833] hover:bg-[#0b2854] border border-[#0066FF]/30 text-slate-300 hover:text-white text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Copy className="w-2.5 h-2.5 text-[#00D2FF]" />
                                <span>Copiar Código</span>
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={4}
                            value={step.generatedJsCode || ''}
                            onChange={e => handleUpdateStep(route.id, step.id, 'generatedJsCode', e.target.value)}
                            placeholder={`// O script JavaScript do nó de código aparecerá aqui automaticamente com base no Modelo de Resposta e no modo selecionado.`}
                            className="w-full bg-[#010814] border border-[#0066FF]/30 rounded-xl p-2.5 text-xs text-amber-200 font-mono leading-relaxed focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BOTÃO CENTRALIZADO DE AÇÃO */}
      <div className="sticky bottom-4 z-40 flex justify-center items-center pt-4">
        <button
          type="submit"
          disabled={isGenerating || routesList.length === 0}
          className="px-10 py-3.5 bg-linear-to-r from-[#0052FF] via-[#0066FF] to-[#00D2FF] hover:brightness-110 disabled:opacity-50 text-white rounded-full text-sm font-black transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl shadow-[#0066FF]/40 hover:shadow-[#00D2FF]/50 transform hover:-translate-y-0.5 border border-[#00D2FF]/40"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Gerando Estruturas Oficiais Fortics...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-current text-amber-300" />
              <span>
                {studioMode === 'both'
                  ? `Gerar Agente e ${routesList.length} Workflows do Total.js (${totalCallsCount} APIs)`
                  : `Gerar ${routesList.length} Workflows do Total.js (${totalCallsCount} APIs)`}
              </span>
            </>
          )}
        </button>
      </div>

    </form>
  );
};
