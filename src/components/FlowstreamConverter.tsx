import React, { useState, useEffect, useMemo } from 'react';
import { 
  ForticsWorkflow, 
  ForticsFlowNode,
  InstructionsNode,
  CodeNode,
  RestNode,
  RouteReturnNode,
  HeaderItem,
  ForticsAgent
} from '../types/fortics';
import { 
  Workflow, 
  Layers, 
  FileCode2, 
  Download, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Upload, 
  FileJson,
  Eye,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  Edit3,
  Code,
  Terminal,
  Settings,
  HelpCircle,
  Play,
  CornerDownRight,
  ListFilter,
  Plus,
  Trash2,
  Bot,
  ListOrdered,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Boxes,
  CheckCheck,
  ArrowDownLeft,
  ArrowUpRight,
  LogIn,
  LogOut
} from 'lucide-react';

interface FlowstreamConverterProps {
  onWorkflowsConverted?: (workflows: ForticsWorkflow[]) => void;
  onAgentAndWorkflowsGenerated?: (agent: ForticsAgent, workflows: ForticsWorkflow[]) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export interface WorkflowArg {
  id: string;
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

interface RouteConfigDraft {
  id: string;
  originalTriggerId: string;
  name: string;
  routePath: string;
  routeMethod: string;
  args: WorkflowArg[];
  paramName: string;
  paramType: string;
  paramDesc: string;
  instructionsTitle: string;
  instructionsDesc: string;
  instructionsReturns: string;
  restUri: string;
  restMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  restHeaders: HeaderItem[];
  restBody: string;
  requestCode: string;
  tratarCode: string;
  returnStatusCode: string;
  curlInput?: string;
  sampleOutput?: string;
}

export const FlowstreamConverter: React.FC<FlowstreamConverterProps> = ({
  onWorkflowsConverted,
  onAgentAndWorkflowsGenerated,
  showToast
}) => {
  const [rawJson, setRawJson] = useState<string>('');
  const [routeDrafts, setRouteDrafts] = useState<RouteConfigDraft[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAgent, setCopiedAgent] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showAdvancedScriptMode, setShowAdvancedScriptMode] = useState<boolean>(false);
  const [activeViewTab, setActiveViewTab] = useState<'workflows' | 'agent' | 'json'>('workflows');

  // Unified Freeform Prompt (Texto Livre Geral)
  const [promptMode, setPromptMode] = useState<'freeform' | 'structured'>('freeform');
  const [freeformPrompt, setFreeformPrompt] = useState<string>(
`Atendimento Inteligente de Suporte e Autoatendimento Provedor:
- Cumprimentar o cliente com cordialidade e pedir o nome caso não esteja identificado
- Solicitar o CPF ou CNPJ do titular do contrato
- Executar a consulta cadastral no SGP usando o CPF/CNPJ informado
- Apresentar ao cliente o seu nome e os contratos ativos localizados
- Perguntar como pode ajudar (ex: 2ª via de fatura, diagnóstico de conexão ou suporte)
- Se o cliente solicitar 2ª via, consultar as faturas em aberto e enviar o link/código de barras
- Finalizar o atendimento com cordialidade e confirmação

Regras e Diretrizes do Atendimento:
- Validar o CPF (11 dígitos) ou CNPJ (14 dígitos) antes de chamar qualquer integração
- Sempre confirmar com o cliente antes de executar ações financeiras ou alterações cadastrais
- Nunca inventar dados; repassar estritamente o que foi retornado pelas consultas da API
- Se o cliente solicitar atendente humano ou relatar cancelamento, responder SOMENTE #SUPORTE_HUMANO`
  );

  // Split Step / Rules for Structured view
  const [agentSteps, setAgentSteps] = useState<string>(
`- Cumprimentar o cliente e identificar pelo nome
- Pedir o CPF ou CNPJ do titular do contrato
- Consultar o cadastro do cliente no SGP via integração
- Exibir os contratos ativos encontrados
- Consultar as faturas em aberto caso o cliente solicite 2ª via
- Finalizar o atendimento com cordialidade`
  );

  const [agentRules, setAgentRules] = useState<string>(
`- O CPF deve ser validado e conter 11 dígitos numéricos
- O CNPJ deve ser validado e conter 14 dígitos numéricos
- Solicitar confirmação expressa do cliente antes de gravar ou emitir dados
- Se o cliente solicitar atendente humano, retornar SOMENTE #SUPORTE_HUMANO
- Respeitar escopo mono skill e manter foco estrito no atendimento`
  );

  const [globalVars, setGlobalVars] = useState<Record<string, string>>({});
  const [streamName, setStreamName] = useState<string>('');

  // Automatically update steps/rules when freeform text changes
  const handleFreeformPromptChange = (text: string) => {
    setFreeformPrompt(text);
    
    // Smart heuristic separation
    const lower = text.toLowerCase();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    const stepsList: string[] = [];
    const rulesList: string[] = [];
    let isRuleSection = false;

    lines.forEach(line => {
      const lineLower = line.toLowerCase();
      if (lineLower.includes('regra') || lineLower.includes('validação') || lineLower.includes('diretrizes') || lineLower.includes('como fazer')) {
        isRuleSection = true;
        return;
      }
      if (lineLower.includes('passo') || lineLower.includes('o que fazer') || lineLower.includes('fluxo')) {
        isRuleSection = false;
        return;
      }

      if (isRuleSection) {
        rulesList.push(line.startsWith('-') ? line : `- ${line}`);
      } else {
        stepsList.push(line.startsWith('-') ? line : `- ${line}`);
      }
    });

    if (stepsList.length > 0) setAgentSteps(stepsList.join('\n'));
    if (rulesList.length > 0) setAgentRules(rulesList.join('\n'));
  };

  // Example SGP Total.js JSON for instant 1-click test
  const loadExampleSgp = () => {
    const exampleSgp = {
      "id": "fJ6RT2j1ck61f",
      "name": "SGP - Provedor e URA",
      "variables": {
        "app": "SZ.CHAT",
        "token": "61273fe0-88be-488f-b9d6-4731771316f9",
        "host": "https://www.centralbutanonet.com.br",
        "super_usuario": "QWdlbnRlX1ZpcnR1YWw6enVzZ3l4LWZ5bnB5My1LdXhweW0="
      },
      "design": {
        "imbuukc67": {
          "id": "imbuukc67",
          "config": {
            "url": "/consultar_cliente_documento",
            "method": "POST"
          },
          "component": "genieragent",
          "connections": {
            "output": [{ "id": "imbuukyhi", "index": "input" }]
          }
        },
        "imbuukyhi": {
          "id": "imbuukyhi",
          "config": {
            "outputs": 2,
            "name": "Code",
            "code": "if (typeof data.body === \"number\") { data.body = String(data.body); }\nif (!data.body) {\n  $.send('output2', { status: 'erro', mensagem: 'O CPF ou CNPJ deve ser informado.' });\n} else {\n  $.send('output', { token: $.variables('{token}'), app: $.variables('{app}'), cpfcnpj: data.body });\n}"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "imbuulh39", "index": "payload" }]
          }
        },
        "imbuulh39": {
          "id": "imbuulh39",
          "config": {
            "url": "{{host}}/api/ura/clientes/",
            "method": "POST",
            "headers": {},
            "serialize": "json",
            "send": "response"
          },
          "component": "request",
          "connections": {
            "response": [{ "id": "imbuumq9f", "index": "input" }]
          }
        },
        "imbuumq9f": {
          "id": "imbuumq9f",
          "config": {
            "name": "Code",
            "code": "if(!data.clientes || data.clientes.length == 0){\n  $.send('output', { status: 'erro', mensagem: 'Cliente não encontrado com o documento informado.' });\n} else {\n  const cliente = data.clientes[0];\n  $.send('output', { id_cliente: cliente.id, nome: cliente.nome, contratos: cliente.contratos });\n}"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "imbuumva9", "index": "input" }]
          }
        },
        "imbuumva9": {
          "id": "imbuumva9",
          "config": { "type": "json", "code": 200 },
          "component": "tresponse"
        },
        "imbux3iru": {
          "id": "imbux3iru",
          "config": {
            "url": "/consultar_faturas_documento",
            "method": "POST"
          },
          "component": "genieragent",
          "connections": {
            "output": [{ "id": "imbux3irx", "index": "input" }]
          }
        },
        "imbux3irx": {
          "id": "imbux3irx",
          "config": {
            "outputs": 2,
            "name": "Code",
            "code": "$.send('output', { token: $.variables('{token}'), app: $.variables('{app}'), cpfcnpj: data.body });"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "imbux3irv", "index": "payload" }]
          }
        },
        "imbux3irv": {
          "id": "imbux3irv",
          "config": {
            "url": "{{host}}/api/ura/fatura2via/",
            "method": "POST"
          },
          "component": "request",
          "connections": {
            "response": [{ "id": "imbux3irz", "index": "input" }]
          }
        },
        "imbux3irz": {
          "id": "imbux3irz",
          "config": {
            "name": "Code",
            "code": "if(!data.links || data.links.length == 0){\n  $.send('output', { status: 'ok', mensagem: 'Nenhuma fatura em aberto encontrada.', faturas: [] });\n} else {\n  $.send('output', { status: 'sucesso', faturas: data.links });\n}"
          },
          "component": "code",
          "connections": {
            "output": [{ "id": "imbux3iry", "index": "input" }]
          }
        },
        "imbux3iry": {
          "id": "imbux3iry",
          "config": { "type": "json", "code": 200 },
          "component": "tresponse"
        }
      }
    };
    setRawJson(JSON.stringify(exampleSgp, null, 2));
    showToast('info', 'Exemplo SGP carregado! 2 Workflows extraídos automaticamente.');
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

  // Auto-parse on rawJson change
  useEffect(() => {
    if (!rawJson.trim()) {
      setRouteDrafts([]);
      setParseError(null);
      return;
    }

    try {
      const parsed = JSON.parse(rawJson);
      const vars: Record<string, string> = parsed.variables || {};
      const design: Record<string, any> = parsed.design || {};
      
      setGlobalVars(vars);
      setStreamName(parsed.name || 'Total.js FlowStream');

      if (Object.keys(design).length === 0) {
        setParseError('Nenhum nó encontrado no campo "design" do JSON.');
        setRouteDrafts([]);
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
        setRouteDrafts([]);
        return;
      }

      setParseError(null);

      // Create Route Drafts with clean, friendly Portuguese descriptions
      const drafts: RouteConfigDraft[] = entryNodeIds.map((triggerId, routeIndex) => {
        const triggerNode = design[triggerId];
        const rawPath = (triggerNode.config?.url || `/operacao_${routeIndex + 1}`).replace(/^\/+/, '');
        const routeMethod = (triggerNode.config?.method || 'POST').toUpperCase();
        
        const cleanName = rawPath
          .replace(/_/g, ' ')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
        const wfName = `SGP - ${cleanName || `Operação ${routeIndex + 1}`}`;

        // Traverse down the chain
        const visited = new Set<string>();
        const chainNodes: Array<{ id: string; node: any }> = [];
        
        const traverse = (nodeId: string) => {
          if (!nodeId || visited.has(nodeId)) return;
          visited.add(nodeId);
          const curr = design[nodeId];
          if (!curr) return;
          
          if (curr.component !== 'print') {
            chainNodes.push({ id: nodeId, node: curr });
          }

          if (curr.connections) {
            const mainTargets = [
              ...(curr.connections.output || []),
              ...(curr.connections.response || []),
              ...(curr.connections.output1 || [])
            ];
            mainTargets.forEach((t: any) => {
              if (t && t.id) traverse(t.id);
            });
          }
        };

        traverse(triggerId);

        const requestNodes = chainNodes.filter(c => c.node.component === 'request');
        const codeNodes = chainNodes.filter(c => c.node.component === 'code');
        const responseNodes = chainNodes.filter(c => c.node.component === 'tresponse');

        // Parameter detection
        const firstCode = codeNodes[0]?.node?.config?.code || '';
        let detectedParam = 'cpfcnpj';
        let paramDesc = 'CPF ou CNPJ do titular apenas números ou formatado.';
        let userFacingPurpose = 'Consulta os dados cadastrais do cliente no SGP pelo CPF/CNPJ.';
        let expectedReturns = 'ID do cliente, nome completo e lista de contratos ativos.';
        
        if (rawPath.includes('fatura') || firstCode.includes('fatura')) {
          detectedParam = 'cpfcnpj';
          paramDesc = 'CPF ou CNPJ do titular do contrato.';
          userFacingPurpose = 'Consulta faturas e 2ª via de boleto/Pix em aberto.';
          expectedReturns = 'Lista de faturas, links para 2ª via e linha digitável.';
        } else if (rawPath.includes('desbloqueio') || rawPath.includes('confianca')) {
          detectedParam = 'contrato';
          paramDesc = 'ID ou número do contrato do cliente.';
          userFacingPurpose = 'Realiza a liberação em confiança / desbloqueio de conexão.';
          expectedReturns = 'Status da solicitação de desbloqueio e mensagem.';
        } else if (rawPath.includes('cliente') || rawPath.includes('documento')) {
          detectedParam = 'cpfcnpj';
          paramDesc = 'CPF ou CNPJ do titular apenas números.';
          userFacingPurpose = 'Consulta dados do cliente e contratos ativos no sistema.';
          expectedReturns = 'ID do cliente, nome completo e contratos.';
        }

        // REST URL & Body
        let finalUri = `${vars.host || 'https://www.centralbutanonet.com.br'}/${rawPath}`;
        let restHeaders: HeaderItem[] = [{ key: 'Content-Type', value: 'application/json' }];
        let restBody = '';
        let finalMethod: any = routeMethod || 'POST';

        if (requestNodes.length > 0) {
          const reqNode = requestNodes[0].node;
          const reqConfig = reqNode.config || {};
          if (reqConfig.url) {
            finalUri = replaceGlobalVars(reqConfig.url, vars);
          }
          if (reqConfig.method) {
            finalMethod = reqConfig.method.toUpperCase();
          }
          if (reqConfig.headers && Object.keys(reqConfig.headers).length > 0) {
            restHeaders = Object.keys(reqConfig.headers).map(k => ({
              key: k,
              value: replaceGlobalVars(reqConfig.headers[k], vars)
            }));
          }
        }

        // Default Body with token/app
        if (vars.token || vars.app) {
          restBody = JSON.stringify({
            app: vars.app || 'SZ.CHAT',
            token: vars.token || '',
            [detectedParam]: `{{request.${detectedParam}}}`
          }, null, 2);
        } else {
          restBody = JSON.stringify({
            [detectedParam]: `{{request.${detectedParam}}}`
          }, null, 2);
        }

        // Script Tratar Dados
        const lastCodeNode = codeNodes[codeNodes.length - 1];
        let tratarCodeScript = '';
        if (lastCodeNode?.node?.config?.code) {
          let originalJs = lastCodeNode.node.config.code;
          originalJs = originalJs
            .replace(/\$\.send\('output',\s*([\s\S]*?)\);?\s*(?:\$\.destroy\(\);?)?/g, 'return $1;')
            .replace(/\$\.send\("output",\s*([\s\S]*?)\);?\s*(?:\$\.destroy\(\);?)?/g, 'return $1;')
            .replace(/\$\.send\('output2',\s*([\s\S]*?)\);?\s*(?:\$\.destroy\(\);?)?/g, 'return $1;')
            .replace(/\$\.send\("output2",\s*([\s\S]*?)\);?\s*(?:\$\.destroy\(\);?)?/g, 'return $1;')
            .replace(/\$\.destroy\(\);?/g, '')
            .replace(/data\./g, 'raw.');

          tratarCodeScript = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n\n${originalJs}\n} catch (e) {\n    return {\n        status: 'erro',\n        mensagem: 'Erro ao processar dados da API.',\n        detalhes: String(e)\n    };\n}`;
        } else {
          tratarCodeScript = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    return {\n        status: 'sucesso',\n        dados: raw\n    };\n} catch (e) {\n    return { status: 'erro', details: String(e) };\n}`;
        }

        let statusCode = '200';
        if (responseNodes.length > 0 && responseNodes[0].node.config?.code) {
          statusCode = String(responseNodes[0].node.config.code);
        }

        const initialArg: WorkflowArg = {
          id: crypto.randomUUID(),
          name: detectedParam,
          type: 'string',
          description: paramDesc,
          required: true
        };

        return {
          id: crypto.randomUUID(),
          originalTriggerId: triggerId,
          name: wfName,
          routePath: rawPath,
          routeMethod: finalMethod,
          args: [initialArg],
          paramName: detectedParam,
          paramType: 'string',
          paramDesc: paramDesc,
          instructionsTitle: cleanName,
          instructionsDesc: userFacingPurpose,
          instructionsReturns: expectedReturns,
          restUri: finalUri,
          restMethod: finalMethod,
          restHeaders: restHeaders,
          restBody: restBody,
          requestCode: `try {\n    let data = _vars._request.body;\n    if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {\n        data = data.data;\n    }\n    if (typeof data === 'string' || typeof data === 'number') {\n        data = { ${detectedParam}: String(data) };\n    }\n    return data;\n} catch (e) {\n    return { error: 'Failed to extract request data', details: JSON.stringify(e) };\n}`,
          tratarCode: tratarCodeScript,
          returnStatusCode: statusCode,
          curlInput: `curl -X ${finalMethod} "${finalUri}" -H "Content-Type: application/json" -d '${restBody.replace(/\n\s*/g, ' ')}'`,
          sampleOutput: ''
        };
      });

      setRouteDrafts(drafts);
      setActiveRouteIndex(0);

    } catch (err: any) {
      setParseError(err.message || 'JSON inválido');
      setRouteDrafts([]);
    }
  }, [rawJson]);

  // Compute final ForticsWorkflows in real-time from routeDrafts
  const convertedWorkflows: ForticsWorkflow[] = useMemo(() => {
    return routeDrafts.map((draft) => {
      const flowNodes: ForticsFlowNode[] = [];

      // 1. instructions node with all args
      const argsList = (draft.args && draft.args.length > 0)
        ? draft.args
        : [{ id: '1', name: draft.paramName || 'param', type: draft.paramType || 'string', description: draft.paramDesc || '', required: true }];

      const formattedArgs = argsList
        .map(a => `  ${a.name} (${a.type || 'string'}): ${a.description}`)
        .join('\n');

      const instructionsNode: InstructionsNode = {
        id: crypto.randomUUID(),
        type: 'instructions',
        __spec: true,
        __spec_version: '1.0.0',
        content: `${draft.instructionsTitle}.\n${draft.instructionsDesc}\n\nArgs:\n${formattedArgs}\n\nReturns:\n  ${draft.instructionsReturns}`
      };
      flowNodes.push(instructionsNode);

      // 2. code (request) node
      const firstParam = argsList[0]?.name || draft.paramName || 'param';
      const requestCodeNode: CodeNode = {
        id: crypto.randomUUID(),
        name: 'request',
        type: 'code',
        __spec: true,
        __spec_version: '1.0.0',
        error_message: `O campo ${firstParam} deve ser informado.`,
        value: draft.requestCode
      };
      flowNodes.push(requestCodeNode);

      // 3. rest node
      const restNode: RestNode = {
        id: crypto.randomUUID(),
        name: 'resposta_api',
        type: 'rest',
        __spec: true,
        __spec_version: '1.0.0',
        method: draft.restMethod,
        uri: draft.restUri,
        verify_ssl: true,
        body_format: 'json',
        credential_id: '',
        headers: draft.restHeaders.filter(h => h.key && h.value),
        params: '',
        query_params: [],
        search_params: '',
        file_params: [],
        body: draft.restBody
      };
      flowNodes.push(restNode);

      // 4. code (tratar_dados) node
      const tratarDadosNode: CodeNode = {
        id: crypto.randomUUID(),
        name: 'tratar_dados',
        type: 'code',
        __spec: true,
        __spec_version: '1.0.0',
        error_message: 'Erro ao tratar os dados da resposta.',
        value: draft.tratarCode
      };
      flowNodes.push(tratarDadosNode);

      // 5. route_return node
      const returnNode: RouteReturnNode = {
        id: crypto.randomUUID(),
        type: 'route_return',
        __spec: true,
        __spec_version: '1.0.0',
        content_type: 'application/json',
        status_code: draft.returnStatusCode || '200',
        value: '{{#tojson}}\n{{tratar_dados}}\n{{/tojson}}'
      };
      flowNodes.push(returnNode);

      return {
        id: draft.id,
        name: draft.name,
        enabled: true,
        allow_workflow_import: true,
        protected: false,
        options: {
          abort_keyword: '###',
          abort_message: 'Sessão abortada!',
          finish_message: 'Até a próxima!',
          inactivity_message: 'Sessão encerrada por inatividade!',
          inactivity_warning: 'Sua sessão vai expirar em breve por inatividade',
          inactivity_warning_time: 60,
          timeout: 300
        },
        flow: flowNodes
      };
    });
  }, [routeDrafts]);

  // Compute Clean Live Agent Schema
  const liveAgent: ForticsAgent = useMemo(() => {
    const cleanSteps = agentSteps
      .split('\n')
      .map(s => s.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(Boolean);

    return {
      id: crypto.randomUUID(),
      name: streamName || 'SGP Atendimento Inteligente',
      description: 'Agente de atendimento integrado ao SGP e Total.js FlowStream.',
      audience: 'Clientes e assinantes do provedor de internet e serviços.',
      cat: 'suporte_tecnico',
      color: '#10b981',
      icon: 'avatar-4',
      emojis: true,
      enabled: true,
      force_greetings: false,
      greetings: 'Olá! Sou o assistente virtual. Como posso ajudar você hoje?',
      style: 'Atendente cordial, ágil, objetivo e empático. Segue rigorosamente os passos definidos e valida dados antes de consultar sistemas.',
      llm: 'GPT',
      llm_api_key: crypto.randomUUID(),
      llm_model: 'gpt-4.1',
      llm_temperature: 0,
      ocr_enabled: true,
      protected: false,
      webchat: false,
      template: true,
      voice_priority: false,
      void_context: true,
      tts_id: '00000000-0000-0000-0000-000000000000',
      media_upload_enabled: false,
      offset: 'America/Sao_Paulo',
      instruction: {
        objective: 'Atender clientes, realizar consultas cadastrais e emissão de segunda via com integração SGP.',
        role: 'Você é o Agente Virtual especialista em atendimento ao assinante. Siga os seguintes passos:',
        steps: cleanSteps.length > 0 ? cleanSteps : [
          'Cumprimentar o cliente e identificar pelo nome',
          'Pedir o CPF ou CNPJ do titular',
          'Consultar o cadastro do cliente via integração SGP',
          'Exibir contratos e atender a solicitação com agilidade'
        ]
      },
      other_rules: `# REGRAS E DIRETRIZES DO AGENTE (COMO FAZER)\n\n${agentRules}`
    };
  }, [streamName, agentSteps, agentRules]);

  // Update a field in the active route draft
  const updateActiveDraft = (field: keyof RouteConfigDraft, value: any) => {
    setRouteDrafts(prev => {
      const updated = [...prev];
      if (updated[activeRouteIndex]) {
        updated[activeRouteIndex] = {
          ...updated[activeRouteIndex],
          [field]: value
        };
      }
      return updated;
    });
  };

  // Add a new argument to the active draft
  const addArgToActiveDraft = () => {
    setRouteDrafts(prev => {
      const updated = [...prev];
      const current = updated[activeRouteIndex];
      if (current) {
        const nextIdx = (current.args?.length || 0) + 1;
        const newArg: WorkflowArg = {
          id: crypto.randomUUID(),
          name: `param_${nextIdx}`,
          type: 'string',
          description: 'Descreva o que o robô deve pedir ao cliente para este parâmetro.',
          required: true
        };
        const newArgs = [...(current.args || []), newArg];
        updated[activeRouteIndex] = {
          ...current,
          args: newArgs,
          paramName: newArgs[0]?.name || '',
          paramDesc: newArgs[0]?.description || ''
        };
      }
      return updated;
    });
  };

  // Update an argument in the active draft
  const updateArgInActiveDraft = (argId: string, field: keyof WorkflowArg, value: any) => {
    setRouteDrafts(prev => {
      const updated = [...prev];
      const current = updated[activeRouteIndex];
      if (current && current.args) {
        const newArgs = current.args.map(a => a.id === argId ? { ...a, [field]: value } : a);
        updated[activeRouteIndex] = {
          ...current,
          args: newArgs,
          paramName: newArgs[0]?.name || current.paramName,
          paramDesc: newArgs[0]?.description || current.paramDesc
        };
      }
      return updated;
    });
  };

  // Remove an argument from the active draft
  const removeArgFromActiveDraft = (argId: string) => {
    setRouteDrafts(prev => {
      const updated = [...prev];
      const current = updated[activeRouteIndex];
      if (current && current.args && current.args.length > 1) {
        const newArgs = current.args.filter(a => a.id !== argId);
        updated[activeRouteIndex] = {
          ...current,
          args: newArgs,
          paramName: newArgs[0]?.name || '',
          paramDesc: newArgs[0]?.description || ''
        };
      }
      return updated;
    });
  };

  // Preset snippets for tratar_dados code
  const applyTratarPreset = (type: 'sgp' | 'universal' | 'raw' | 'clean' | 'array') => {
    if (!routeDrafts[activeRouteIndex]) return;
    let code = '';
    if (type === 'sgp') {
      code = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n    if (raw && raw.msg && !raw.status) {\n        return { status: 'alerta', mensagem: raw.msg };\n    }\n    return {\n        status: 'sucesso',\n        dados: raw\n    };\n} catch (e) {\n    return { status: 'erro', mensagem: 'Erro ao processar retorno da API', detalhes: String(e) };\n}`;
    } else if (type === 'universal') {
      code = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n    // Validação de erros comuns em REST APIs (CRM, ERP, Webhooks, etc)\n    if (raw && (raw.error || raw.erro || raw.status === 'error' || raw.status === 'erro')) {\n        return { status: 'erro', mensagem: raw.message || raw.mensagem || 'Falha na requisição da API' };\n    }\n    return {\n        status: 'sucesso',\n        dados: raw\n    };\n} catch (e) {\n    return { status: 'erro', mensagem: 'Falha ao tratar retorno da API', detalhes: String(e) };\n}`;
    } else if (type === 'array') {
      code = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n    let lista = Array.isArray(raw) ? raw : (raw.dados || raw.items || raw.resultado || [raw]);\n    return {\n        sucesso: true,\n        total: lista.length,\n        registros: lista\n    };\n} catch (e) {\n    return { sucesso: false, erro: String(e) };\n}`;
    } else if (type === 'raw') {
      code = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n    return raw;\n} catch (e) {\n    return { status: 'erro', detalhes: String(e) };\n}`;
    } else if (type === 'clean') {
      code = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n    // Filtre apenas as chaves necessárias para a resposta do robô\n    return {\n        sucesso: true,\n        resultado: raw\n    };\n} catch (e) {\n    return { sucesso: false, erro: String(e) };\n}`;
    }
    updateActiveDraft('tratarCode', code);
    showToast('info', 'Script de tratamento atualizado!');
  };

  // Import / parse cURL command into active draft
  const parseAndApplyCurl = (curlText: string) => {
    if (!curlText || !curlText.trim()) {
      showToast('error', 'Cole um comando cURL válido para importar.');
      return;
    }

    try {
      let method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET';
      let url = '';
      const headers: HeaderItem[] = [];
      let body = '';

      // Method regex
      const methodMatch = curlText.match(/-X\s+([A-Z]+)/i) || curlText.match(/--request\s+([A-Z]+)/i);
      if (methodMatch && methodMatch[1]) {
        method = methodMatch[1].toUpperCase() as any;
      }

      // URL regex
      const urlMatch = curlText.match(/curl\s+(?:-[^\s]+\s+)*['"]?([^'"\s]+)['"]?/i) || curlText.match(/https?:\/\/[^\s'"\\]+/i);
      if (urlMatch) {
        url = urlMatch[1] || urlMatch[0];
      }

      // Headers regex (-H '...' or -H "...")
      const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/gi;
      let hMatch;
      while ((hMatch = headerRegex.exec(curlText)) !== null) {
        const parts = hMatch[1].split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const value = parts.slice(1).join(':').trim();
          headers.push({ key, value });
        }
      }

      // Body regex (-d '...' or --data '...' or --data-raw '...')
      const dataMatch = curlText.match(/(?:-d|--data|--data-raw|--data-binary)\s+['"]([\s\S]*?)['"](?:\s+-[^\s]+|\s*$)/i) ||
                        curlText.match(/(?:-d|--data|--data-raw|--data-binary)\s+([^\s]+)/i);
      if (dataMatch && dataMatch[1]) {
        body = dataMatch[1];
        if (method === 'GET') method = 'POST';
      }

      // Extract parameters from JSON body if possible
      let detectedArgs: WorkflowArg[] = [];
      if (body) {
        try {
          const parsedBody = JSON.parse(body);
          if (typeof parsedBody === 'object' && parsedBody !== null) {
            Object.keys(parsedBody).forEach(key => {
              const val = parsedBody[key];
              const valType = typeof val === 'number' ? 'number' : typeof val === 'boolean' ? 'boolean' : typeof val === 'object' ? 'object' : 'string';
              detectedArgs.push({
                id: crypto.randomUUID(),
                name: key,
                type: valType,
                description: `Informe o valor para o campo ${key}.`,
                required: true
              });
            });
          }
        } catch(e) {
          // not json, continue
        }
      }

      setRouteDrafts(prev => {
        const updated = [...prev];
        const current = updated[activeRouteIndex];
        if (current) {
          const newArgs = detectedArgs.length > 0 ? detectedArgs : (current.args && current.args.length > 0 ? current.args : [{
            id: crypto.randomUUID(),
            name: 'param',
            type: 'string',
            description: 'Parâmetro de entrada',
            required: true
          }]);

          updated[activeRouteIndex] = {
            ...current,
            restMethod: method,
            restUri: url || current.restUri,
            restHeaders: headers.length > 0 ? headers : current.restHeaders,
            restBody: body || current.restBody,
            args: newArgs,
            paramName: newArgs[0]?.name || current.paramName,
            paramDesc: newArgs[0]?.description || current.paramDesc,
            curlInput: curlText
          };
        }
        return updated;
      });

      showToast('success', `✨ cURL importado com sucesso! Método ${method}, URL e ${headers.length} headers configurados.`);
    } catch(err: any) {
      showToast('error', 'Não foi possível analisar o cURL: ' + (err.message || 'formato desconhecido'));
    }
  };

  // Generate cURL command string from active draft
  const generateCurlString = (draft: RouteConfigDraft): string => {
    let curl = `curl -X ${draft.restMethod || 'GET'} "${draft.restUri || 'https://api.exemplo.com/endpoint'}"`;
    const validHeaders = (draft.restHeaders || []).filter(h => h.key && h.value);
    if (validHeaders.length > 0) {
      validHeaders.forEach(h => {
        curl += ` \\\n  -H "${h.key}: ${h.value}"`;
      });
    } else {
      curl += ` \\\n  -H "Content-Type: application/json"`;
    }
    if (draft.restBody && draft.restMethod !== 'GET') {
      curl += ` \\\n  -d '${draft.restBody.replace(/\n\s*/g, ' ')}'`;
    }
    return curl;
  };

  // Analyze pasted API response JSON and auto-generate tratarCode + instructionsReturns
  const analyzeSampleOutput = (sampleJsonStr: string) => {
    if (!sampleJsonStr || !sampleJsonStr.trim()) {
      showToast('error', 'Cole um JSON de resposta da API para analisar.');
      return;
    }

    try {
      const parsed = JSON.parse(sampleJsonStr);
      let detectedKeys: string[] = [];
      let isArray = Array.isArray(parsed);

      if (isArray) {
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
          detectedKeys = Object.keys(parsed[0]);
        }
      } else if (typeof parsed === 'object' && parsed !== null) {
        detectedKeys = Object.keys(parsed);
      }

      // Generate description for IA (Returns)
      let returnsDesc = '';
      if (isArray) {
        returnsDesc = `Lista de registros contendo: ${detectedKeys.slice(0, 8).join(', ')}`;
      } else if (detectedKeys.length > 0) {
        returnsDesc = `Objeto contendo: ${detectedKeys.slice(0, 10).join(', ')}`;
      } else {
        returnsDesc = 'Resultado retornado pela integração API.';
      }

      // Generate JavaScript tratarCode
      let generatedCode = '';
      if (isArray) {
        generatedCode = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n    let lista = Array.isArray(raw) ? raw : (raw.dados || raw.items || [raw]);\n    return {\n        sucesso: true,\n        total: lista.length,\n        registros: lista\n    };\n} catch (e) {\n    return { sucesso: false, erro: 'Falha ao processar lista', detalhes: String(e) };\n}`;
      } else {
        generatedCode = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n    // Validação de erro retornado pela API\n    if (raw && (raw.error || raw.erro || raw.status === 'error' || raw.status === 'erro' || (raw.msg && !raw.status))) {\n        return {\n            sucesso: false,\n            mensagem: raw.message || raw.mensagem || raw.msg || 'Erro na consulta'\n        };\n    }\n    return {\n        sucesso: true,\n        dados: raw\n    };\n} catch (e) {\n    return { sucesso: false, erro: 'Falha ao tratar retorno da API', detalhes: String(e) };\n}`;
      }

      setRouteDrafts(prev => {
        const updated = [...prev];
        const current = updated[activeRouteIndex];
        if (current) {
          updated[activeRouteIndex] = {
            ...current,
            sampleOutput: sampleJsonStr,
            instructionsReturns: returnsDesc,
            tratarCode: generatedCode
          };
        }
        return updated;
      });

      showToast('success', '✨ Resposta da API analisada! Tratamento no nó Código e descrição do Retorno gerados.');
    } catch(err: any) {
      showToast('error', 'O JSON de resposta informado é inválido: ' + (err.message || 'erro de sintaxe'));
    }
  };

  // Add Header to active draft
  const addHeaderToActiveDraft = () => {
    setRouteDrafts(prev => {
      const updated = [...prev];
      const current = updated[activeRouteIndex];
      if (current) {
        const newHeaders = [...(current.restHeaders || []), { key: '', value: '' }];
        updated[activeRouteIndex] = { ...current, restHeaders: newHeaders };
      }
      return updated;
    });
  };

  // Update Header in active draft
  const updateHeaderInActiveDraft = (idx: number, field: 'key' | 'value', val: string) => {
    setRouteDrafts(prev => {
      const updated = [...prev];
      const current = updated[activeRouteIndex];
      if (current && current.restHeaders) {
        const newHeaders = [...current.restHeaders];
        newHeaders[idx] = { ...newHeaders[idx], [field]: val };
        updated[activeRouteIndex] = { ...current, restHeaders: newHeaders };
      }
      return updated;
    });
  };

  // Remove Header from active draft
  const removeHeaderFromActiveDraft = (idx: number) => {
    setRouteDrafts(prev => {
      const updated = [...prev];
      const current = updated[activeRouteIndex];
      if (current && current.restHeaders) {
        const newHeaders = current.restHeaders.filter((_, i) => i !== idx);
        updated[activeRouteIndex] = { ...current, restHeaders: newHeaders };
      }
      return updated;
    });
  };

  // Add a new custom workflow/route draft
  const addNewCustomWorkflow = () => {
    const newIdx = routeDrafts.length + 1;
    const newDraft: RouteConfigDraft = {
      id: crypto.randomUUID(),
      originalTriggerId: `custom_${newIdx}`,
      name: `Nova Integração API ${newIdx}`,
      routePath: `api/v1/operacao_${newIdx}`,
      routeMethod: 'POST',
      args: [{
        id: crypto.randomUUID(),
        name: 'parametro',
        type: 'string',
        description: 'Informe o parâmetro para consulta no chat.',
        required: true
      }],
      paramName: 'parametro',
      paramType: 'string',
      paramDesc: 'Informe o parâmetro para consulta no chat.',
      instructionsTitle: `Operação ${newIdx}`,
      instructionsDesc: `Executa a consulta da operação ${newIdx} no sistema externo.`,
      instructionsReturns: 'Resultado da consulta com status e dados retornados.',
      restUri: 'https://api.empresa.com.br/v1/endpoint',
      restMethod: 'POST',
      restHeaders: [{ key: 'Content-Type', value: 'application/json' }],
      restBody: '{\n  "parametro": "{{request.parametro}}"\n}',
      requestCode: `try {\n    let data = _vars._request.body;\n    if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {\n        data = data.data;\n    }\n    if (typeof data === 'string' || typeof data === 'number') {\n        data = { parametro: String(data) };\n    }\n    return data;\n} catch (e) {\n    return { error: 'Failed to extract request data', details: JSON.stringify(e) };\n}`,
      tratarCode: `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n    if (raw && (raw.error || raw.erro || raw.status === 'error')) {\n        return { status: 'erro', mensagem: raw.message || raw.mensagem || 'Falha na requisição da API' };\n    }\n    return {\n        status: 'sucesso',\n        dados: raw\n    };\n} catch (e) {\n    return { status: 'erro', mensagem: 'Falha ao tratar retorno da API', detalhes: String(e) };\n}`,
      returnStatusCode: '200',
      curlInput: `curl -X POST "https://api.empresa.com.br/v1/endpoint" \\\n  -H "Content-Type: application/json" \\\n  -d '{"parametro": "{{request.parametro}}"}'`,
      sampleOutput: '{\n  "status": "sucesso",\n  "dados": {\n    "id": 1001,\n    "resultado": "Consulta concluída com sucesso"\n  }\n}'
    };

    setRouteDrafts(prev => [...prev, newDraft]);
    setActiveRouteIndex(routeDrafts.length);
    showToast('success', `✨ Novo workflow "${newDraft.name}" criado!`);
  };

  // Delete current active workflow
  const deleteCurrentWorkflow = () => {
    if (routeDrafts.length <= 1) {
      showToast('error', 'É necessário manter ao menos 1 workflow ativo.');
      return;
    }
    const currentName = routeDrafts[activeRouteIndex]?.name || 'Workflow';
    setRouteDrafts(prev => prev.filter((_, idx) => idx !== activeRouteIndex));
    setActiveRouteIndex(0);
    showToast('info', `Workflow "${currentName}" removido.`);
  };

  // Generate Agent + Workflows via AI or Sync
  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      if (onAgentAndWorkflowsGenerated) {
        onAgentAndWorkflowsGenerated(liveAgent, convertedWorkflows);
      } else if (onWorkflowsConverted) {
        onWorkflowsConverted(convertedWorkflows);
      }
      showToast('success', '✨ Agente Oficial e Workflows SGP gerados e integrados com sucesso!');
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao processar com IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Download individual JSON
  const downloadWorkflowJson = (wf: ForticsWorkflow) => {
    const safeName = (wf.name || 'workflow')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const jsonStr = JSON.stringify(wf, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${safeName}.json`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
    showToast('success', `${safeName}.json baixado com sucesso!`);
  };

  // Download Agent JSON
  const downloadAgentJson = () => {
    const jsonStr = JSON.stringify(liveAgent, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'agente.json');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
    showToast('success', 'agente.json baixado com sucesso!');
  };

  // Download all files (Agent + All Workflows)
  const downloadAllFiles = () => {
    downloadAgentJson();
    convertedWorkflows.forEach((wf, idx) => {
      setTimeout(() => {
        downloadWorkflowJson(wf);
      }, (idx + 1) * 250);
    });
    showToast('success', `Iniciando download do agente.json e ${convertedWorkflows.length} workflows!`);
  };

  const activeDraft = routeDrafts[activeRouteIndex] || null;
  const activeWf = convertedWorkflows[activeRouteIndex] || null;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-emerald-400">
                <Workflow className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Criador de Agente e Extrator de Workflows (FlowStream / Total.js)
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
              Escreva as instruções do atendimento em <strong>texto livre</strong> (a IA separa automaticamente os <strong>Passos</strong> e as <strong>Regras</strong>) e cole o JSON do <strong>FlowStream / SGP</strong>. Ele gera o <strong>Agente Oficial Fortics</strong> e todos os <strong>Workflows (.json)</strong> integrados!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={loadExampleSgp}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Carregar Exemplo SGP</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Column Input Area: [Texto Livre / Instruções Gerais] + [JSON FlowStream] */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left Box: Instruções Gerais do Agente (Texto Livre com Separação Automática) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Instruções Gerais do Agente (Texto Livre)</span>
              </label>

              {/* Mode Toggle: Texto Livre Único vs Passos e Regras Separados */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPromptMode('freeform')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    promptMode === 'freeform'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Texto Livre
                </button>
                <button
                  type="button"
                  onClick={() => setPromptMode('structured')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    promptMode === 'structured'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Passos & Regras
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              {promptMode === 'freeform'
                ? 'Escreva livremente como o agente deve atender. A IA identifica o que é Passo (o que fazer) e o que é Regra (como fazer).'
                : 'Edite os Passos do Agente e as Regras de Validação em caixas separadas.'}
            </p>
          </div>

          {/* Textarea for Freeform */}
          {promptMode === 'freeform' ? (
            <div className="space-y-1.5 flex-1">
              <textarea
                value={freeformPrompt}
                onChange={(e) => handleFreeformPromptChange(e.target.value)}
                rows={10}
                placeholder="Exemplo: Cumprimentar o cliente, pedir CPF/CNPJ, consultar cadastro no SGP, listar contratos e emitir 2ª via se solicitado. Regras: validar CPF com 11 dígitos, pedir confirmação antes de gravar..."
                className="w-full h-52 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-sans text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-y leading-relaxed"
              />
            </div>
          ) : (
            /* Structured View: Passos + Regras */
            <div className="space-y-3 flex-1">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ListOrdered className="w-3 h-3" />
                  <span>Passos do Agente (O que fazer)</span>
                </label>
                <textarea
                  value={agentSteps}
                  onChange={(e) => setAgentSteps(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Regras & Validações (Como fazer)</span>
                </label>
                <textarea
                  value={agentRules}
                  onChange={(e) => setAgentRules(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
            <span>Identifica automaticamente CPF, confirmações e tags #SUPORTE_HUMANO</span>
          </div>
        </div>

        {/* Right Box: JSON do FlowStream / Total.js (SGP) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <FileJson className="w-4 h-4 text-emerald-400" />
                <span>JSON do FlowStream / SGP (Total.js)</span>
              </label>

              {routeDrafts.length > 0 && (
                <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[11px] font-bold rounded-lg flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{routeDrafts.length} Workflows Prontos</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Cole o JSON exportado do FlowStream / SGP. As variáveis de host, token e rotas são extraídas automaticamente.
            </p>
          </div>

          <div className="space-y-1.5 flex-1">
            <textarea
              value={rawJson}
              onChange={(e) => setRawJson(e.target.value)}
              rows={10}
              placeholder='Cole aqui o JSON do FlowStream:&#10;{&#10;  "id": "...",&#10;  "name": "SGP - URA e Central",&#10;  "variables": { "host": "https://...", "token": "..." },&#10;  "design": { ... }&#10;}'
              className="w-full h-52 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-y leading-relaxed"
            />
          </div>

          {parseError ? (
            <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
              <span>Detecta nós genieragent, request, code e tresponse</span>
              {rawJson && <span>{rawJson.length.toLocaleString()} caracteres</span>}
            </div>
          )}
        </div>

      </div>

      {/* 3. Central Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {routeDrafts.length > 0 
                ? `Tudo Pronto! 1 Agente e ${routeDrafts.length} Workflows Detectados`
                : 'Pronto para Gerar o Agente e os Workflows'}
            </h3>
            <p className="text-xs text-slate-400">
              Gera os schemas oficiais Fortics validados prontos para importação no painel.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {routeDrafts.length > 0 && (
            <button
              type="button"
              onClick={downloadAllFiles}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Tudo (.json)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleGenerateWithAI}
            disabled={isGenerating || routeDrafts.length === 0}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-emerald-500/20"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Aplicar ao Estúdio Principal</span>
          </button>
        </div>
      </div>

      {/* 4. Visual Workflows Cards & Live Inspection */}
      {routeDrafts.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
          
          {/* Tabs Navigation: Workflows vs Agente vs JSON */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveViewTab('workflows')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeViewTab === 'workflows'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>Workflows SGP ({routeDrafts.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewTab('agent')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeViewTab === 'agent'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Instruções & Regras do Agente</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewTab('json')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeViewTab === 'json'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>Visualizar JSONs Oficiais</span>
              </button>
            </div>

            {/* Advanced Script Editor Toggle */}
            {activeViewTab === 'workflows' && (
              <button
                type="button"
                onClick={() => setShowAdvancedScriptMode(!showAdvancedScriptMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showAdvancedScriptMode
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showAdvancedScriptMode ? 'Ocultar Scripts Técnicos' : 'Modo Avançado (Scripts JS)'}</span>
              </button>
            )}
          </div>

          {/* VIEW 1: Clean & Friendly Workflows Cards */}
          {activeViewTab === 'workflows' && (
            <div className="space-y-6">
              
              {/* Workflows Selectors Tabs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {routeDrafts.map((draft, idx) => {
                  const isSelected = activeRouteIndex === idx;
                  const currentArgs = draft.args && draft.args.length > 0 ? draft.args : [{ name: draft.paramName || 'param', description: draft.paramDesc || '' }];

                  return (
                    <div
                      key={draft.id || idx}
                      onClick={() => setActiveRouteIndex(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-md'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                            draft.restMethod === 'GET' 
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {draft.restMethod}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Nó {idx + 1}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white truncate mb-1">
                          {draft.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                          {draft.instructionsDesc}
                        </p>
                      </div>

                      {/* 2 Clear badges for Input & Output directly on the card */}
                      <div className="pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[10.5px]">
                        <div className="flex items-start gap-1.5 text-emerald-400 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-800/40">
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-emerald-300 mr-1">Recebe ({currentArgs.length}):</span>
                            <span className="text-emerald-100 font-medium truncate block">
                              {currentArgs.map(a => a.name).join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5 text-cyan-300 bg-cyan-950/50 p-1.5 rounded-lg border border-cyan-800/40">
                          <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-cyan-300 mr-1">Retorno Rota:</span>
                            <span className="text-cyan-100 font-medium truncate block">
                              HTTP {draft.returnStatusCode || '200'} (via tratar_dados)
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  );
                })}

                {/* + Adicionar Novo Workflow Card */}
                <div
                  onClick={addNewCustomWorkflow}
                  className="p-4 rounded-xl border border-dashed border-slate-800 hover:border-emerald-500/60 bg-slate-950/50 hover:bg-slate-900/50 transition-all cursor-pointer text-center flex flex-col items-center justify-center min-h-[140px] group"
                >
                  <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all mb-2 shadow-xs">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-300 group-hover:text-emerald-400">
                    + Adicionar Workflow / Integração
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    Crie uma rota para qualquer API, CRM ou Webhook
                  </span>
                </div>
              </div>

              {/* Active Selected Workflow Form (Simplified & Clear) */}
              {activeDraft && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-inner">
                  
                  {/* Title & Action */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      <div>
                        <span className="text-sm font-bold text-white block">{activeDraft.name}</span>
                        <span className="text-[11px] text-slate-400">Configure os parâmetros que o robô pede (Args) e o tratamento de dados no retorno da rota</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {routeDrafts.length > 1 && (
                        <button
                          type="button"
                          onClick={deleteCurrentWorkflow}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-900/50 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Excluir este workflow"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      )}

                      {activeWf && (
                        <button
                          type="button"
                          onClick={() => downloadWorkflowJson(activeWf)}
                          className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Baixar este Workflow (.json)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Workflow Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Nome da Operação / Workflow
                      </label>
                      <input
                        type="text"
                        value={activeDraft.name}
                        onChange={(e) => updateActiveDraft('name', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        O que esta ferramenta faz (Finalidade para a IA saber quando chamar)
                      </label>
                      <input
                        type="text"
                        value={activeDraft.instructionsDesc}
                        onChange={(e) => updateActiveDraft('instructionsDesc', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* 🌐 SEÇÃO REST API & cURL (UNIVERSAL PARA QUALQUER SISTEMA / SGP / ERP / CRM) */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            🌐 Requisição REST & cURL (Qualquer API / ERP / CRM / SGP)
                          </h4>
                          <p className="text-[10px] text-slate-400">Configure o endpoint da sua API ou importe diretamente colando um comando cURL</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const curl = generateCurlString(activeDraft);
                            navigator.clipboard.writeText(curl);
                            showToast('success', '📋 cURL copiado para a área de transferência!');
                          }}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-blue-400 border border-blue-900/50 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Copiar comando cURL desta requisição"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar cURL</span>
                        </button>
                      </div>
                    </div>

                    {/* Caixa de Importação Rápida via cURL */}
                    <div className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-amber-400" />
                          <span>Importar via cURL (Opcional - preenche método, URL, headers e args automaticamente):</span>
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={activeDraft.curlInput || ''}
                          onChange={(e) => updateActiveDraft('curlInput', e.target.value)}
                          placeholder="Cole seu cURL aqui: curl -X POST https://api.empresa.com/v1/busca -H 'Authorization: Bearer...' -d '{...}'"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => parseAndApplyCurl(activeDraft.curlInput || '')}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>⚡ Analisar cURL</span>
                        </button>
                      </div>
                    </div>

                    {/* Linha de Método HTTP e URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          Método HTTP
                        </label>
                        <select
                          value={activeDraft.restMethod}
                          onChange={(e) => updateActiveDraft('restMethod', e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-blue-400 focus:outline-none focus:border-blue-500"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>

                      <div className="sm:col-span-9 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-300">
                          URL / Endpoint da API
                        </label>
                        <input
                          type="text"
                          value={activeDraft.restUri}
                          onChange={(e) => updateActiveDraft('restUri', e.target.value)}
                          placeholder="https://api.empresa.com.br/v1/cliente/consultar"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Headers e Body */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Headers HTTP */}
                      <div className="space-y-2 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Headers HTTP ({(activeDraft.restHeaders || []).length})
                          </label>
                          <button
                            type="button"
                            onClick={addHeaderToActiveDraft}
                            className="text-[10.5px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Header</span>
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {(activeDraft.restHeaders || []).map((h, hIdx) => (
                            <div key={hIdx} className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={h.key}
                                onChange={(e) => updateHeaderInActiveDraft(hIdx, 'key', e.target.value)}
                                placeholder="Key (ex: Authorization)"
                                className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={h.value}
                                onChange={(e) => updateHeaderInActiveDraft(hIdx, 'value', e.target.value)}
                                placeholder="Value (ex: Bearer token)"
                                className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => removeHeaderFromActiveDraft(hIdx)}
                                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          {(!activeDraft.restHeaders || activeDraft.restHeaders.length === 0) && (
                            <div className="text-[11px] text-slate-500 italic text-center py-2">
                              Nenhum header configurado (padrão Content-Type: application/json).
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Request Body */}
                      <div className="space-y-2 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Payload Body (JSON com variáveis <code className="text-emerald-400 font-mono">{"{{request.campo}}"}</code>)
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono">JSON</span>
                        </div>
                        <textarea
                          rows={4}
                          value={activeDraft.restBody}
                          onChange={(e) => updateActiveDraft('restBody', e.target.value)}
                          placeholder='{"cpf": "{{request.cpfcnpj}}"}'
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2 DESTAQUES CLAROS: O QUE PRECISA RECEBER vs O QUE PRECISA SAIR */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                    
                    {/* 📥 PAINEL 1: O QUE PRECISA RECEBER (ENTRADA / MÚLTIPLOS ARGS) */}
                    <div className="bg-slate-900/90 border-2 border-emerald-500/40 rounded-2xl p-4.5 space-y-3.5 shadow-md flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                              <ArrowDownLeft className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                                📥 O Que Precisa Receber
                              </h4>
                              <p className="text-[10px] text-slate-400">Campos e Parâmetros (Args) que o Robô coleta no Chat</p>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={addArgToActiveDraft}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Adicionar Arg</span>
                          </button>
                        </div>

                        {/* Lista de Argumentos / Parâmetros */}
                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                          {(activeDraft.args && activeDraft.args.length > 0 ? activeDraft.args : [
                            { id: '1', name: activeDraft.paramName || 'cpfcnpj', type: activeDraft.paramType || 'string', description: activeDraft.paramDesc || '', required: true }
                          ]).map((arg, argIdx) => (
                            <div
                              key={arg.id || argIdx}
                              className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 space-y-2 relative group hover:border-emerald-500/50 transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 font-mono">
                                  Parâmetro #{argIdx + 1}
                                </span>

                                {activeDraft.args && activeDraft.args.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeArgFromActiveDraft(arg.id)}
                                    title="Remover este parâmetro"
                                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="text-[10.5px] font-semibold text-slate-300">
                                    Nome da Variável
                                  </label>
                                  <input
                                    type="text"
                                    value={arg.name}
                                    onChange={(e) => updateArgInActiveDraft(arg.id, 'name', e.target.value)}
                                    placeholder="ex: cpfcnpj, contrato, motivo"
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10.5px] font-semibold text-slate-300">
                                    Tipo de Dado
                                  </label>
                                  <select
                                    value={arg.type}
                                    onChange={(e) => updateArgInActiveDraft(arg.id, 'type', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                                  >
                                    <option value="string">string (Texto / CPF / ID)</option>
                                    <option value="number">number (Número / ID)</option>
                                    <option value="boolean">boolean (Sim / Não)</option>
                                    <option value="object">object (JSON)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10.5px] font-semibold text-slate-300">
                                  O que o Robô deve pedir ao cliente no Chat:
                                </label>
                                <input
                                  type="text"
                                  value={arg.description}
                                  onChange={(e) => updateArgInActiveDraft(arg.id, 'description', e.target.value)}
                                  placeholder="ex: Solicite o CPF ou CNPJ do titular..."
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-2 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-[10.5px] text-emerald-300 flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Todos os campos serão cobrados pelo robô antes de chamar este workflow.</span>
                        </div>
                        <button
                          type="button"
                          onClick={addArgToActiveDraft}
                          className="text-[10.5px] text-emerald-400 font-bold underline hover:text-emerald-300 cursor-pointer"
                        >
                          + Novo Campo
                        </button>
                      </div>
                    </div>

                    {/* 📤 PAINEL 2: O QUE PRECISA SAIR / TRATAMENTO DE DADOS (NÓ CÓDIGO -> RETORNO ROTA) */}
                    <div className="bg-slate-900/90 border-2 border-cyan-500/40 rounded-2xl p-4.5 space-y-3.5 shadow-md flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg">
                              <ArrowUpRight className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                                📤 O Que Precisa Sair (Tratamento & Retorno de Rota)
                              </h4>
                              <p className="text-[10px] text-slate-400">Tratamento no Nó Código e Dados Entregues no Retorno de Rota</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded-full">
                            Saída (Retorno de Rota)
                          </span>
                        </div>

                        {/* NOVO: Exemplo de Saída da sua API (Cole aqui para auto-gerar tratamento) */}
                        <div className="bg-slate-950 border border-cyan-900/50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                              <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Exemplo de Saída / Resposta da sua API (JSON):</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => analyzeSampleOutput(activeDraft.sampleOutput || '')}
                              className="px-2 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>✨ Analisar JSON & Gerar Tratamento</span>
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            value={activeDraft.sampleOutput || ''}
                            onChange={(e) => updateActiveDraft('sampleOutput', e.target.value)}
                            placeholder='Cole um exemplo de JSON retornado pela sua API: {"id": 123, "nome": "Cliente Teste", "status": "Ativo", "contratos": [...]}'
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[10.5px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed"
                          />
                        </div>

                        {/* Tratamento no Nó Código (tratar_dados) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                              <Code className="w-3.5 h-3.5" />
                              <span>Tratamento de Dados no Nó Código (tratar_dados):</span>
                            </label>
                            
                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => applyTratarPreset('universal')}
                                className="px-1.5 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 rounded cursor-pointer transition-colors"
                                title="Aplica tratamento universal para REST APIs"
                              >
                                ✨ Universal
                              </button>
                              <button
                                type="button"
                                onClick={() => applyTratarPreset('sgp')}
                                className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded cursor-pointer transition-colors"
                                title="Aplica tratamento padrão SGP"
                              >
                                🌐 SGP
                              </button>
                              <button
                                type="button"
                                onClick={() => applyTratarPreset('array')}
                                className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded cursor-pointer transition-colors"
                                title="Tratar retorno como lista de itens"
                              >
                                📋 Lista
                              </button>
                              <button
                                type="button"
                                onClick={() => applyTratarPreset('raw')}
                                className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded cursor-pointer transition-colors"
                                title="Retorna JSON bruto da API"
                              >
                                📦 Bruto
                              </button>
                              <button
                                type="button"
                                onClick={() => applyTratarPreset('clean')}
                                className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded cursor-pointer transition-colors"
                                title="Formatar retorno limpo"
                              >
                                🧹 Limpar
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={5}
                            value={activeDraft.tratarCode}
                            onChange={(e) => updateActiveDraft('tratarCode', e.target.value)}
                            placeholder="try { let raw = _vars.resposta_api; return { dados: raw }; } catch(e) { return { erro: String(e) }; }"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 leading-relaxed shadow-inner"
                          />
                        </div>

                        {/* Descrição para a IA (Returns) */}
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-semibold text-slate-300">
                            Descrição do Retorno para o Robô (Returns):
                          </label>
                          <input
                            type="text"
                            value={activeDraft.instructionsReturns}
                            onChange={(e) => updateActiveDraft('instructionsReturns', e.target.value)}
                            placeholder="ex: ID do cliente, nome completo, lista de contratos com plano e status."
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      </div>

                      {/* Configuração do Retorno da Rota */}
                      <div className="flex items-center justify-between p-2 bg-cyan-950/40 border border-cyan-800/50 rounded-lg text-[10.5px] text-cyan-300">
                        <div className="flex items-center gap-1.5">
                          <CheckCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Entregue ao Robô via nó: <code className="font-mono text-cyan-200 bg-cyan-900/60 px-1 py-0.5 rounded">route_return</code></span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-400 font-mono">Status:</span>
                          <input
                            type="text"
                            value={activeDraft.returnStatusCode || '200'}
                            onChange={(e) => updateActiveDraft('returnStatusCode', e.target.value)}
                            className="w-12 bg-cyan-900/80 border border-cyan-700/60 rounded px-1.5 py-0.5 text-[10.5px] font-mono text-cyan-100 text-center focus:outline-none focus:border-cyan-400"
                          />
                          <span className="font-mono text-[10px] text-cyan-200">OK</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* REST Endpoint Summary Pill */}
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-slate-300">Endpoint Configurado:</span>
                      <span className="px-2 py-0.5 bg-slate-950 text-blue-300 font-mono text-[11px] rounded border border-slate-800">
                        {activeDraft.restMethod} {activeDraft.restUri}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">Retorno HTTP: <strong className="text-emerald-400">{activeDraft.returnStatusCode || '200'} OK</strong></span>
                  </div>

                  {/* Optional Advanced Code Section (Only shown if toggled) */}
                  {showAdvancedScriptMode && (
                    <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4 animate-in fade-in">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                        <Terminal className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Scripts JavaScript do Workflow (Avançado)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-amber-300">
                            Nó Code (request) - Desempacotador
                          </label>
                          <textarea
                            value={activeDraft.requestCode}
                            onChange={(e) => updateActiveDraft('requestCode', e.target.value)}
                            rows={8}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-amber-300 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-cyan-300">
                            Nó Code (tratar_dados) - Tratador de Resposta
                          </label>
                          <textarea
                            value={activeDraft.tratarCode}
                            onChange={(e) => updateActiveDraft('tratarCode', e.target.value)}
                            rows={8}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-cyan-300 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* VIEW 2: Agent Instructions & Rules Inspector */}
          {activeViewTab === 'agent' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-6">
              
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Instruções & Regras do Agente (Padrão Oficial Fortics)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadAgentJson}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar agente.json</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Steps (O que fazer) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ListOrdered className="w-4 h-4" />
                      <span>Passos do Agente (instruction.steps)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">O que fazer em ordem</span>
                  </div>
                  <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs">
                    {liveAgent.instruction.steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex items-start gap-2 text-slate-200">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rules (Como fazer) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Regras & Validações (other_rules)</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Diretrizes de segurança</span>
                  </div>
                  <pre className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed">
                    {liveAgent.other_rules}
                  </pre>
                </div>

              </div>

            </div>
          )}

          {/* VIEW 3: Live Official Fortics JSONs */}
          {activeViewTab === 'json' && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
              
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">JSONs Oficiais Fortics Prontos para Exportação</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(liveAgent, null, 2));
                      setCopiedAgent(true);
                      setTimeout(() => setCopiedAgent(false), 2000);
                      showToast('info', 'JSON do Agente copiado!');
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedAgent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar agente.json</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadAllFiles}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Todos os Arquivos</span>
                  </button>
                </div>
              </div>

              {/* JSON preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-emerald-400 block">agente.json</span>
                  <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-300 max-h-80 overflow-y-auto leading-relaxed">
                    {JSON.stringify(liveAgent, null, 2)}
                  </pre>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-cyan-400 block">
                    {activeWf?.name || 'workflow'}.json ({activeRouteIndex + 1}/{convertedWorkflows.length})
                  </span>
                  <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-cyan-300 max-h-80 overflow-y-auto leading-relaxed">
                    {JSON.stringify(activeWf, null, 2)}
                  </pre>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
