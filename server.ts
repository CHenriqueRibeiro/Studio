import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Lazy initializer for Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set in environment. Mock/fallback generation will be used if needed.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return geminiClient;
}

const FORTICS_SYSTEM_PROMPT = `
Você é o Arquiteto de Software e Engenheiro de Prompts Sênior Especialista no Ecossistema Fortics Omnichannel.
Sua missão é gerar ou refatorar:
1. Agente Inteligente Fortics (JSON válido 'agente.json')
2. Workflow Fortics (JSON importável 'workflow.json') ou múltiplos workflows modulares ('workflows')

DIRETRIZES TÉCNICAS RIGOROSAS (ZERO ALUCINAÇÃO):

### A. ESTRUTURA OFICIAL DO AGENTE (agente.json):
{
  "id": "<UUID-v4>",
  "name": "Empresa Função", (ex: "TechSolucoes SuporteTecnico" - sem nomes genéricos como Bot1)
  "description": "Descrição específica com escopo claro",
  "audience": "Público-alvo detalhado (ex: leigos, clientes B2B)",
  "cat": "categoria_slug",
  "color": "#3dd56d",
  "icon": "avatar-4",
  "emojis": true,
  "enabled": true,
  "force_greetings": false,
  "greetings": "Saudação personalizada com nome e pergunta aberta",
  "style": "Persona detalhada (Quem é, Especialidade, Tom, O que PODE, O que NÃO PODE, Incerteza)",
  "llm": "GPT",
  "llm_api_key": "<UUID-v4>",
  "llm_model": "gpt-4.1",
  "llm_temperature": 0, (0.0 para informativos/suporte)
  "ocr_enabled": true,
  "protected": false,
  "webchat": false,
  "template": true,
  "voice_priority": false,
  "void_context": true,
  "tts_id": "00000000-0000-0000-0000-000000000000",
  "media_upload_enabled": false,
  "offset": "America/Sao_Paulo",
  "instruction": {
    "objective": "Objetivo central da tarefa",
    "role": "Papel funcional com finalização obrigatória em: Siga os seguintes passos:",
    "steps": [
      "Cumprimentar o cliente e identificar o nome",
      "Pedir o CPF do titular",
      "Executar a consulta cadastral utilizando o CPF informado",
      "Exibir na conversa o ID do cliente e o nome retornado pela consulta",
      "Executar a consulta de contratos utilizando o ID do cliente",
      "Apresentar a lista de contratos localizados ao cliente",
      "Finalizar o atendimento com cordialidade"
    ]
  },
  "other_rules": "# REGRAS E DIRETRIZES DO AGENTE (COMO FAZER)\\n\\n(Markdown estruturado explicando detalhadamente: validação e formatação de CPF/CNPJ no padrão XXX.XXX.XXX-XX, regras de MONO SKILL, diretrizes anti-alucinação, confirmação expressa antes de gravar dados, exibição obrigatória de dados chave e IDs no diálogo para viabilizar chamadas encadeadas, tags de transbordo #SUPORTE_HUMANO, #FINANCEIRO, #FIM)"
}

### B. ESTRUTURA OFICIAL DO WORKFLOW (workflow.json):
{
  "id": "<UUID-v4>",
  "name": "Nome do Workflow",
  "enabled": true,
  "allow_workflow_import": true,
  "protected": false,
  "options": {
    "abort_keyword": "###",
    "abort_message": "Sessão abortada!",
    "finish_message": "Até a próxima!",
    "inactivity_message": "Sessão encerrada por inatividade!",
    "inactivity_warning": "Sua sessão vai expirar em breve por inatividade",
    "inactivity_warning_time": 60,
    "timeout": 300
  },
  "flow": [
    // 1. instructions (Tool Spec para LLM com Título, Descrição, Args e Resposta/Returns)
    {
      "id": "<UUID-v4>",
      "type": "instructions",
      "__spec": true,
      "__spec_version": "1.0.0",
      "content": "Consulta e Abertura de Chamado Técnico.\\nRealiza o diagnóstico e registro da solicitação técnica na API de HelpDesk do sistema.\\n\\nArgs:\\n  nome (str): Nome completo do cliente solicitante.\\n  telefone (str): Telefone com DDD do cliente.\\n  cpf_cnpj (str): CPF (XXX.XXX.XXX-XX) ou CNPJ do titular.\\n  modulo (str): Módulo do sistema afetado.\\n  descricao (str): Detalhamento do problema relatado.\\n\\nReturns:\\n  dict: Objeto estruturado contendo status, protocolo, id_ticket e prazo_sla_horas."
    },
    // 2. code (Desempacotador Padrão Obrigatório com name 'request')
    {
      "id": "<UUID-v4>",
      "name": "request",
      "type": "code",
      "__spec": true,
      "__spec_version": "1.0.0",
      "error_message": "Desculpe, instabilidade temporária ao processar dados da requisição",
      "value": "try {\\n    let data = _vars._request.body;\\n\\n    if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {\\n        data = data.data;\\n    }\\n\\n    return data;\\n\\n} catch (e) {\\n    return {\\n        error: \\\"Failed to extract request data\\\",\\n        details: JSON.stringify(e)\\n    };\\n}"
    },
    // 3. rest (HTTP utilizando {{request.campo}} para consumir as variáveis extraídas)
    {
      "id": "<UUID-v4>",
      "name": "resposta_api",
      "type": "rest",
      "__spec": true,
      "__spec_version": "1.0.0",
      "method": "POST",
      "uri": "https://api.exemplo.com/endpoint",
      "verify_ssl": true,
      "body_format": "json",
      "credential_id": "",
      "headers": [{ "key": "Content-Type", "value": "application/json" }],
      "params": "",
      "query_params": [],
      "search_params": "",
      "file_params": [],
      "body": "{\\n  \"customer_name\": \"{{request.nome}}\",\\n  \"phone\": \"{{request.telefone}}\",\\n  \"document\": \"{{request.cpf_cnpj}}\",\\n  \"category\": \"{{request.modulo}}\",\\n  \"description\": \"{{request.descricao}}\"\\n}"
    },
    // 4. code (OBRIGATÓRIO: TRATAMENTO, FORMATAÇÃO E HIGIENIZAÇÃO DE DADOS DA API)
    {
      "id": "<UUID-v4>",
      "name": "tratar_dados",
      "type": "code",
      "__spec": true,
      "__spec_version": "1.0.0",
      "error_message": "Erro ao formatar os dados retornados pela API",
      "value": "try {\\n    let raw = _vars.resposta_api;\\n    if (typeof raw === 'string') {\\n        raw = JSON.parse(raw);\\n    }\\n\\n    // Extrai itens aninhados (ex: result.items, data, items)\\n    let items = (raw && raw.result && raw.result.items) ? raw.result.items :\\n                (raw && raw.data) ? raw.data :\\n                (raw && raw.items) ? raw.items :\\n                Array.isArray(raw) ? raw : [raw];\\n\\n    // Filtra e limpa campos essenciais (descarta tokens, hashes e campos nulos)\\n    let limpos = items.map(function(item) {\\n        return {\\n            id: item.id || item.codigo || item.id_cliente,\\n            nome: item.name || item.nome || item.razao_social,\\n            documento: item.nin || item.cpf || item.cnpj || item.documento,\\n            detalhes: item.specialty || item.especialidade || item.descricao || item.status\\n        };\\n    });\\n\\n    return {\\n        status: 'sucesso',\\n        total: limpos.length,\\n        itens: limpos\\n    };\\n} catch (e) {\\n    return {\\n        status: 'erro',\\n        message: 'Falha ao higienizar dados da API',\\n        details: JSON.stringify(e)\\n    };\\n}"
    },
    // 5. condition (se houver bifurcação)
    // 6. label / goto (se houver tratamento de erro)
    // 7. route_return (finalização obrigatória com a variável tratada {{#tojson}}{{tratar_dados}}{{/tojson}})
    {
      "id": "<UUID-v4>",
      "type": "route_return",
      "__spec": true,
      "__spec_version": "1.0.0",
      "content_type": "application/json",
      "status_code": "200",
      "value": "{{#tojson}}\\n{{tratar_dados}}\\n{{/tojson}}"
    }
  ]
}

### C. FILTRAGEM INTELIGENTE DE cURLs E DOCUMENTAÇÃO TÉCNICA (PRIORIDADE ABSOLUTA):
1. O usuário pode colar uma documentação extensa ou múltiplos blocos de cURL (ex: 5 a 10 cURLs de vários módulos da API).
2. A IA DEVE ANALISAR a instrução de texto do usuário e IDENTIFICAR ESTRITAMENTE quais cURLs/endpoints são necessários para atender ao que foi pedido.
3. Se o usuário fornecer 10 cURLs mas no texto pedir apenas: "Preciso que você primeiro verifique o CPF. E, depois disso, liste o contrato", a IA DEVE SELECIONAR E UTILIZAR APENAS os 2 cURLs correspondentes (1 para a consulta de CPF e 1 para a consulta de contratos), descartando e ignorando os outros 8 cURLs.
4. NUNCA crie nós REST ou workflows para endpoints que não foram solicitados na instrução de atendimento.

### D. MODELOS DE RESPOSTA REAL (SAMPLE RESPONSES) E FILTROS DE NEGÓCIO NO NÓ DE CÓDIGO:
1. Quando o usuário fornecer um modelo de resposta da API (ex: JSON contendo 'result.items', 'data', contratos, faturas, médicos, etc.):
   - O nó de código pós-REST ('tratar_dados') DEVE inspecionar as propriedades reais presentes no modelo (ex: 'nin' para CPF/documento, 'specialist'/'specialty' para especialidade, 'crm', 'valor', 'vencimento', 'dias_atraso', 'status').
2. FILTROS E ORDENAÇÕES DE NEGÓCIO SOLICITADAS:
   - Se o usuário pedir regras de seleção específicas (ex: "preciso do contrato mais em atraso", "somente contratos com status ativo", "agendamento mais próximo", "médicos da especialidade selecionada"):
     * O nó de código 'tratar_dados' DEVE implementar a lógica de filtro (.filter) e/ou ordenação (.sort) diretamente em JavaScript.
     * Exemplo de lógica em 'tratar_dados':
       try {
           let raw = _vars.resposta_api;
           if (typeof raw === 'string') raw = JSON.parse(raw);
           let items = (raw && raw.result && raw.result.items) ? raw.result.items :
                       (raw && raw.data) ? raw.data :
                       (raw && raw.items) ? raw.items :
                       Array.isArray(raw) ? raw : [raw];

           // Filtro de status ativo (se solicitado)
           let ativos = items.filter(function(c) {
               let st = String(c.status || c.situacao || '').toLowerCase();
               return st === 'ativo' || st === 'active' || c.ativo === true;
           });
           let base = ativos.length > 0 ? ativos : items;

           // Ordenação por maior atraso (se solicitado)
           base.sort(function(a, b) {
               let dA = Number(a.dias_atraso || a.diasAtraso || a.atraso || 0);
               let dB = Number(b.dias_atraso || b.diasAtraso || b.atraso || 0);
               return dB - dA;
           });

           let selecionado = base.length > 0 ? base[0] : null;

           return {
               status: 'sucesso',
               total_encontrados: items.length,
               contrato_principal: selecionado ? {
                   id: selecionado.id || selecionado.codigo || selecionado.numero_contrato,
                   status: selecionado.status || selecionado.situacao,
                   dias_atraso: selecionado.dias_atraso || selecionado.diasAtraso || 0,
                   valor: selecionado.valor || selecionado.valor_aberto,
                   descricao: selecionado.name || selecionado.plano || selecionado.descricao
               } : null,
               lista: base.slice(0, 5)
           };
       } catch (e) {
           return { status: 'erro', message: 'Falha ao filtrar dados', details: JSON.stringify(e) };
       }
3. HIGIENIZAÇÃO RIGOROSA:
   - Descarte sempre campos pesados, tokens internos, hashes criptográficos e campos nulos desnecessários para não inflar os tokens da LLM e evitar alucinações.

### E. CADEIA DE DEPENDÊNCIA E EXIBIÇÃO CONTEXTUAL NO DIÁLOGO (CONTEXT BINDING OBRIGATÓRIO):
1. REGRA FUNDAMENTAL DO RUNTIME FORTICS: O Agente LLM do Fortics só consegue enviar um dado para o Workflow seguinte (ex: id_cliente, contrato_id, protocolo, fatura_id) se esse dado estiver presente no histórico da conversa (contexto).
2. POR ISSO, EM TODAS AS INTEGRAÇÕES ENCADEADAS:
   - Passo 1: O agente solicita o dado inicial (ex: CPF, CNPJ, Telefone, Placa).
   - Passo 2: O agente dispara o 1º workflow / consulta.
   - Passo 3: O AGENTE DEVE OBRIGATORIAMENTE EXIBIR / CONFIRMAR O RESULTADO E OS DADOS RELEVANTES (especialmente o ID / código gerado) NA CONVERSA COM O CLIENTE. (Exemplo: "Localizei seu cadastro! Seu ID de cliente é [ID_CLIENTE], Contrato número [X], em nome de [NOME]").
   - Passo 4: Com o ID agora presente no histórico do chat, o agente aciona o 2º workflow passando esse ID como argumento.
   - Passo 5: O agente apresenta a resposta final ao cliente.
3. Em 'instruction.steps' e em 'other_rules', DEVE CONSTAR EXPLICITAMENTE o passo e a regra de exibir os dados retornados na conversa antes de invocar a próxima integração.

REGRAS DE OURO:
1. Retorne SEMPRE um objeto JSON válido contendo exatamente as chaves:
   - "agent": objeto completo do agente.
   - "workflow": workflow consolidado principal contendo os nós das APIs informadas.
   - "workflows": array de workflows modulares correspondendo EXATAMENTE à lista de APIs solicitadas pelo usuário (se o usuário pediu 2 operações encadeadas, retorne 2 workflows modulares). NUNCA invente APIs extras.
   - "summary": resumo executivo destacando os cURLs selecionados e a lógica do fluxo.
   - "variableChainSummary": rastreio da cadeia de variáveis (Entrada -> 1ª API -> Retorno no Chat com ID -> 2ª API -> Resposta Final).
2. Todos os nós e objetos raiz de cada workflow devem ter UUIDs v4 válidos gerados.
3. FIDELIDADE AOS PASSOS E REGRAS: Os passos em 'agent.instruction.steps' e as regras em 'agent.other_rules' devem refletir FIELMENTE o que o usuário escreveu, sem inventar outros processos ou etapas não solicitadas.
4. PADRÃO OBRIGATÓRIO DO COMPONENTE 'instructions' DO WORKFLOW:
   - O campo 'content' do nó 'instructions' DEVE conter OBRIGATORIAMENTE:
     a) Título da ferramenta/integração na 1ª linha.
     b) Descrição completa da função e seu propósito na 2ª linha.
     c) Seção 'Args:' detalhando cada parâmetro recebido do agente, formato e tipo (ex: 'cpf (str): Documento do cliente' ou 'id_cliente (str): ID do cliente retornado na consulta anterior').
     d) Seção 'Returns:' detalhando a resposta estruturada retornada (ex: 'dict: Objeto estruturado contendo status, protocolo, id_cliente e contratos').
5. PADRÃO OBRIGATÓRIO DO COMPONENTE 'code' DE EXTRAÇÃO ('request'):
   - O primeiro nó 'code' logo após o nó 'instructions' DEVE OBRIGATORIAMENTE ter "name": "request".
   - O seu código 'value' DEVE ser EXATAMENTE:
     try {
         let data = _vars._request.body;
      
         if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {
             data = data.data;
         }
      
         return data;
      
     } catch (e) {
         return {
             error: "Failed to extract request data",
             details: JSON.stringify(e)
         };
     }
   - Nos nós subsequentes ('rest', 'condition', etc.), utilize a variável 'request' para ler os campos: {{request.nome}}, {{request.cpf}}, {{request.id_cliente}}, {{request.campo}}, etc.
6. Mantenha correspondência perfeita entre os 'Args' declarados em 'instructions' de cada workflow e os passos de coleta/regras do agente.
`;

