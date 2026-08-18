import React, { useState } from 'react';
import { 
  ForticsWorkflow, 
  ForticsFlowNode,
  InstructionsNode,
  CodeNode,
  RestNode,
  RouteReturnNode,
  HeaderItem
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
  Sliders
} from 'lucide-react';

interface FlowstreamConverterProps {
  onWorkflowsConverted?: (workflows: ForticsWorkflow[]) => void;
  showToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const FlowstreamConverter: React.FC<FlowstreamConverterProps> = ({
  onWorkflowsConverted,
  showToast
}) => {
  const [rawJson, setRawJson] = useState<string>('');
  const [convertedWorkflows, setConvertedWorkflows] = useState<ForticsWorkflow[]>([]);
  const [activeWfIndex, setActiveWfIndex] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [conversionStats, setConversionStats] = useState<{
    totalRoutes: number;
    globalVars: Record<string, string>;
    name: string;
  } | null>(null);

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
            "code": "if(!data.clientes || data.clientes.length == 0){\n  $.send('output', { status: 'erro', mensagem: 'Cliente não encontrado.' });\n} else {\n  const cliente = data.clientes[0];\n  $.send('output', { id_cliente: cliente.id, nome: cliente.nome, contratos: cliente.contratos });\n}"
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
            "code": "$.send('output', { faturas: data.links });"
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
    showToast('info', 'Exemplo carregado! Clique em "Converter para Workflows Fortics".');
  };

  // Convert Total.js / Flowstream JSON into separate Fortics Workflows
  const handleConvert = () => {
    if (!rawJson.trim()) {
      showToast('error', 'Cole o JSON do Flowstream / Total.js antes de converter.');
      return;
    }

    setIsProcessing(true);

    try {
      const parsed = JSON.parse(rawJson);
      const globalVars: Record<string, string> = parsed.variables || {};
      const design: Record<string, any> = parsed.design || {};
      const components: Record<string, any> = parsed.components || {};

      if (Object.keys(design).length === 0) {
        throw new Error('Nenhum nó encontrado no objeto "design" do JSON.');
      }

      // Step 1: Find all Trigger / Entry nodes (component === "genieragent" or triggers)
      const entryNodeIds: string[] = [];
      Object.keys(design).forEach(key => {
        const node = design[key];
        if (node.component === 'genieragent' || (node.config && node.config.url && node.connections?.output)) {
          entryNodeIds.push(key);
        }
      });

      if (entryNodeIds.length === 0) {
        // Fallback: search for any node that has an output but no incoming connections
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
        throw new Error('Não foi possível identificar nós de entrada / rotas no FlowStream.');
      }

      const generatedWorkflows: ForticsWorkflow[] = [];

      // Helper to replace variables like {{host}}, {host}, {token}, {super_usuario}
      const replaceGlobalVars = (text: string): string => {
        if (!text) return '';
        let result = text;
        Object.keys(globalVars).forEach(vKey => {
          const val = globalVars[vKey] || '';
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

      // Traverse the flow for each entry trigger node
      entryNodeIds.forEach((triggerId, routeIndex) => {
        const triggerNode = design[triggerId];
        const routePath = (triggerNode.config?.url || `/operacao_${routeIndex + 1}`).replace(/^\/+/, '');
        const routeMethod = (triggerNode.config?.method || 'POST').toUpperCase();
        
        // Humanize route name
        const cleanName = routePath
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
            // Priority: output, then response, then others (avoid error/output2 branches first)
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

        // Extract nodes from chain
        const requestNodes = chainNodes.filter(c => c.node.component === 'request');
        const codeNodes = chainNodes.filter(c => c.node.component === 'code');
        const trigger = triggerNode;

        // Determine parameters needed by examining the first code node
        const firstCode = codeNodes[0]?.node?.config?.code || '';
        let detectedParam = 'cpfcnpj';
        if (firstCode.includes('contrato')) detectedParam = 'contrato';
        else if (firstCode.includes('cpfcnpj') || firstCode.includes('cpf')) detectedParam = 'cpfcnpj';
        else if (firstCode.includes('documento')) detectedParam = 'documento';
        else if (firstCode.includes('id_cliente')) detectedParam = 'id_cliente';
        else if (firstCode.includes('descricao')) detectedParam = 'descricao';

        // Prepare Fortics Nodes
        const flowNodes: ForticsFlowNode[] = [];

        // 1. instructions node
        const instructionsNode: InstructionsNode = {
          id: crypto.randomUUID(),
          type: 'instructions',
          __spec: true,
          __spec_version: '1.0.0',
          content: `${cleanName}.\nExecuta a operação ${cleanName} no SGP.\n\nArgs:\n  ${detectedParam} (string): Parâmetro necessário para a consulta.\n\nReturns:\n  dict: Objeto estruturado com o resultado da operação.`
        };
        flowNodes.push(instructionsNode);

        // 2. code (request) node
        const requestCodeNode: CodeNode = {
          id: crypto.randomUUID(),
          name: 'request',
          type: 'code',
          __spec: true,
          __spec_version: '1.0.0',
          error_message: 'Desculpe, ocorreu uma instabilidade ao processar os dados da requisição.',
          value: `try {\n    let data = _vars._request.body;\n\n    if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {\n        data = data.data;\n    }\n    if (typeof data === 'string' || typeof data === 'number') {\n        data = { ${detectedParam}: String(data) };\n    }\n\n    return data;\n\n} catch (e) {\n    return {\n        error: "Failed to extract request data",\n        details: JSON.stringify(e)\n    };\n}`
        };
        flowNodes.push(requestCodeNode);

        // 3. rest nodes and intermediate code nodes
        if (requestNodes.length === 0) {
          // Fallback REST node if none detected
          const restNode: RestNode = {
            id: crypto.randomUUID(),
            name: 'resposta_api',
            type: 'rest',
            __spec: true,
            __spec_version: '1.0.0',
            method: (routeMethod as any) || 'POST',
            uri: `${globalVars.host || 'https://api.exemplo.com'}/${routePath}`,
            verify_ssl: true,
            body_format: 'json',
            credential_id: '',
            headers: [{ key: 'Content-Type', value: 'application/json' }],
            params: '',
            query_params: [],
            search_params: '',
            file_params: [],
            body: `{\n  "app": "${globalVars.app || 'SZ.CHAT'}",\n  "token": "${globalVars.token || ''}",\n  "${detectedParam}": "{{request.${detectedParam}}}"\n}`
          };
          flowNodes.push(restNode);
        } else {
          requestNodes.forEach((reqItem, rIdx) => {
            const reqConfig = reqItem.node.config || {};
            let rawUrl = reqConfig.url || '';
            rawUrl = replaceGlobalVars(rawUrl);

            // Replace dynamic placeholders with mustache
            rawUrl = rawUrl
              .replace(/\{data\}/g, `{{request.${detectedParam}}}`)
              .replace(/\{request\./g, '{{request.');

            const headers: HeaderItem[] = [];
            if (reqConfig.headers) {
              Object.keys(reqConfig.headers).forEach(hKey => {
                let hVal = reqConfig.headers[hKey] || '';
                hVal = replaceGlobalVars(hVal);
                headers.push({ key: hKey, value: hVal });
              });
            }
            if (headers.length === 0) {
              headers.push({ key: 'Content-Type', value: 'application/json' });
            }

            let requestBody = '';
            if (reqConfig.method === 'POST' || reqConfig.method === 'PUT') {
              if (globalVars.token || globalVars.app) {
                requestBody = JSON.stringify({
                  app: globalVars.app || 'SZ.CHAT',
                  token: globalVars.token || '',
                  [detectedParam]: `{{request.${detectedParam}}}`
                }, null, 2);
              } else {
                requestBody = JSON.stringify({
                  [detectedParam]: `{{request.${detectedParam}}}`
                }, null, 2);
              }
            }

            const restNodeName = requestNodes.length === 1 ? 'resposta_api' : `api_step_${rIdx + 1}`;
            const restNode: RestNode = {
              id: crypto.randomUUID(),
              name: restNodeName,
              type: 'rest',
              __spec: true,
              __spec_version: '1.0.0',
              method: (reqConfig.method || 'POST').toUpperCase() as any,
              uri: rawUrl || 'https://api.exemplo.com',
              verify_ssl: true,
              body_format: 'json',
              credential_id: '',
              headers: headers,
              params: '',
              query_params: [],
              search_params: '',
              file_params: [],
              body: requestBody
            };
            flowNodes.push(restNode);
          });
        }

        // 4. Code node (tratar_dados)
        const lastCodeNode = codeNodes[codeNodes.length - 1];
        let tratarCodeScript = '';
        if (lastCodeNode?.node?.config?.code) {
          let originalJs = lastCodeNode.node.config.code;
          // Adapt $.send('output', ...) to return ...
          originalJs = originalJs
            .replace(/\$\.send\('output',\s*([\s\S]*?)\);?\s*(?:\$\.destroy\(\);?)?/g, 'return $1;')
            .replace(/\$\.send\("output",\s*([\s\S]*?)\);?\s*(?:\$\.destroy\(\);?)?/g, 'return $1;')
            .replace(/\$\.send\('output2',\s*([\s\S]*?)\);?\s*(?:\$\.destroy\(\);?)?/g, 'return $1;')
            .replace(/\$\.send\("output2",\s*([\s\S]*?)\);?\s*(?:\$\.destroy\(\);?)?/g, 'return $1;')
            .replace(/\$\.destroy\(\);?/g, '')
            .replace(/data\./g, 'raw.');

          tratarCodeScript = `try {\n    let raw = _vars.resposta_api || _vars.api_step_1;\n    if (typeof raw === 'string') {\n        try { raw = JSON.parse(raw); } catch(e) {}\n    }\n\n${originalJs}\n} catch (e) {\n    return {\n        status: 'erro',\n        mensagem: 'Erro ao processar dados da API.',\n        detalhes: String(e)\n    };\n}`;
        } else {
          tratarCodeScript = `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    return {\n        status: 'sucesso',\n        dados: raw\n    };\n} catch (e) {\n    return { status: 'erro', details: String(e) };\n}`;
        }

        const tratarDadosNode: CodeNode = {
          id: crypto.randomUUID(),
          name: 'tratar_dados',
          type: 'code',
          __spec: true,
          __spec_version: '1.0.0',
          error_message: 'Erro ao tratar os dados da resposta.',
          value: tratarCodeScript
        };
        flowNodes.push(tratarDadosNode);

        // 5. route_return node
        const returnNode: RouteReturnNode = {
          id: crypto.randomUUID(),
          type: 'route_return',
          __spec: true,
          __spec_version: '1.0.0',
          content_type: 'application/json',
          status_code: '200',
          value: '{{#tojson}}\n{{tratar_dados}}\n{{/tojson}}'
        };
        flowNodes.push(returnNode);

        const wf: ForticsWorkflow = {
          id: crypto.randomUUID(),
          name: wfName,
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

        generatedWorkflows.push(wf);
      });

      setConvertedWorkflows(generatedWorkflows);
      setActiveWfIndex(0);
      setConversionStats({
        totalRoutes: generatedWorkflows.length,
        globalVars,
        name: parsed.name || 'Total.js FlowStream'
      });

      if (onWorkflowsConverted) {
        onWorkflowsConverted(generatedWorkflows);
      }

      showToast('success', `${generatedWorkflows.length} Workflow(s) Fortics extraídos e convertidos com sucesso!`);
    } catch (err: any) {
      console.error('Error parsing flowstream JSON:', err);
      showToast('error', `Erro na conversão: ${err.message || 'JSON inválido'}`);
    } finally {
      setIsProcessing(false);
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

  // Download all JSONs sequentially
  const downloadAllWorkflows = () => {
    convertedWorkflows.forEach((wf, idx) => {
      setTimeout(() => {
        downloadWorkflowJson(wf);
      }, idx * 250);
    });
    showToast('success', `Iniciando download de ${convertedWorkflows.length} arquivos .json!`);
  };

  // Copy workflow JSON
  const copyWorkflow = (wf: ForticsWorkflow, idx: number) => {
    navigator.clipboard.writeText(JSON.stringify(wf, null, 2));
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
    showToast('info', `JSON de "${wf.name}" copiado para a área de transferência!`);
  };

  const activeWorkflow = convertedWorkflows[activeWfIndex] || null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-emerald-400">
                <Workflow className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Conversor Total.js / FlowStream → Workflows Fortics
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Cole o JSON completo exportado do <strong>FlowStream / Total.js / SGP / GOgenier</strong> contendo as chaves <code className="text-emerald-400">components</code>, <code className="text-emerald-400">design</code> e <code className="text-emerald-400">variables</code>. O motor quebrará automaticamente cada rota (<code className="text-cyan-400">genieragent</code>) em um arquivo oficial <strong className="text-white">workflow.json</strong> pronto para importação na Fortics.
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

      {/* Input JSON Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <FileJson className="w-4 h-4 text-emerald-400" />
            <span>JSON do FlowStream / SGP (Total.js)</span>
          </label>
          <span className="text-[11px] text-slate-400">
            {rawJson ? `${rawJson.length.toLocaleString()} caracteres` : 'Cole ou digite o JSON'}
          </span>
        </div>

        <div className="relative">
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            rows={9}
            placeholder='Cole aqui o JSON completo do FlowStream/SGP:&#10;{&#10;  "id": "fJ6RT2j1ck61f",&#10;  "name": "SGP - exemplo",&#10;  "variables": { ... },&#10;  "design": { ... }&#10;}'
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-emerald-300 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mapeia automaticamente <code className="text-slate-300">instructions</code>, <code className="text-slate-300">request</code>, nós <code className="text-slate-300">REST</code>, códigos de tratamento e respostas 200/400.</span>
          </div>

          <button
            type="button"
            onClick={handleConvert}
            disabled={isProcessing || !rawJson.trim()}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Converter para Workflows Fortics</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {convertedWorkflows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm animate-in fade-in duration-300">
          
          {/* Header Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 font-black text-sm">
                {convertedWorkflows.length}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {convertedWorkflows.length} Workflow{convertedWorkflows.length > 1 ? 's' : ''} Fortics Extraído{convertedWorkflows.length > 1 ? 's' : ''}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Prontos no formato oficial para importação direta no painel <strong>Workflows → Importar</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={downloadAllWorkflows}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Todos os {convertedWorkflows.length} Workflows (.json)</span>
              </button>
            </div>
          </div>

          {/* Workflow Tabs / Selector */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Selecione o Workflow para Inspecionar ou Baixar:
            </label>
            <div className="flex flex-wrap gap-2">
              {convertedWorkflows.map((wf, idx) => {
                const isSelected = activeWfIndex === idx;
                const restNode = wf.flow.find(n => n.type === 'rest') as RestNode | undefined;
                return (
                  <button
                    key={wf.id || idx}
                    type="button"
                    onClick={() => setActiveWfIndex(idx)}
                    className={`px-3.5 py-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-white ring-1 ring-emerald-500/40 shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <div>
                      <span className="text-xs font-semibold block leading-tight">
                        {wf.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="text-emerald-400 font-bold">{restNode?.method || 'POST'}</span>
                        <span>{wf.flow.length} nós</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Workflow Details & JSON Viewer */}
          {activeWorkflow && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white">
                    {activeWorkflow.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    ID: {activeWorkflow.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyWorkflow(activeWorkflow, activeWfIndex)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedIndex === activeWfIndex ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadWorkflowJson(activeWorkflow)}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar este .json</span>
                  </button>
                </div>
              </div>

              {/* Node Sequence Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                {activeWorkflow.flow.map((node, nIdx) => (
                  <div key={node.id || nIdx} className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase">Nó {nIdx + 1}</span>
                    <span className="font-bold text-slate-200 block truncate">{node.type}</span>
                    <span className="text-[10px] text-emerald-400/90 truncate block">
                      {(node as any).name || (node as any).method || ''}
                    </span>
                  </div>
                ))}
              </div>

              {/* Code viewer */}
              <div className="relative">
                <pre className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                  {JSON.stringify(activeWorkflow, null, 2)}
                </pre>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