// Helper for OpenAI call if custom API key is supplied
async function callOpenAI(apiKey: string, model: string, prompt: string, temperature = 0.1) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o',
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: FORTICS_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }
  const data: any = await response.json();
  return data.choices[0]?.message?.content;
}

// Helper for Anthropic call if custom API key is supplied
async function callAnthropic(apiKey: string, model: string, prompt: string, temperature = 0.1) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-7-sonnet-20250219',
      max_tokens: 4096,
      temperature,
      system: FORTICS_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt + '\n\nIMPORTANTE: Responda APENAS com o JSON contendo {"agent": {...}, "workflow": {...}, "summary": "...", "variableChainSummary": "..."}' }
      ]
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
  }
  const data: any = await response.json();
  const text = data.content?.[0]?.text || '';
  return text;
}

// Resilient Gemini Generator with automatic model fallback & retry for 503 / high demand
async function generateGeminiWithFallback(
  ai: ReturnType<typeof getGeminiClient>,
  requestedModel: string,
  userContents: string,
  systemInstruction?: string,
  temperature = 0.1
) {
  // Use exclusively active, valid Gemini models (avoid deprecated 2.5-pro or 1.5/2.0)
  const modelsToTry = [
    requestedModel || 'gemini-3.7-flash',
    'gemini-3.7-flash',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite'
  ];
  const uniqueModels = Array.from(new Set(modelsToTry));

  let lastError: any = null;

  for (const modelName of uniqueModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`[Gemini Engine] Querying model ${modelName} (attempt ${attempt + 1})...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: userContents,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            temperature: typeof temperature === 'number' ? temperature : 0.1,
            responseMimeType: 'application/json'
          }
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        console.warn(`[Gemini Engine] Model ${modelName} attempt ${attempt + 1} failed: ${msg}`);

        const isTransient = msg.includes('503') ||
                            msg.includes('high demand') ||
                            msg.includes('UNAVAILABLE') ||
                            msg.includes('429') ||
                            msg.includes('RESOURCE_EXHAUSTED') ||
                            msg.includes('Overloaded');

        if (isTransient) {
          // Wait briefly before retry or next fallback model
          await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        } else {
          break; // Try next fallback model
        }
      }
    }
  }

  throw lastError || new Error('Modelos temporariamente indisponíveis. Por favor tente novamente.');
}

// API Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// API Generate / Refactor
app.post('/api/generate', async (req, res) => {
  try {
    const {
      provider = 'gemini',
      model = 'gemini-3.7-flash',
      apiKey,
      temperature = 0.1,
      mode = 'new',
      studioMode = 'both',
      businessContext = '',
      naturalAlgorithm = '',
      naturalSteps = '',
      naturalRules = '',
      workflowArchitectureMode = 'multiple_modular',
      authRoute = null,
      apiDocs = '',
      responseModelSample = '',
      businessFilters = '',
      curlItems = [],
      orderedApiSteps = [],
      configuredWorkflows = [],
      selectedIntegrations = [],
      customMidpoints = [],
      manualGuidelines1 = '',
      manualGuidelines2 = '',
      existingAgentJson,
      existingWorkflowJson,
      inputMode = 'structured',
      freeformPrompt = '',
      options = {}
    } = req.body;

    // Format Authentication Route if enabled
    let formattedAuthRoute = '';
    if (authRoute && authRoute.enabled) {
      formattedAuthRoute = `
========================================
ROTA DE AUTENTICAÇÃO OBRIGATÓRIA (EXECUTAR NO WORKFLOW ANTES DAS DEMAIS APIS):
- Tipo de Autenticação: ${authRoute.authType}
- Nome do Passo de Auth: ${authRoute.name || 'Obter Token de Acesso / Autenticação'}
- Método: ${authRoute.method || 'POST'}
- Endpoint/URL: ${authRoute.pathOrUrl || '/api/auth/token'}
${authRoute.headers ? `- Headers da Requisição de Auth: ${authRoute.headers}` : ''}
${authRoute.requestBodySample ? `- Payload de Envio (Request Body de Auth):\n${authRoute.requestBodySample}` : ''}
- Campo a Extrair da Resposta da Auth: ${authRoute.tokenExtractionPath || 'access_token'}
- Variável Armazenada no Workflow: ${authRoute.tokenVariableTarget || '_vars.auth_token'}
- Header Injetado nas Requisições Subsequentes: ${authRoute.headerAppliedToSubsequentCalls || 'Authorization: Bearer {{auth_token}}'}

REGRAS DE CONSTRUÇÃO DO WORKFLOW COM ROTA DE AUTH:
1. No 'workflow.json', crie um nó REST dedicado para a Rota de Autenticação ANTES das demais APIs de negócio.
2. Em seguida, crie um nó 'code' para capturar o token (ex: _vars.auth_token = _vars._response_auth.access_token || _vars._response_auth.token).
3. Todas as chamadas REST das etapas seguintes do workflow DEVEM incluir o header correspondente (ex: Authorization: Bearer {{auth_token}}).
========================================
`;
    }

    // Check if user provided explicit cURLs
    const validCurlItems = (curlItems && Array.isArray(curlItems))
      ? curlItems.filter((c: any) => c.curl && c.curl.trim().length > 5)
      : [];

    // Format Workflows with their internal APIs / integrations
    let formattedWorkflowsSection = '';
    let expectedWorkflowCount = 1;
    let hasExplicitWorkflows = false;

    if (validCurlItems.length > 0) {
      // Top priority: Generate workflows directly from the user's provided cURL(s)
      hasExplicitWorkflows = true;
      expectedWorkflowCount = validCurlItems.length;
      formattedWorkflowsSection = validCurlItems.map((item: any, idx: number) => {
        const wfNum = idx + 1;
        return `
### WORKFLOW ${wfNum} (GERADO A PARTIR DO cURL #${wfNum}): "${item.name || `Integração ${wfNum}`}"
- COMANDO cURL COMPLETO:
${item.curl}
${item.responseSample ? `- MODELO DE RESPOSTA REAL DA API (JSON):\n${item.responseSample}` : ''}
${item.filterRules ? `- REGRAS DE FILTRO / EXTRAÇÃO / CAMPOS REQUERIDOS:\n${item.filterRules}` : ''}
- DIRETIVAS DO NÓ REST E DE CÓDIGO PARA ESTE WORKFLOW:
  1. O nó 'rest' DEVE usar a URL, método e Headers extraídos deste cURL (incluindo tokens Bearer, Content-Type, etc).
  2. Parâmetros de query ou body devem vir das variáveis extraídas pelo nó 'request' (ex: {{request.cpf}}, {{request.id_cliente}}).
  3. O nó 'code' pós-REST ("tratar_dados") DEVE processar o JSON retornado conforme o modelo de resposta e aplicar as regras de filtro/extração solicitadas.
`;
      }).join('\n----------------------------------------\n');
    } else if (configuredWorkflows && Array.isArray(configuredWorkflows) && configuredWorkflows.length > 0) {
      hasExplicitWorkflows = true;
      expectedWorkflowCount = configuredWorkflows.length;
      formattedWorkflowsSection = configuredWorkflows.map((wf: any, idx: number) => {
        const wfNum = idx + 1;
        const calls = (wf.apiCalls && Array.isArray(wf.apiCalls) && wf.apiCalls.length > 0)
          ? wf.apiCalls.map((step: any, sIdx: number) => `
  -> Integração/Chamada ${sIdx + 1}: [${step.method || 'GET'}] ${step.pathOrUrl || '/api'}
     - Nome: ${step.name || `Chamada ${sIdx + 1}`}
     - Finalidade: ${step.purposeDescription || 'Execução de integração'}
     - Parâmetros/Body: ${step.requestBodySample || step.requiredInputData || 'Campos capturados pelo agente'}
     - Exemplo de Resposta esperada: ${step.responseSample || '{\n  "status": "success"\n}'}
`).join('\n')
          : '  -> [Integrações não especificadas em detalhes: a IA deve deduzir e gerar os nós REST e parâmetros adequados para este Workflow com base no objetivo].';

        return `
### WORKFLOW ${wfNum}: "${wf.name || `Workflow ${wfNum}`}"
- Descrição / Finalidade: ${wf.description || 'Execução de processo e integração com o sistema'}
- Chamadas de API internas configuradas para este Workflow:
${calls}
`;
      }).join('\n----------------------------------------\n');
    } else if (orderedApiSteps && Array.isArray(orderedApiSteps) && orderedApiSteps.length > 0) {
      hasExplicitWorkflows = true;
      expectedWorkflowCount = orderedApiSteps.length;
      formattedWorkflowsSection = orderedApiSteps.map((step: any, index: number) => {
        const orderNum = step.order || index + 1;
        return `
### WORKFLOW ${orderNum}: "${step.name || `Workflow ${orderNum}`}"
- Finalidade: ${step.purposeDescription || 'Execução de integração'}
- Método e Rota: [${step.method || 'GET'}] ${step.pathOrUrl || '/api'}
- Dados de Entrada Requeridos: ${step.requiredInputData || 'Definidos a partir do contexto'}
${step.requestBodySample ? `- Exemplo de Payload de Envio (Request Body):\n${step.requestBodySample}` : ''}
- Resposta Esperada (Response Payload):
${step.responseSample || '{\n  "status": "success"\n}'}
`;
      }).join('\n----------------------------------------\n');
    } else {
      hasExplicitWorkflows = false;
      expectedWorkflowCount = 1;
      formattedWorkflowsSection = 'Nenhum workflow ou API especificado detalhadamente. A IA DEVE AGIR AUTOMATICAMENTE: deduzir e criar os Workflows, nós REST, parâmetros e payloads necessários com base no Objetivo e nos Passos do Agente.';
    }

    const formattedIntegrations = (selectedIntegrations && selectedIntegrations.length > 0)
      ? selectedIntegrations.join('\n')
      : 'Identifique os melhores endpoints a partir da documentação ou utilize REST padrão.';

    const formattedMidpoints = (customMidpoints && customMidpoints.length > 0)
      ? customMidpoints.map((mp: any, i: number) => `${i + 1}. [${mp.method || 'POST'}] ${mp.name} (${mp.url}): ${mp.description || ''}`).join('\n')
      : 'Nenhum midpoint customizado adicional.';

    let formattedCurlItemsSection = '';
    if (curlItems && Array.isArray(curlItems) && curlItems.length > 0) {
      formattedCurlItemsSection = curlItems.map((item: any, idx: number) => `
========================================
INTEGRAÇÃO / cURL #${idx + 1}: "${item.name || `cURL ${idx + 1}`}"
- COMANDO cURL COMPLETO:
${item.curl || 'Não informado'}
${item.responseSample ? `- MODELO DE RESPOSTA REAL DA API (JSON):\n${item.responseSample}` : ''}
${item.filterRules ? `- REGRAS DE FILTRO / EXTRAÇÃO / CAMPOS REQUERIDOS:\n${item.filterRules}` : ''}
========================================
`).join('\n');
    }

    let stepsAndRulesSection = '';
    if (inputMode === 'freeform' && freeformPrompt && freeformPrompt.trim()) {
      stepsAndRulesSection = `
2. INSTRUÇÃO EM FORMATO LIVRE (AUTO-CLASSIFICAÇÃO E SEPARAÇÃO INTELIGENTE PELA IA):
"""
${freeformPrompt.trim()}
"""
-> DIRETIVA OBRIGATÓRIA DE EXTRAÇÃO E CLASSIFICAÇÃO:
   A IA DEVE ANALISAR o texto livre acima e SEPARAR automaticamente o conteúdo em:
   a) 'instruction.steps' (O QUE FAZER): Extraia apenas as etapas lógicas de atendimento (ex: "Cumprimentar e identificar o cliente", "Solicitar o CPF ou CNPJ", "Consultar a API de cadastro", "Confirmar dados", "Apresentar retorno ao cliente"). Não coloque regras ou validações dentro de steps.
   b) 'other_rules' (COMO FAZER / REGRAS): Extraia todas as regras de validação (formato de CPF/CNPJ, dígitos, limites), confirmação expressa antes de disparar integrações, comportamento em caso de transbordo (#SUPORTE_HUMANO), regras anti-alucinação e escopo mono skill, formatando em Markdown limpo com tópicos.
`;
    } else {
      stepsAndRulesSection = `
2. PASSOS DO AGENTE (O QUE FAZER - Destinado ao campo 'instruction.steps'):
${naturalSteps || naturalAlgorithm || 'Identificar o cliente -> Coletar dados necessários -> Apresentar resumo e pedir confirmação -> Executar integração -> Finalizar'}

3. REGRAS & VALIDAÇÕES DO AGENTE (COMO FAZER - Destinado ao campo 'other_rules'):
${naturalRules || '- Validação de dados de entrada\n- Solicitar confirmação expressa antes de gravar dados\n- Respeitar estritamente o escopo mono skill e regras anti-alucinação\n- Em caso de dúvida ou solicitação de atendente, retornar #SUPORTE_HUMANO'}
`;
    }

    const userPrompt = `
MODO DE OPERAÇÃO: ${mode === 'refactor' ? 'REFATORAÇÃO E OTIMIZAÇÃO DE ESTRUTURA EXISTENTE' : 'CRIAÇÃO'}
ESCOPO SOLICITADO PELO USUÁRIO: ${studioMode === 'workflow_only' ? 'FOCO EXCLUSIVO EM WORKFLOWS E INTEGRAÇÕES DE API' : studioMode === 'agent_only' ? 'FOCO EXCLUSIVO EM AGENTE DE IA (PROMPTS, INSTRUÇÕES, REGRAS E TOOLS)' : 'COMPLETO (AGENTE DE IA + WORKFLOWS INTERLIGADOS)'}

1. OBJETIVO / CONTEXTO GERAL DO NEGÓCIO:
${businessContext || 'Criar agente de atendimento e workflow com integração de API.'}

${stepsAndRulesSection}

4. ROTA DE AUTENTICAÇÃO / TOKEN (SE HABILITADA):
${formattedAuthRoute || 'Nenhuma rota de autenticação prévia requerida.'}

5. WORKFLOWS E INTEGRAÇÕES CONFIGURADAS:
${formattedWorkflowsSection}

6. DOCUMENTAÇÃO TÉCNICA DA API, cURLs E MODELOS DE RESPOSTA:
${formattedCurlItemsSection ? `cURLs CADASTRADOS INDIVIDUALMENTE COM RESPOSTAS E FILTROS:\n${formattedCurlItemsSection}` : ''}
${apiDocs ? `DOCUMENTAÇÃO GERAL / cURLs EM TEXTO BRUTO:\n${apiDocs}` : ''}
${(!formattedCurlItemsSection && !apiDocs) ? 'Nenhuma documentação crua fornecida; estruture endpoints REST representativos com boas práticas.' : ''}

6.1. MODELO DE RESPOSTA GLOBAL DA API (JSON SAMPLE RESPONSE) & REGRAS DE FILTRO:
${responseModelSample ? `EXEMPLO DE RESPOSTA REAL DA API (JSON):\n${responseModelSample}` : 'Nenhum modelo global adicional informado.'}
${businessFilters ? `FILTROS E ORDENAÇÕES ESPECÍFICAS DE NEGÓCIO SOLICITADAS:\n${businessFilters}` : ''}

7. INTEGRAÇÕES / ENDPOINTS ESPECÍFICOS SELECIONADOS:
${formattedIntegrations}

8. MIDPOINTS / INTEGRAÇÕES GENÉRICAS ADICIONADAS:
${formattedMidpoints}

9. MANUAL DE BOAS PRÁTICAS DO AGENTE (INJEÇÃO):
${manualGuidelines1 || 'Siga estritamente MONO SKILL, anti-alucinação, variáveis SZ e 6 dimensões.'}

10. MANUAL DE WORKFLOW FORTICS (INJEÇÃO):
${manualGuidelines2 || 'Siga especificação de nós instructions, code com _vars._request.body, rest e route_return.'}

${existingAgentJson ? `JSON DO AGENTE ATUAL A REFATORAR:\n${existingAgentJson}\n` : ''}
${existingWorkflowJson ? `JSON DO WORKFLOW ATUAL A REFATORAR:\n${existingWorkflowJson}\n` : ''}

OPÇÕES DE CONFORMIDADE:
- MONO SKILL estrito: ${options.monoSkillEnforced !== false}
- Anti-Alucinação rigoroso: ${options.antiHallucinationStrict !== false}
- Incluir Bloco Fenced JSON de Entidades: ${options.includeFencedJsonEntityBlock !== false}
- Variáveis de Contexto SZ (Opcional): ${options.useSZVariables ? `ATIVADAS: ${options.customSZVariables || '{{nome}}, {{telefone}}, {{cpf}}'}` : 'DESATIVADAS (O agente NÃO deve assumir variáveis pré-injetadas como {{nome}} ou {{telefone}}, devendo solicitar os dados diretamente ao usuário na conversa)'}

INSTRUÇÕES CRÍTICAS DE ENGENHARIA (PADRÃO FORTICS RIGOROSO):
- FILTRAGEM INTELIGENTE DE cURLs / DOCUMENTAÇÃO (PRIORIDADE MÁXIMA):
  * Se o usuário colou múltiplos cURLs ou documentação ampla (ex: 5 a 10 endpoints), mas no texto livre ou nos passos pediu apenas certas operações (ex: "verificar CPF e depois listar o contrato"), a IA DEVE SELECIONAR ESTRITAMENTE os cURLs necessários para essas operações (ex: 2 cURLs), ignorando e descartando os demais.
  * NUNCA crie nós ou workflows para cURLs não solicitados na instrução de atendimento.
- CADEIA DE DEPENDÊNCIA E EXIBIÇÃO CONTEXTUAL NO CHAT (OBRIGATÓRIO):
  * Se o fluxo possuir etapas ou integrações encadeadas (ex: 1ª API consulta CPF e retorna ID do cliente; 2ª API busca contratos pelo ID do cliente):
    - O AGENTE DEVE OBRIGATORIAMENTE EXIBIR O ID E DADOS RETORNADOS NA CONVERSA COM O CLIENTE (ex: "Localizei seu cadastro! Seu ID é [ID], Contrato nº [X]").
    - Isso é OBRIGATÓRIO no Fortics para fixar o ID no histórico do chat antes de chamar a próxima integração.
    - Declare este passo explicitamente em 'agent.instruction.steps' e a regra correspondente em 'agent.other_rules'.
- FIDELIDADE E INTELIGÊNCIA:
  * SE OS WORKFLOWS FORAM ESPECIFICADOS: O array "workflows" DEVE conter EXATAMENTE ${expectedWorkflowCount} item(ns), um para cada workflow configurado na seção 5. NUNCA invente workflows extras.
  * SE OS WORKFLOWS NÃO FORAM ESPECIFICADOS: A IA DEVE AGIR AUTOMATICAMENTE, deduzindo os workflows e endpoints REST ideais com base no Objetivo e Passos do Agente.
  * PASSOS DO AGENTE ('instruction.steps'): Deve seguir ESTRITAMENTE o que o usuário escreveu na seção 2. NÃO adicione etapas de abertura de chamados, prazos ou outros fluxos que não foram pedidos pelo usuário.
  * REGRAS DO AGENTE ('other_rules'): Deve refletir ESTRITAMENTE as regras e validações fornecidas na seção 3.
- SEPARAÇÃO INTELIGENTE DE PASSOS VS REGRAS:
  * 'instruction.steps': SÃO ESTRITAMENTE O QUE TEM QUE FAZER. NUNCA numere (sem '1.', '1-', 'Passo 1:'). NUNCA use prefixos em caixa alta (sem '1-IDENTIFICAÇÃO:', '2-COLETA:'). Escreva frases diretas e limpas em linguagem natural baseadas nos passos do usuário.
  * 'other_rules': É ESTRITAMENTE COMO VÃO FAZER. Descreva detalhadamente regras de formatação e validação de dados em Markdown baseadas nas regras do usuário, confirmação expressa antes de disparar integrações, exibição de IDs na conversa para chamadas encadeadas, regras anti-alucinação, variáveis SZ e tags de transbordo #HUMANO, #SUPORTE_HUMANO, #FINANCEIRO, #FIM.
- NO WORKFLOW ('workflow.json' e 'workflows'):
  * NÓ 'instructions' (OBRIGATÓRIO): Deve conter Título na 1ª linha, Descrição detalhada da função na 2ª linha, seção 'Args:' listando todos os parâmetros esperados com tipo/descrição, e seção 'Returns:' descrevendo o retorno estruturado (dict/JSON).
  * NÓ 'code' DE EXTRAÇÃO (OBRIGATÓRIO COM NOME 'request'):
    O primeiro nó de código deve ter "name": "request" e o script:
    try {
        let data = _vars._request.body;
     
        if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {
            data = data.data;
        }
     
        return data;
     
    } catch (e) {
        return {
            error: "Failed to extract request data",
            details: JSON.stringify(e)
        };
    }
  * NÓS 'rest' SUBSEQUENTES: Devem consumir os dados extraídos pelo nó de código utilizando '{{request.nome_do_campo}}' (ex: {{request.cpf}}, {{request.nome}}, {{request.id_cliente}}, {{request.descricao}}).
  * NÓ 'code' PÓS-REST (OBRIGATÓRIO: TRATAMENTO, FILTRO DE NEGÓCIO E HIGIENIZAÇÃO DE DADOS):
    - Imediatamente após a chamada REST, inclua SEMPRE um nó de código (ex: "name": "tratar_dados" ou "name": "processar_resposta").
    - Este nó deve ler a variável da resposta do nó REST anterior (ex: _vars.resposta_api), realizar JSON.parse se for string, descompactar arrays e objetos aninhados (ex: result.items, data, items).
    - APLICAÇÃO DE FILTROS/ORDENAÇÕES DE NEGÓCIO: Se o usuário solicitou regras como "pegar contrato mais em atraso", "somente contratos com status ativo", "ordenar por data", "filtrar por especialidade médica", o código JavaScript DEVE OBRIGATORIAMENTE conter a lógica de .filter() ou .sort() para selecionar ou priorizar o registro correto!
    - MAPEAMENTO DE PROPRIEDADES REAIS: Baseie-se nos nomes exatos dos campos vistos no Modelo de Resposta fornecido (ex: 'nin' para CPF/documento, 'specialty'/'specialist' para especialidade, 'crm' para CRM, 'valor', 'vencimento', 'dias_atraso', 'status').
    - HIGIENIZAÇÃO: Descarte campos irrelevantes ou poluídos (como tokens internos, hashes de calendário, campos nulos desnecessários) e retorne apenas os campos limpos e essenciais.
    - Retorne um objeto limpo e estruturado com { status: 'sucesso', total: limpos.length, item_principal: principal_ou_selecionado, itens: limpos }.
  * FINALIZAÇÃO 'route_return': Finalize sempre com nó 'route_return' status_code "200" e value "{{#tojson}}\\n{{tratar_dados}}\\n{{/tojson}}" (ou o nome da variável tratada).

Gere o JSON consolidado estritamente com as chaves:
{
  "agent": { ...objeto completo agente.json oficial refletindo os passos e regras do usuário... },
  "workflow": { ...objeto completo workflow.json principal... },
  "workflows": [
    ...array de workflow(s) individual(is) correspondendo aos workflows configurados...
  ],
  "summary": "Resumo executivo do que foi criado e cURLs selecionados",
  "variableChainSummary": "Mapeamento detalhado da cadeia de variáveis (Entrada -> 1ª API -> Retorno no Chat com ID -> 2ª API -> Resposta Final)"
}
`;

    let rawOutput = '';

    if (provider === 'openai' && apiKey) {
      rawOutput = await callOpenAI(apiKey, model, userPrompt, temperature);
    } else if (provider === 'anthropic' && apiKey) {
      rawOutput = await callAnthropic(apiKey, model, userPrompt, temperature);
    } else {
      // Default: Google Gemini server-side with resilient retry & fallback
      const ai = getGeminiClient();
      rawOutput = await generateGeminiWithFallback(
        ai,
        model || 'gemini-2.5-flash',
        userPrompt,
        FORTICS_SYSTEM_PROMPT,
        typeof temperature === 'number' ? temperature : 0.1
      );
    }

    // Parse output safely
    let parsed: any = {};
    try {
      // Extract json block if surrounded by markdown
      const jsonMatch = rawOutput.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawOutput];
      const cleanJson = jsonMatch[1] || rawOutput;
      parsed = JSON.parse(cleanJson);
    } catch (parseErr: any) {
      console.error('Failed to parse model JSON output:', parseErr, rawOutput);
      return res.status(500).json({
        success: false,
        error: 'A IA gerou uma resposta que não pôde ser convertida em JSON válido.',
        rawOutput
      });
    }

    // Ensure Agent schema compliance
    if (parsed.agent) {
      if (!parsed.agent.id) parsed.agent.id = crypto.randomUUID();
      if (!parsed.agent.name || parsed.agent.name.trim() === '') {
        parsed.agent.name = 'Agente Atendimento';
      }
      if (!parsed.agent.description) {
        parsed.agent.description = 'Assistente virtual para automação e integração de serviços.';
      }
      if (!parsed.agent.audience) {
        parsed.agent.audience = 'Clientes e usuários que entram em contato pelo canal de atendimento.';
      }
      if (!parsed.agent.greetings) {
        parsed.agent.greetings = `Olá! Sou o assistente virtual da empresa. Como posso te ajudar hoje?`;
      }
      if (!parsed.agent.style) {
        parsed.agent.style = 'Você é um assistente virtual prestativo, claro, empático e objetivo.';
      }
      if (typeof parsed.agent.enabled !== 'boolean') parsed.agent.enabled = true;
      if (typeof parsed.agent.emojis !== 'boolean') parsed.agent.emojis = true;
      if (typeof parsed.agent.force_greetings !== 'boolean') parsed.agent.force_greetings = false;
      if (typeof parsed.agent.ocr_enabled !== 'boolean') parsed.agent.ocr_enabled = true;
      if (typeof parsed.agent.protected !== 'boolean') parsed.agent.protected = false;
      if (typeof parsed.agent.webchat !== 'boolean') parsed.agent.webchat = false;
      if (typeof parsed.agent.template !== 'boolean') parsed.agent.template = true;
      if (typeof parsed.agent.voice_priority !== 'boolean') parsed.agent.voice_priority = false;
      if (typeof parsed.agent.void_context !== 'boolean') parsed.agent.void_context = true;
      if (typeof parsed.agent.media_upload_enabled !== 'boolean') parsed.agent.media_upload_enabled = false;
      if (!parsed.agent.offset) parsed.agent.offset = 'America/Sao_Paulo';
      if (!parsed.agent.tts_id) parsed.agent.tts_id = '00000000-0000-0000-0000-000000000000';
      if (!parsed.agent.llm_api_key) parsed.agent.llm_api_key = crypto.randomUUID();
      if (!parsed.agent.color) parsed.agent.color = '#3dd56d';
      if (!parsed.agent.icon) parsed.agent.icon = 'avatar-4';
      if (!parsed.agent.cat) parsed.agent.cat = 'atendimento';
      if (!parsed.agent.llm) parsed.agent.llm = 'GPT';
      if (!parsed.agent.llm_model) parsed.agent.llm_model = 'gpt-4.1';
      if (typeof parsed.agent.llm_temperature !== 'number') parsed.agent.llm_temperature = 0;

      // Validate instruction
      if (!parsed.agent.instruction || typeof parsed.agent.instruction !== 'object') {
        parsed.agent.instruction = {
          objective: parsed.agent.description || 'Atendimento e execução de integrações',
          role: 'Coletar os dados necessários e executar as operações. Siga os seguintes passos:',
          steps: []
        };
      }
      if (!Array.isArray(parsed.agent.instruction.steps)) {
        parsed.agent.instruction.steps = [];
      } else {
        // Enforce Fortics standard: Steps are WHAT to do (no numbering, no uppercase prefixes)
        parsed.agent.instruction.steps = parsed.agent.instruction.steps.map((st: any) => {
          if (typeof st !== 'string') return String(st || '');
          let clean = st.trim();
          // Remove numbering like "1-", "1. ", "Passo 1:", "Passo 1 - ", "[1] " etc.
          clean = clean.replace(/^(?:passo\s*\d+[\s\:\-]*|\d+[\.\-\)\:]\s*|\[\d+\]\s*)/i, '');
          // Remove uppercase prefix categories like "IDENTIFICAÇÃO: ", "COLETA: ", "CONFIRMAÇÃO - ", etc.
          clean = clean.replace(/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s_]{3,25}[:\-]\s*/, '');
          // Capitalize only first letter
          if (clean.length > 0) {
            clean = clean.charAt(0).toUpperCase() + clean.slice(1);
          }
          return clean.trim();
        }).filter((s: string) => s.length > 0);
      }
      if (!parsed.agent.instruction.role) {
        parsed.agent.instruction.role = 'Coletar os dados necessários e executar as operações. Siga os seguintes passos:';
      }
      if (!parsed.agent.instruction.role.includes('Siga os seguintes passos:')) {
        parsed.agent.instruction.role = parsed.agent.instruction.role.trim() + ' Siga os seguintes passos:';
      }
      if (!parsed.agent.other_rules) {
        parsed.agent.other_rules = '# REGRAS E DIRETRIZES DO AGENTE\n\n- Não invente informações.\n- Solicite confirmação expressa antes de gravar dados.\n- Em caso de dúvida ou solicitação de humano, retorne #SUPORTE_HUMANO.';
      }
    }

    // Standard Code Node value for request body unpacking
    const STANDARD_REQUEST_CODE = `try {
    let data = _vars._request.body;

    if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {
        data = data.data;
    }

    return data;

} catch (e) {
    return {
        error: "Failed to extract request data",
        details: JSON.stringify(e)
    };
}`;

    // Helper function to sanitize a workflow object
    const sanitizeWorkflow = (wf: any, fallbackName: string) => {
      if (!wf) return null;
      if (!wf.id) wf.id = crypto.randomUUID();
      if (!wf.name) wf.name = fallbackName;
      if (typeof wf.enabled !== 'boolean') wf.enabled = true;
      if (typeof wf.allow_workflow_import !== 'boolean') wf.allow_workflow_import = true;
      if (typeof wf.protected !== 'boolean') wf.protected = false;
      if (!wf.options || typeof wf.options !== 'object') {
        wf.options = {
          abort_keyword: '###',
          abort_message: 'Sessão abortada!',
          finish_message: 'Até a próxima!',
          inactivity_message: 'Sessão encerrada por inatividade!',
          inactivity_warning: 'Sua sessão vai expirar em breve por inatividade',
          inactivity_warning_time: 60,
          timeout: 300
        };
      }
      if (!Array.isArray(wf.flow)) {
        wf.flow = [];
      }
      
      let foundFirstCodeNode = false;

      wf.flow.forEach((n: any) => {
        if (!n.id) n.id = crypto.randomUUID();
        if (n.__spec === undefined) n.__spec = true;
        if (n.__spec_version === undefined) n.__spec_version = "1.0.0";

        // 1. Sanitize 'instructions' node
        if (n.type === 'instructions') {
          let content = n.content || '';
          if (!content.trim()) {
            content = `${wf.name || 'Execução de Integração'}.\nExecuta a operação no sistema externo e retorna dados estruturados.\n\nArgs:\n  dados (dict): Parâmetros coletados pelo agente.\n\nReturns:\n  dict: Objeto estruturado com status, protocolo e resposta.`;
          } else {
            // Check if Title/Description/Args/Returns exist
            const hasArgs = /Args:/i.test(content);
            const hasReturns = /Returns:|Resposta:/i.test(content);
            if (!hasArgs || !hasReturns) {
              if (!hasArgs) {
                content += `\n\nArgs:\n  parametros (dict): Dados e filtros para a requisição.`;
              }
              if (!hasReturns) {
                content += `\n\nReturns:\n  dict: Objeto JSON estruturado com status, protocolo e dados da consulta.`;
              }
            }
          }
          n.content = content;
        }

        // 2. Sanitize first 'code' extraction node -> name: "request" with STANDARD_REQUEST_CODE
        if (n.type === 'code' && !foundFirstCodeNode) {
          foundFirstCodeNode = true;
          // Set standard name 'request'
          const oldName = n.name || 'payload';
          n.name = 'request';
          if (!n.error_message) {
            n.error_message = 'Desculpe, ocorreu uma instabilidade ao processar os dados da requisição.';
          }
          // If script does request body unpacking, enforce standard robust code
          if (!n.value || n.value.includes('_vars._request') || n.value.includes('request') || n.value.includes('_vars')) {
            n.value = STANDARD_REQUEST_CODE;
          }

          // Normalize subsequent REST nodes that might have referenced oldName
          wf.flow.forEach((subNode: any) => {
            if (subNode.type === 'rest' && subNode.body && typeof subNode.body === 'string') {
              if (oldName !== 'request') {
                const regex = new RegExp(`{{${oldName}\\.`, 'g');
                subNode.body = subNode.body.replace(regex, '{{request.');
              }
              // Replace generic payload names
              subNode.body = subNode.body
                .replace(/{{payload_desempacotado\./g, '{{request.')
                .replace(/{{variavel_saida\./g, '{{request.')
                .replace(/{{dados_extraidos\./g, '{{request.');
            }
          });
        }

        // 3. Sanitize 'rest' HTTP node
        if (n.type === 'rest') {
          // Fortics uses 'uri' as the primary endpoint field
          if (!n.uri && n.url) {
            n.uri = n.url;
          }
          if (!n.uri) {
            n.uri = 'https://api.exemplo.com/endpoint';
          }
          if (n.url === undefined) {
            n.url = n.uri;
          }

          n.method = (n.method || 'GET').toUpperCase();
          if (n.verify_ssl === undefined) n.verify_ssl = true;
          if (!n.body_format) n.body_format = 'json';
          if (n.credential_id === undefined) n.credential_id = '';
          if (n.params === undefined) n.params = '';
          if (n.search_params === undefined) n.search_params = '';
          if (!Array.isArray(n.file_params)) n.file_params = [];

          // Sanitize headers: convert string or dirty array into clean HeaderItem[] without empty keys/values
          if (typeof n.headers === 'string') {
            const rawHeaderStr = n.headers;
            const parsedHeaders: Array<{ key: string; value: string }> = [];
            rawHeaderStr.split('\n').forEach((line: string) => {
              const parts = line.split(':');
              if (parts.length >= 2) {
                const k = parts[0].trim();
                const v = parts.slice(1).join(':').trim();
                if (k && v) {
                  parsedHeaders.push({ key: k, value: v });
                }
              }
            });
            n.headers = parsedHeaders.length > 0 ? parsedHeaders : [{ key: 'Content-Type', value: 'application/json' }];
          } else if (Array.isArray(n.headers)) {
            // Filter out empty rows that cause "Preencha este campo" in Fortics UI
            n.headers = n.headers.filter((h: any) => h && typeof h.key === 'string' && h.key.trim().length > 0 && typeof h.value === 'string' && h.value.trim().length > 0);
            if (n.headers.length === 0 && (n.method === 'POST' || n.method === 'PUT' || n.method === 'PATCH')) {
              n.headers = [{ key: 'Content-Type', value: 'application/json' }];
            }
          } else {
            n.headers = (n.method === 'POST' || n.method === 'PUT' || n.method === 'PATCH') ? [{ key: 'Content-Type', value: 'application/json' }] : [];
          }

          // Sanitize query_params
          if (Array.isArray(n.query_params)) {
            n.query_params = n.query_params.filter((q: any) => q && typeof q.key === 'string' && q.key.trim().length > 0);
          } else {
            n.query_params = [];
          }
        }
      });
      return wf;
    };

    // Ensure Workflow schema compliance
    if (parsed.workflow) {
      sanitizeWorkflow(parsed.workflow, (parsed.agent?.name || 'Workflow') + ' Principal');
    }

    // Ensure workflows array compliance (Multiple Modular Workflows)
    let sanitizedWorkflows: any[] = [];
    if (Array.isArray(parsed.workflows) && parsed.workflows.length > 0) {
      sanitizedWorkflows = parsed.workflows.map((wf: any, idx: number) => {
        return sanitizeWorkflow(wf, `Workflow ${idx + 1} - ${wf.name || 'Operação'}`);
      }).filter(Boolean);
    } else if (parsed.workflow) {
      // If LLM returned only 1 workflow, make workflows array contain it as well
      sanitizedWorkflows = [parsed.workflow];
    }

    res.json({
      success: true,
      agent: parsed.agent,
      workflow: parsed.workflow || sanitizedWorkflows[0],
      workflows: sanitizedWorkflows,
      summary: parsed.summary || 'Agente e Workflows gerados com sucesso de acordo com as especificações Fortics.',
      variableChainSummary: parsed.variableChainSummary || 'Cadeia de variáveis mapeada entre contexto, passos do agente e nós dos workflows.'
    });
  } catch (error: any) {
    console.error('Error generating Fortics artifacts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro inesperado ao gerar Agente e Workflow.'
    });
  }
});

// API Simulate Chat in Sandbox
app.post('/api/simulate-chat', async (req, res) => {
  try {
    const {
      agent,
      workflow,
      history = [],
      userMessage = '',
      contextVariables = {
        telefone: '+5511999998888',
        nome: 'Carlos Oliveira',
        cpf: '123.456.789-00',
        canal: 'whatsapp'
      }
    } = req.body;

    const simulationPrompt = `
Você está simulando o runtime exato da LLM do Fortics Omnichannel interagindo com um usuário.
Aqui está a configuração completa do Agente:
${JSON.stringify(agent, null, 2)}

Aqui está a configuração do Workflow conectado (como ferramenta/tool):
${JSON.stringify(workflow, null, 2)}

VARIÁVEIS DE CONTEXTO DO SZ DISPONÍVEIS AUTOMATICAMENTE:
${JSON.stringify(contextVariables, null, 2)}

HISTÓRICO DA CONVERSA:
${JSON.stringify(history, null, 2)}

NOVA MENSAGEM DO USUÁRIO:
"${userMessage}"

INSTRUÇÃO DE EXECUÇÃO:
1. Avalie o estado atual da conversa, os passos do agente e as regras do campo 'other_rules'.
2. Se o usuário estiver irritado ou pedir atendente humano, retorne SOMENTE o token de transbordo (ex: #SUPORTE_HUMANO ou #HUMANO) sem nenhum texto adicional.
3. Se todos os dados necessários para o Workflow tiverem sido confirmados, gere a resposta com o bloco json fenced com os dados a enviar para a ferramenta, e simule a execução do Workflow retornando o resultado.
4. Responda estritamente no estilo, persona e escopo do Agente Fortics.
5. Retorne um JSON com a seguinte estrutura:
{
  "agentResponse": "Texto da resposta do agente ao usuário",
  "routingTokenTriggered": "#HUMANO ou null",
  "extractedEntities": { "chave": "valor" },
  "workflowExecuted": true | false,
  "workflowTrace": [
    { "nodeType": "code", "nodeName": "...", "status": "success", "output": { ... } }
  ]
}
`;

    const ai = getGeminiClient();
    const rawSim = await generateGeminiWithFallback(
      ai,
      'gemini-3.7-flash',
      simulationPrompt,
      'Você é o motor de execução e sandbox de Agentes e Workflows do Fortics.',
      0.1
    );

    const jsonMatch = rawSim.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawSim];
    const cleanJson = (jsonMatch[1] || rawSim).trim();
    const parsed = JSON.parse(cleanJson);

    res.json({
      success: true,
      data: parsed
    });
  } catch (error: any) {
    console.error('Error simulating chat:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao simular conversa do agente.'
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fortics Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
