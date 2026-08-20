import express from 'express';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export const app = express();

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
  "name": "Nome Funcional", (ex: "Agente de Suporte", "Assistente Comercial", "Agente Financeiro StarConect", "Estela - Agente de Triagem")
  "description": "Descrição específica de escopo e função",
  "audience": "Público-alvo claro (ex: Clientes residenciais, leads, etc.)",
  "cat": "slug_da_categoria", (ex: "support_net", "commercial_net", "finance_net", "medical_scheduling", "provider_multiskill")
  "color": "#d500f9", (ou hex adequado)
  "icon": "avatar-1",
  "emojis": true,
  "enabled": true,
  "force_greetings": false,
  "greetings": "Saudação objetiva e contextualizada",
  "style": "Tom direto, natural, cordial e objetivo.",
  "llm": "GPT",
  "llm_api_key": "<UUID-v4>",
  "llm_model": "gpt-4.1",
  "llm_temperature": 0, (0.0 para operações factuais/suporte/financeiro)
  "ocr_enabled": true,
  "protected": true,
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
      "Frases diretas e limpas sem numeração nem prefixos em caixa alta"
    ]
  },
  "other_rules": "### IDENTIDADE\\n...\\n### TABELA DE CONFIGURAÇÕES\\n| Parâmetro | Valor |\\n...\\n### COMPORTAMENTO E LINGUAGEM\\n- Máximo 3 a 4 linhas por resposta.\\n- Nunca faça mais de 1 pergunta por mensagem.\\n- Não simular sistemas internos.\\n...\\n### REGRAS CRÍTICAS DE NEGÓCIO E VALIDAÇÃO\\n- Validação de CPF/CNPJ.\\n- Exibição contextual obrigatória de dados chave: id_cliente + cpf/cnpj + contratos + status.\\n...\\n### MENSAGENS PADRONIZADAS\\n> [MSG: nome_mensagem]\\n> Texto estruturado da mensagem...\\n...\\n### TAGS DE TRANSBORDO (#)\\n| Tag | Quando usar |\\n| #HUMANO | Exceções, insatisfação, cancelamento |\\n| #SUPORTE | Problemas de conexão e lentidão |\\n| #FINANCEIRO | Boletos, 2ª via, PIX, desbloqueio |\\n| #COMERCIAL | Planos, upgrade, contratação |\\n| #FIM | Atendimento finalizado |"
}

### B. ESTRUTURA OFICIAL DO WORKFLOW (workflow.json):
{
  "id": "<UUID-v4>",
  "name": "Nome Descritivo do Workflow",
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
    "timeout": 500
  },
  "flow": [
    // 1. instructions (Tool Spec com Args e Returns documentados)
    // 2. code (name: 'request' - Desempacotador padrão de _vars._request.body)
    // 3. rest (HTTP com verify_ssl, headers, body_format: 'json', {{request.campo}} ou Bearer {{token.token}})
    // 4. code ('tratar_dados' ou filtros avançados com normalização de acentos, shift() e tratamento try/catch)
    // 5. label / goto (para controle de loop e paginação iterativa de listas)
    // 6. condition (== com left/right e ramos then/else)
    // 7. route_return (finalização obrigatória com {{#tojson}}{{tratar_dados}}{{/tojson}})
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

### F. WORKFLOWS COM MÚLTIPLAS ETAPAS ENCADEADAS (PIPELINE MULTI-REST NO MESMO WORKFLOW):
Quando o usuário configurar múltiplos cURLs/APIs para serem executados em sequência no MESMO workflow (ex: 1º Autenticação/Token ➔ 2º Busca de Informações com Token ➔ 3º Ação/Gravação Final):
1. O grafo 'flow' do workflow DEVE ser construído como uma esteira encadeada contínua dentro do mesmo arquivo JSON:
   - Nó 1: 'instructions' (descreve a ferramenta para a LLM com todos os Args necessários).
   - Nó 2: 'code' (name: 'request' - desempacota o body).
   - Nó 3: 'rest' (name: 'token' ou 'etapa_1' - executa a 1ª chamada HTTP).
   - Nó 4: 'code' (name: 'tratar_etapa_1' - processa a resposta de _vars.token e prepara variáveis).
   - Nó 5: 'rest' (name: 'etapa_2' - consome {{token.token}} no Header e {{request.campo}} ou {{tratar_etapa_1.id}} na rota/body).
   - Nó 6: 'code' (name: 'tratar_etapa_2' - filtra e processa o retorno da 2ª chamada).
   - Nó 7...N: 'rest' e 'code' subsequentes para as demais integrações.
   - Nó Final: 'route_return' (retorna o payload consolidado com {{#tojson}}{{ultimo_tratar_dados}}{{/tojson}}).
2. O Agente LLM enxerga essa cadeia como 1 única Tool de alta velocidade, executando toda a esteira de backend em uma única chamada!

### G. CADEIA DE DEPENDÊNCIA E EXIBIÇÃO CONTEXTUAL NO DIÁLOGO (CONTEXT BINDING):
1. Se as etapas forem executadas em workflows modulares separados onde o cliente precisa escolher algo entre elas:
   - O Agente DEVE OBRIGATORIAMENTE exibir o resultado chave na conversa (ex: "Seu ID é [ID_CLIENTE]") para que a LLM tenha o dado no histórico e consiga passar no 2º workflow.

### H. DEDUÇÃO AUTOMÁTICA DO AGENTE A PARTIR DAS INTEGRAÇÕES (WORKFLOW-FIRST / API-DRIVEN SYNTHESIS):
Quando o usuário configurar a esteira de cURLs/APIs, a IA DEVE derivar e construir automaticamente todo o comportamento do Agente ('agent.instruction.steps' e 'agent.other_rules'):
1. O 1º passo do Agente cumprimenta e solicita os parâmetros de entrada da 1ª API (ex: "Solicitar CPF/CNPJ do titular").
2. O 2º passo executa a 1ª ferramenta com o dado coletado.
3. Se a 2ª API depender do retorno da 1ª (ex: 'id_cliente' ou 'id_contrato'), o Agente utiliza o valor recebido da 1ª ferramenta para disparar a 2ª ferramenta (ou lista as opções para o cliente escolher antes de avançar).
4. Os passos seguintes continuam a esteira até a entrega do resultado final ao cliente.
5. As 'other_rules' são preenchidas com as validações de formato dos parâmetros (ex: 11 dígitos para CPF), confirmação prévia e tags de transbordo (#SUPORTE_HUMANO / #HUMANO).

REGRAS DE OURO:
1. Retorne SEMPRE um objeto JSON válido contendo exatamente as chaves:
   - "agent": objeto completo do agente.
   - "workflow": workflow consolidado principal contendo os nós das APIs informadas.
   - "workflows": array de workflows modulares correspondendo EXATAMENTE à lista de APIs solicitadas pelo usuário (se o usuário pediu 2 operações encadeadas, retorne 2 workflows modulares). NUNCA invente APIs extras.
   - "summary": resumo executivo destacando os cURLs selecionados e a lógica do fluxo.
   - "variableChainSummary": rastreio da cadeia de variáveis (Entrada -> 1ª API -> Retorno no Chat com ID -> 2ª API -> Resposta Final).
2. Todos os nós e objetos raiz de cada workflow devem ter UUIDs v4 válidos gerados.
3. FIDELIDADE AOS PASSOS E REGRAS: Os passos em 'agent.instruction.steps' e as regras em 'agent.other_rules' devem refletir FIELMENTE o que o usuário escreveu, sem inventar outros processos ou etapas não solicitadas.
4. PADRÃO OBRIGATÓRIO DO COMPONENTE 'instructions' (EXTENSÃO DO PROMPT / LINGUAGEM NATURAL DE NEGÓCIO):
   - Cada workflow DEVE ter SEMPRE EXATAMENTE UM ÚNICO nó de tipo 'instructions' no início do 'flow' (Nó 1).
   - O campo 'content' do nó 'instructions' funciona como a Tool Specification do Agente LLM. Por isso, DEVE ser escrito em LINGUAGEM NATURAL E CLARA DE NEGÓCIO (NUNCA use jargões técnicos como "via requisição HTTP POST/GET" ou termos de máquina).
   - ESTRUTURA OBRIGATÓRIA DO CONTENT:
     Linha 1: [TÍTULO CLARO EM LINGUAGEM NATURAL]: (ex: "Consulta de Cliente", "Listagem de Contratos Ativos", "Emissão de 2ª Via de Fatura").
     Linhas 2-4: [DESCRIÇÃO EM LINGUAGEM NATURAL]: Explique o que o workflow faz para o atendimento (ex: "Realiza a consulta cadastral do cliente com o número de CPF ou CNPJ que o cliente forneceu durante o atendimento. Dispare esta ferramenta para verificar o cadastro e obter o histórico do cliente.").
     Seção Args:
       Args:
         <nome_param> (<tipo>): <descrição em linguagem natural do que o cliente forneceu no chat (ex: 'cpf (str): Número do CPF ou documento fornecido pelo cliente no atendimento')>.
     Seção Returns:
       Returns:
         dict: Informações e dados tratados que retornam para o Agente formular a resposta ao cliente.
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
  const chosenModel = model || 'gpt-5.6-sol';
  const isReasoning = chosenModel.startsWith('o1') || chosenModel.startsWith('o3') || chosenModel.endsWith('-pro');

  const requestBody: any = {
    model: chosenModel,
    messages: [
      { role: isReasoning ? 'user' : 'system', content: FORTICS_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ]
  };

  if (!isReasoning) {
    requestBody.temperature = temperature;
    requestBody.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  });
  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText;
    try {
      const errJson = JSON.parse(errorText);
      message = errJson.error?.message || errorText;
    } catch (_) {}
    throw new Error(`OpenAI API (${response.status}): ${message}`);
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
      model: model || 'claude-opus-5',
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
    let message = errorText;
    try {
      const errJson = JSON.parse(errorText);
      message = errJson.error?.message || errorText;
    } catch (_) {}
    throw new Error(`Anthropic API (${response.status}): ${message}`);
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
  const modelsToTry = [
    requestedModel || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-3.7-flash'
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
          await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
        } else {
          break;
        }
      }
    }
  }

  throw lastError || new Error('Modelos temporariamente indisponíveis. Por favor tente novamente.');
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

const apiRouter = express.Router();

// API Health
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// API Generate / Refactor
apiRouter.post('/generate', async (req, res) => {
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

    if (workflowArchitectureMode === 'single_consolidated') {
      // Top priority for Consolidated Pipeline: 1 single workflow containing all integrations
      hasExplicitWorkflows = true;
      expectedWorkflowCount = 1;
      const allItems = (configuredWorkflows && Array.isArray(configuredWorkflows) && configuredWorkflows.length > 0)
        ? configuredWorkflows.flatMap((w: any) => w.curlItems || [])
        : validCurlItems;

      formattedWorkflowsSection = `
### ARQUITETURA ESCOLHIDA PELO USUÁRIO: 1 ÚNICO WORKFLOW CONSOLIDADO (TODAS AS INTEGRAÇÕES EM 1 CADEIA CONTÍNUA / PIPELINE)
- Total de Chamadas/Etapas de API configuradas: ${allItems.length}
- DIRETIVA OBRIGATÓRIA: TODAS as requisições REST abaixo DEVEM SER ENCADEADAS EM SEQUÊNCIA DENTRO DE 1 ÚNICO 'workflow.json' (e o array 'workflows' DEVE conter EXATAMENTE 1 item):
${allItems.map((item: any, idx: number) => `
  -> Etapa ${idx + 1}: "${item.name || `Etapa ${idx + 1}`}"
     - cURL: ${item.curl}
     ${item.responseSample ? `- Exemplo de Resposta: ${item.responseSample}` : ''}
     ${item.filterRules ? `- Regras de Filtro: ${item.filterRules}` : ''}
`).join('\n')}

- ESTRUTURA DO GRAFO DO WORKFLOW CONSOLIDADO (TUDO EM 1 ARQUIVO):
  1. Nó 'instructions' explicando o fluxo completo de todas as etapas.
  2. Nó 'code' com "name": "request" para extrair os dados iniciais.
  3. Sequência contínua de nós REST e Code intermediários:
     [rest_etapa_1] -> [tratar_etapa_1] -> [rest_etapa_2] -> [tratar_etapa_2] -> ... -> [route_return].
  4. Nó final 'route_return' retornando o resultado tratado da última etapa.
`;
    } else if (configuredWorkflows && Array.isArray(configuredWorkflows) && configuredWorkflows.length > 0) {
      // Top priority: Workflows explicitly grouped (each workflow can contain 1 or multiple chained HTTP calls)
      hasExplicitWorkflows = true;
      expectedWorkflowCount = configuredWorkflows.length;
      formattedWorkflowsSection = configuredWorkflows.map((wf: any, idx: number) => {
        const wfNum = idx + 1;
        const isChained = wf.curlItems && wf.curlItems.length > 1;
        const calls = (wf.curlItems && Array.isArray(wf.curlItems) && wf.curlItems.length > 0)
          ? wf.curlItems.map((step: any, sIdx: number) => `
  -> Chamada HTTP ${sIdx + 1}: "${step.name || `Etapa ${sIdx + 1}`}"
     - Comando cURL: ${step.curl}
     ${step.responseSample ? `- Exemplo de Resposta: ${step.responseSample}` : ''}
     ${step.filterRules ? `- Regras de Filtro: ${step.filterRules}` : ''}
`).join('\n')
          : (wf.apiCalls && Array.isArray(wf.apiCalls) && wf.apiCalls.length > 0)
            ? wf.apiCalls.map((step: any, sIdx: number) => `
  -> Chamada HTTP ${sIdx + 1}: [${step.method || 'GET'}] ${step.pathOrUrl || '/api'}
     - Nome: ${step.name || `Chamada ${sIdx + 1}`}
     - Exemplo de Resposta: ${step.responseSample || 'N/A'}
`).join('\n')
            : '  -> [Chamadas não detalhadas]';

        return `
### WORKFLOW ${wfNum}: "${wf.name || `Workflow ${wfNum}`}"
- Estrutura: ${isChained ? `CADEIA MULTI-REST COM ${wf.curlItems.length} CHAMADAS HTTP ENCADEADAS NO MESMO WORKFLOW` : 'Workflow simples com 1 chamada REST'}
- Chamadas HTTP internas configuradas para este Workflow:
${calls}
- INSTRUÇÃO OBRIGATÓRIA PARA ESTE WORKFLOW:
  * Gere 1 arquivo workflow.json para este Workflow ${wfNum}.
  ${isChained ? `* Como possui ${wf.curlItems.length} chamadas HTTP, este workflow DEVE conter todos os nós REST e Code encadeados em sequência contínua dentro do seu grafo ('flow').` : `* Como possui 1 chamada HTTP, gere o fluxo padrão de 5 nós.`}
`;
      }).join('\n----------------------------------------\n');
    } else if (validCurlItems.length > 0) {
      // Generate workflows directly from the user's provided cURL(s)
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
    if (inputMode === 'workflow_driven') {
      stepsAndRulesSection = `
2. MODO AUTOMÁTICO DERIVADO DOS WORKFLOWS (API-FIRST / WORKFLOW-DRIVEN AGENT):
-> DIRETIVA OBRIGATÓRIA:
   O usuário optou por deduzir o comportamento do Agente AUTOMATICAMENTE a partir da ordem dos cURLs e integrações configuradas abaixo.
   A IA DEVE:
   a) Construir 'agent.instruction.steps' mapeando sequencialmente:
      1. Cumprimento e identificação do cliente com solicitação dos parâmetros iniciais exigidos pela 1ª API (ex: CPF/CNPJ/Documento).
      2. Disparo da 1ª ferramenta de integração.
      3. Utilização dos dados/IDs retornados da 1ª etapa para chamar a 2ª ferramenta (ou apresentar opções para o cliente escolher antes de prosseguir).
      4. Continuação da esteira até a entrega dos dados finais/protocolo ao cliente.
   b) Construir 'agent.other_rules' com regras reais de validação dos parâmetros (ex: aceitar CPF com 11 dígitos com ou sem pontuação: XXX.XXX.XXX-XX ou apenas números) e diretrizes anti-alucinação. NÃO invente tags de transbordo (como #SUPORTE_HUMANO) a menos que o usuário tenha solicitado expressamente nas regras adicionais.${naturalRules ? `\nREGRAS EXTRAS DO USUÁRIO:\n${naturalRules}` : ''}
`;
    } else if (inputMode === 'freeform' && freeformPrompt && freeformPrompt.trim()) {
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

    try {
      if (provider === 'openai') {
        const effectiveKey = (apiKey && apiKey.trim()) || process.env.OPENAI_API_KEY || '';
        if (!effectiveKey) {
          return res.status(400).json({
            success: false,
            error: 'Chave da OpenAI não informada. Por favor, informe sua chave de API (sk-...) nas configurações de IA ou configure OPENAI_API_KEY no painel da Vercel.'
          });
        }
        rawOutput = await callOpenAI(effectiveKey, model, userPrompt, temperature);
      } else if (provider === 'anthropic') {
        const effectiveKey = (apiKey && apiKey.trim()) || process.env.ANTHROPIC_API_KEY || '';
        if (!effectiveKey) {
          return res.status(400).json({
            success: false,
            error: 'Chave da Anthropic (Claude) não informada. Por favor, informe sua chave de API (sk-ant-...) nas configurações de IA ou configure ANTHROPIC_API_KEY no painel da Vercel.'
          });
        }
        rawOutput = await callAnthropic(effectiveKey, model, userPrompt, temperature);
      } else {
        // Google Gemini (Localhost Dev or with key)
        const customGeminiKey = (apiKey && apiKey.trim()) ? apiKey.trim() : (process.env.GEMINI_API_KEY || '');
        if (!customGeminiKey) {
          throw new Error('DEV_SYNTHESIZER_FALLBACK');
        }
        const ai = new GoogleGenAI({ apiKey: customGeminiKey });
        rawOutput = await generateGeminiWithFallback(
          ai,
          model || 'gemini-2.5-flash',
          userPrompt,
          FORTICS_SYSTEM_PROMPT,
          typeof temperature === 'number' ? temperature : 0.1
        );
      }
    } catch (llmError: any) {
      // If the user explicitly configured OpenAI or Anthropic and it failed, return explicit error!
      if (provider === 'openai' || provider === 'anthropic') {
        console.error(`LLM Provider ${provider} failed:`, llmError?.message || llmError);
        return res.status(400).json({
          success: false,
          error: `Falha ao processar com ${provider.toUpperCase()}: ${llmError?.message || 'Chave inválida ou sem créditos disponíveis.'}`
        });
      }

      // If user provided a custom Gemini key and it failed:
      if (provider === 'gemini' && apiKey && llmError.message !== 'DEV_SYNTHESIZER_FALLBACK') {
        console.error('Custom Gemini Key failed:', llmError?.message || llmError);
        return res.status(400).json({
          success: false,
          error: `Falha ao conectar com o Google Gemini: ${llmError?.message || 'Verifique sua chave de API.'}`
        });
      }

      console.warn('Localhost Dev Synthesizer active. Synthesizing structural Fortics schemas directly...');

      // High-quality deterministic synthesis of Fortics schemas from user inputs
      let stepsArray: string[] = [];
      if (inputMode === 'workflow_driven' || (validCurlItems.length > 0 && !naturalSteps)) {
        const cleanName = (raw: string) => (raw || 'consulta de informações').replace(/^[0-9.\-_ ]+/, '').trim().toLowerCase();
        stepsArray = [
          'Cumprimentar o cliente e solicitar documento/parâmetro inicial',
          ...validCurlItems.map((c: any, idx: number) => {
            const name = cleanName(c.name);
            return idx === 0
              ? `Executar a ${name} com o documento informado`
              : `Com o identificador retornado na etapa anterior, executar a ${name}`;
          }),
          'Confirmar os dados e entregar o resultado estruturado ao cliente'
        ];
      } else {
        stepsArray = (naturalSteps || '')
          .split('\n')
          .map((s: string) => s.replace(/^[-*•\d.]+\s*/, '').trim())
          .filter(Boolean);
      }

      let generatedWorkflowsList: any[] = [];

      const validConfiguredWorkflows = (configuredWorkflows && Array.isArray(configuredWorkflows))
        ? configuredWorkflows.filter((cw: any) => cw.curlItems && Array.isArray(cw.curlItems) && cw.curlItems.length > 0)
        : [];

      if (validConfiguredWorkflows.length > 0) {
        if (workflowArchitectureMode === 'single_consolidated') {
          // Merge all curlItems from all configured workflows into 1 pipeline
          const allCurlItems = validConfiguredWorkflows.flatMap((cw: any) => cw.curlItems || []);
          const chainedFlowNodes: any[] = [];

          const pipelineTitle = validConfiguredWorkflows.length > 1
            ? `Fluxo Integrado (${validConfiguredWorkflows.map((c: any) => (c.name || 'Etapa').replace(/^[0-9.\-_ ]+/, '').trim()).join(' ➔ ')})`
            : ((validConfiguredWorkflows[0].name || 'Consulta de Informações').replace(/^[0-9.\-_ ]+/, '').trim());

          const pipelineDesc = `Executa o fluxo completo de atendimento para ${validConfiguredWorkflows.map((c: any) => (c.name || 'consulta').replace(/^[0-9.\-_ ]+/, '').trim().toLowerCase()).join(', ')} utilizando os dados e o número de documento que o cliente forneceu na conversa.\nDispare esta ferramenta assim que coletar o documento do cliente para processar os dados.`;

          const pipelineArgs = `Args:\n` +
            `  documento (str): Número de CPF, CNPJ ou documento fornecido pelo cliente durante o atendimento. Obrigatório.` +
            (allCurlItems.length > 1 ? `\n  parametro_adicional (str, opcional): Informações complementares fornecidas pelo cliente caso necessário.` : '');

          const pipelineReturns = `Returns:\n  dict: Resultado estruturado e dados tratados que retornam para o Agente responder diretamente ao cliente no chat.`;

          chainedFlowNodes.push({
            id: crypto.randomUUID(),
            type: 'instructions',
            __spec: true,
            __spec_version: '1.0.0',
            content: `${pipelineTitle}\n${pipelineDesc}\n\n${pipelineArgs}\n\n${pipelineReturns}`
          });

          chainedFlowNodes.push({
            id: crypto.randomUUID(),
            name: 'request',
            type: 'code',
            __spec: true,
            __spec_version: '1.0.0',
            error_message: 'Erro ao extrair parâmetros da requisição',
            value: STANDARD_REQUEST_CODE
          });

          allCurlItems.forEach((item: any, idx: number) => {
            const cleanUri = item.curl.match(/(?:curl\s+(?:--location\s+)?['"]?)(https?:\/\/[^\s'"]+)/i)?.[1] || 'https://api.exemplo.com.br/v1/endpoint';
            const cleanMethod = item.curl.match(/-X\s+([A-Z]+)/i)?.[1] || (item.curl.includes('--data') || item.curl.includes('-d ') ? 'POST' : 'GET');
            const nodeName = item.nodeName || (idx === 0 && (cleanUri.includes('auth') || cleanUri.includes('token') || cleanUri.includes('login')) ? 'token' : `etapa_${idx + 1}`);

            const headers: any[] = [{ key: 'Content-Type', value: 'application/json' }];
            if (idx > 0) {
              headers.push({ key: 'Authorization', value: 'Bearer {{token.token}}' });
            }

            chainedFlowNodes.push({
              id: crypto.randomUUID(),
              name: nodeName,
              type: 'rest',
              __spec: true,
              __spec_version: '1.0.0',
              method: cleanMethod,
              uri: cleanUri,
              verify_ssl: true,
              body_format: 'json',
              credential_id: '',
              headers: headers,
              params: '',
              query_params: [],
              search_params: '',
              file_params: [],
              body: cleanMethod === 'POST' ? '{\n  "documento": "{{request.documento}}"\n}' : ''
            });

            chainedFlowNodes.push({
              id: crypto.randomUUID(),
              name: `tratar_${nodeName}`,
              type: 'code',
              __spec: true,
              __spec_version: '1.0.0',
              error_message: `Erro ao processar dados da etapa ${idx + 1}`,
              value: idx === 0 && nodeName === 'token'
                ? `try {\n    let raw = _vars.${nodeName};\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    return {\n        token: (raw && (raw.access_token || raw.token || raw.jwt)) || 'TOKEN_EXTRAIDO',\n        status: 'autenticado'\n    };\n} catch(e) {\n    return { status: 'erro', message: e.message };\n}`
                : `try {\n    let raw = _vars.${nodeName};\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    let items = (raw && raw.result && raw.result.items) ? raw.result.items :\n                (raw && raw.data) ? raw.data : [raw];\n    return { status: 'sucesso', itens: items, total: items.length };\n} catch(e) {\n    return { status: 'erro', message: e.message };\n}`
            });
          });

          const lastNodeName = allCurlItems[allCurlItems.length - 1].nodeName || `etapa_${allCurlItems.length}`;
          chainedFlowNodes.push({
            id: crypto.randomUUID(),
            type: 'route_return',
            __spec: true,
            __spec_version: '1.0.0',
            content_type: 'application/json',
            status_code: '200',
            value: `{{#tojson}}\n{{tratar_${lastNodeName}}}\n{{/tojson}}`
          });

          generatedWorkflowsList = [{
            id: crypto.randomUUID(),
            name: 'WF - Pipeline Encadeado Integrado',
            enabled: true,
            allow_workflow_import: true,
            protected: false,
            options: {
              abort_keyword: '###',
              abort_message: 'Sessão abortada!',
              finish_message: 'Atendimento concluído!',
              inactivity_message: 'Sessão encerrada por inatividade!',
              inactivity_warning: 'Sua sessão vai expirar em breve',
              inactivity_warning_time: 60,
              timeout: 300
            },
            flow: chainedFlowNodes
          }];
        } else {
          // multiple_modular: each configuredWorkflow becomes 1 workflow.json
          generatedWorkflowsList = validConfiguredWorkflows.map((cw: any, cwIdx: number) => {
            const rawWfName = (cw.name || `Operação ${cwIdx + 1}`).replace(/^[0-9.\-_ ]+/, '').trim();
            const modTitle = rawWfName.charAt(0).toUpperCase() + rawWfName.slice(1);
            const isChained = cw.curlItems && cw.curlItems.length > 1;

            const modDesc = isChained
              ? `Realiza o fluxo encadeado de ${modTitle.toLowerCase()} (${cw.curlItems.length} etapas técnicas automáticas no backend) com as informações fornecidas pelo cliente.`
              : `Realiza a ${modTitle.toLowerCase()} com o número de documento (CPF ou CNPJ) ou identificador que o cliente forneceu durante o atendimento.`;

            const modArgs = `Args:\n  documento (str): Número do documento (CPF ou CNPJ) ou identificador fornecido pelo cliente na conversa. Obrigatório.` +
              (cwIdx > 0 ? `\n  id_referencia (str, opcional): Identificador ou código recebido na etapa anterior para localização dos dados.` : '');
            const modReturns = `Returns:\n  dict: Informações e dados cadastrais tratados que retornam para o Agente responder diretamente ao cliente no chat.`;

            const flowNodes: any[] = [];

            // 1. Instructions
            flowNodes.push({
              id: crypto.randomUUID(),
              type: 'instructions',
              __spec: true,
              __spec_version: '1.0.0',
              content: `${modTitle}\n${modDesc}\n\n${modArgs}\n\n${modReturns}`
            });

            // 2. Request
            flowNodes.push({
              id: crypto.randomUUID(),
              name: 'request',
              type: 'code',
              __spec: true,
              __spec_version: '1.0.0',
              error_message: 'Desculpe, ocorreu uma instabilidade ao processar os parâmetros.',
              value: STANDARD_REQUEST_CODE
            });

            // 3. Chain each curlItem in this workflow
            cw.curlItems.forEach((cItem: any, cIdx: number) => {
              const cleanUri = cItem.curl.match(/(?:curl\s+(?:--location\s+)?['"]?)(https?:\/\/[^\s'"]+)/i)?.[1] || 'https://api.exemplo.com.br/v1/endpoint';
              const cleanMethod = cItem.curl.match(/-X\s+([A-Z]+)/i)?.[1] || (cItem.curl.includes('--data') || cItem.curl.includes('-d ') ? 'POST' : 'GET');
              const nodeName = cItem.nodeName || (isChained ? (cIdx === 0 && (cleanUri.includes('auth') || cleanUri.includes('token') || cleanUri.includes('login')) ? 'token' : `etapa_${cIdx + 1}`) : `resposta_api_${cwIdx + 1}`);

              const headers: any[] = [{ key: 'Content-Type', value: 'application/json' }];
              if (cIdx > 0) {
                headers.push({ key: 'Authorization', value: 'Bearer {{token.token}}' });
              }

              // REST node
              flowNodes.push({
                id: crypto.randomUUID(),
                name: nodeName,
                type: 'rest',
                __spec: true,
                __spec_version: '1.0.0',
                method: cleanMethod,
                uri: cleanUri,
                verify_ssl: true,
                body_format: 'json',
                credential_id: '',
                headers: headers,
                params: '',
                query_params: [],
                search_params: '',
                file_params: [],
                body: cleanMethod === 'POST' ? '{\n  "documento": "{{request.documento}}"\n}' : ''
              });

              // Code treatment
              flowNodes.push({
                id: crypto.randomUUID(),
                name: `tratar_${nodeName}`,
                type: 'code',
                __spec: true,
                __spec_version: '1.0.0',
                error_message: `Erro ao formatar os dados da etapa ${cIdx + 1}`,
                value: cIdx === 0 && nodeName === 'token'
                  ? `try {\n    let raw = _vars.${nodeName};\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    return {\n        token: (raw && (raw.access_token || raw.token || raw.jwt)) || 'TOKEN_EXTRAIDO',\n        status: 'autenticado'\n    };\n} catch(e) {\n    return { status: 'erro', message: e.message };\n}`
                  : `try {\n    let raw = _vars.${nodeName};\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    let items = (raw && raw.result && raw.result.items) ? raw.result.items :\n                (raw && raw.data) ? raw.data : [raw];\n    return { status: 'sucesso', itens: items, total: items.length };\n} catch(e) {\n    return { status: 'erro', message: e.message };\n}`
              });
            });

            // 4. Final Route Return Node
            const lastNodeName = cw.curlItems[cw.curlItems.length - 1].nodeName || (isChained ? `etapa_${cw.curlItems.length}` : `resposta_api_${cwIdx + 1}`);
            flowNodes.push({
              id: crypto.randomUUID(),
              type: 'route_return',
              __spec: true,
              __spec_version: '1.0.0',
              content_type: 'application/json',
              status_code: '200',
              value: `{{#tojson}}\n{{tratar_${lastNodeName}}}\n{{/tojson}}`
            });

            return {
              id: cw.id || crypto.randomUUID(),
              name: cw.name || `Workflow ${cwIdx + 1} - Integração API`,
              enabled: true,
              allow_workflow_import: true,
              protected: false,
              options: {
                abort_keyword: '###',
                abort_message: 'Sessão abortada!',
                finish_message: 'Atendimento concluído!',
                inactivity_message: 'Sessão encerrada por inatividade!',
                inactivity_warning: 'Sua sessão vai expirar em breve',
                inactivity_warning_time: 60,
                timeout: 300
              },
              flow: flowNodes
            };
          });
        }
      } else if (validCurlItems.length > 0 && workflowArchitectureMode === 'single_consolidated') {
        const chainedFlowNodes: any[] = [];

        const pipelineTitle = validCurlItems.length > 1
          ? `Fluxo Integrado (${validCurlItems.map((c: any) => (c.name || 'Etapa').replace(/^[0-9.\-_ ]+/, '').trim()).join(' ➔ ')})`
          : ((validCurlItems[0].name || 'Consulta de Informações').replace(/^[0-9.\-_ ]+/, '').trim());

        const pipelineDesc = `Executa o fluxo completo de atendimento para ${validCurlItems.map((c: any) => (c.name || 'consulta').replace(/^[0-9.\-_ ]+/, '').trim().toLowerCase()).join(', ')} utilizando os dados e o número de documento que o cliente forneceu na conversa.\nDispare esta ferramenta assim que coletar o documento do cliente para processar os dados.`;

        const pipelineArgs = `Args:\n` +
          `  documento (str): Número de CPF, CNPJ ou documento fornecido pelo cliente durante o atendimento. Obrigatório.` +
          (validCurlItems.length > 1 ? `\n  parametro_adicional (str, opcional): Informações complementares fornecidas pelo cliente caso necessário.` : '');

        const pipelineReturns = `Returns:\n  dict: Resultado estruturado e dados tratados que retornam para o Agente responder diretamente ao cliente no chat.`;

        // 1. Instructions node describing the whole pipeline tool
        chainedFlowNodes.push({
          id: crypto.randomUUID(),
          type: 'instructions',
          __spec: true,
          __spec_version: '1.0.0',
          content: `${pipelineTitle}\n${pipelineDesc}\n\n${pipelineArgs}\n\n${pipelineReturns}`
        });

        // 2. Request extraction node
        chainedFlowNodes.push({
          id: crypto.randomUUID(),
          name: 'request',
          type: 'code',
          __spec: true,
          __spec_version: '1.0.0',
          error_message: 'Erro ao extrair parâmetros da requisição',
          value: STANDARD_REQUEST_CODE
        });

        // 3. Chain each cURL + Tratar node
        validCurlItems.forEach((item: any, idx: number) => {
          const cleanUri = item.curl.match(/(?:curl\s+(?:--location\s+)?['"]?)(https?:\/\/[^\s'"]+)/i)?.[1] || 'https://api.exemplo.com.br/v1/endpoint';
          const cleanMethod = item.curl.match(/-X\s+([A-Z]+)/i)?.[1] || (item.curl.includes('--data') || item.curl.includes('-d ') ? 'POST' : 'GET');
          const nodeName = item.nodeName || (idx === 0 && (cleanUri.includes('auth') || cleanUri.includes('token') || cleanUri.includes('login')) ? 'token' : `etapa_${idx + 1}`);

          const headers: any[] = [{ key: 'Content-Type', value: 'application/json' }];
          if (idx > 0) {
            headers.push({ key: 'Authorization', value: 'Bearer {{token.token}}' });
          }

          // REST node
          chainedFlowNodes.push({
            id: crypto.randomUUID(),
            name: nodeName,
            type: 'rest',
            __spec: true,
            __spec_version: '1.0.0',
            method: cleanMethod,
            uri: cleanUri,
            verify_ssl: true,
            body_format: 'json',
            credential_id: '',
            headers: headers,
            params: '',
            query_params: [],
            search_params: '',
            file_params: [],
            body: cleanMethod === 'POST' ? '{\n  "documento": "{{request.documento}}"\n}' : ''
          });

          // Code treatment node
          chainedFlowNodes.push({
            id: crypto.randomUUID(),
            name: `tratar_${nodeName}`,
            type: 'code',
            __spec: true,
            __spec_version: '1.0.0',
            error_message: `Erro ao processar dados da etapa ${idx + 1}`,
            value: idx === 0 && nodeName === 'token'
              ? `try {\n    let raw = _vars.${nodeName};\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    return {\n        token: (raw && (raw.access_token || raw.token || raw.jwt)) || 'TOKEN_EXTRAIDO',\n        status: 'autenticado'\n    };\n} catch(e) {\n    return { status: 'erro', message: e.message };\n}`
              : `try {\n    let raw = _vars.${nodeName};\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    let items = (raw && raw.result && raw.result.items) ? raw.result.items :\n                (raw && raw.data) ? raw.data : [raw];\n    return { status: 'sucesso', itens: items, total: items.length };\n} catch(e) {\n    return { status: 'erro', message: e.message };\n}`
          });
        });

        // 4. Final Route Return Node
        const lastNodeName = validCurlItems[validCurlItems.length - 1].nodeName || (validCurlItems.length === 1 && (validCurlItems[0].curl.includes('auth') || validCurlItems[0].curl.includes('token')) ? 'token' : `etapa_${validCurlItems.length}`);
        chainedFlowNodes.push({
          id: crypto.randomUUID(),
          type: 'route_return',
          __spec: true,
          __spec_version: '1.0.0',
          content_type: 'application/json',
          status_code: '200',
          value: `{{#tojson}}\n{{tratar_${lastNodeName}}}\n{{/tojson}}`
        });

        const consolidatedWf = {
          id: crypto.randomUUID(),
          name: 'WF - Pipeline Encadeado Integrado',
          enabled: true,
          allow_workflow_import: true,
          protected: false,
          options: {
            abort_keyword: '###',
            abort_message: 'Sessão abortada!',
            finish_message: 'Atendimento concluído!',
            inactivity_message: 'Sessão encerrada por inatividade!',
            inactivity_warning: 'Sua sessão vai expirar em breve',
            inactivity_warning_time: 60,
            timeout: 300
          },
          flow: chainedFlowNodes
        };

        generatedWorkflowsList = [consolidatedWf];
      } else if (validCurlItems.length > 0) {
        generatedWorkflowsList = validCurlItems.map((item: any, idx: number) => {
          const wfId = crypto.randomUUID();
          const instId = crypto.randomUUID();
          const reqId = crypto.randomUUID();
          const restId = crypto.randomUUID();
          const codeId = crypto.randomUUID();
          const returnId = crypto.randomUUID();

          let cleanUri = item.curl.match(/(?:curl\s+(?:--location\s+)?['"]?)(https?:\/\/[^\s'"]+)/i)?.[1] || 'https://api.exemplo.com.br/v1/endpoint';
          let cleanMethod = item.curl.match(/-X\s+([A-Z]+)/i)?.[1] || (item.curl.includes('--data') || item.curl.includes('-d ') ? 'POST' : 'GET');
          const nodeName = item.nodeName || `resposta_api_${idx + 1}`;

          const rawName = (item.name || `Consulta de Informações ${idx + 1}`).replace(/^[0-9.\-_ ]+/, '').trim();
          const modTitle = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          const modDesc = `Realiza a ${modTitle.toLowerCase()} com o número de documento (CPF ou CNPJ) ou identificador que o cliente forneceu durante o atendimento.\nDispare esta ferramenta assim que coletar os dados necessários para obter as informações do cliente.`;
          const modArgs = `Args:\n  documento (str): Número do documento (CPF ou CNPJ) ou identificador fornecido pelo cliente na conversa. Obrigatório.` +
            (idx > 0 ? `\n  id_referencia (str, opcional): Identificador ou código recebido na etapa anterior para localização dos dados.` : '');
          const modReturns = `Returns:\n  dict: Informações e dados cadastrais tratados que retornam para o Agente responder diretamente ao cliente no chat.`;

          return {
            id: wfId,
            name: item.name || `Workflow ${idx + 1} - Integração API`,
            enabled: true,
            allow_workflow_import: true,
            protected: false,
            options: {
              abort_keyword: '###',
              abort_message: 'Sessão abortada!',
              finish_message: 'Atendimento concluído!',
              inactivity_message: 'Sessão encerrada por inatividade!',
              inactivity_warning: 'Sua sessão vai expirar em breve',
              inactivity_warning_time: 60,
              timeout: 300
            },
            flow: [
              {
                id: instId,
                type: 'instructions',
                __spec: true,
                __spec_version: '1.0.0',
                content: `${modTitle}\n${modDesc}\n\n${modArgs}\n\n${modReturns}`
              },
              {
                id: reqId,
                name: 'request',
                type: 'code',
                __spec: true,
                __spec_version: '1.0.0',
                error_message: 'Desculpe, ocorreu uma instabilidade ao processar os parâmetros.',
                value: STANDARD_REQUEST_CODE
              },
              {
                id: restId,
                name: nodeName,
                type: 'rest',
                __spec: true,
                __spec_version: '1.0.0',
                method: cleanMethod,
                uri: cleanUri,
                verify_ssl: true,
                body_format: 'json',
                credential_id: '',
                headers: [{ key: 'Content-Type', value: 'application/json' }],
                params: '',
                query_params: [],
                search_params: '',
                file_params: [],
                body: cleanMethod === 'POST' ? '{\n  "documento": "{{request.documento}}"\n}' : ''
              },
              {
                id: codeId,
                name: `tratar_${nodeName}`,
                type: 'code',
                __spec: true,
                __spec_version: '1.0.0',
                error_message: 'Erro ao formatar os dados da API',
                value: `try {\n    let raw = _vars.${nodeName};\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    let items = (raw && raw.result && raw.result.items) ? raw.result.items :\n                (raw && raw.data) ? raw.data : [raw];\n    return { status: 'sucesso', itens: items };\n} catch(e) {\n    return { status: 'erro', message: e.message };\n}`
              },
              {
                id: returnId,
                type: 'route_return',
                __spec: true,
                __spec_version: '1.0.0',
                content_type: 'application/json',
                status_code: '200',
                value: `{{#tojson}}\n{{tratar_${nodeName}}}\n{{/tojson}}`
              }
            ]
          };
        });
      } else {
        generatedWorkflowsList = [
          {
            id: crypto.randomUUID(),
            name: 'WF - Integração Principal',
            enabled: true,
            allow_workflow_import: true,
            protected: false,
            options: {
              abort_keyword: '###',
              abort_message: 'Sessão abortada!',
              finish_message: 'Atendimento concluído!',
              inactivity_message: 'Sessão encerrada por inatividade!',
              inactivity_warning: 'Sua sessão vai expirar em breve',
              inactivity_warning_time: 60,
              timeout: 300
            },
            flow: [
              {
                id: crypto.randomUUID(),
                type: 'instructions',
                __spec: true,
                __spec_version: '1.0.0',
                content: 'Execução de Integração Principal.\nConsulta e processa dados da API externa.\n\nArgs:\n  cpf (str): CPF do titular.\n\nReturns:\n  dict: Objeto estruturado com status e protocolo.'
              },
              {
                id: crypto.randomUUID(),
                name: 'request',
                type: 'code',
                __spec: true,
                __spec_version: '1.0.0',
                error_message: 'Erro ao extrair parâmetros da requisição',
                value: STANDARD_REQUEST_CODE
              },
              {
                id: crypto.randomUUID(),
                name: 'resposta_api',
                type: 'rest',
                __spec: true,
                __spec_version: '1.0.0',
                method: 'GET',
                uri: 'https://api.empresa.com.br/v1/consulta',
                verify_ssl: true,
                body_format: 'json',
                credential_id: '',
                headers: [{ key: 'Content-Type', value: 'application/json' }],
                params: '',
                query_params: [],
                search_params: '',
                file_params: []
              },
              {
                id: crypto.randomUUID(),
                name: 'tratar_dados',
                type: 'code',
                __spec: true,
                __spec_version: '1.0.0',
                value: `try {\n    let raw = _vars.resposta_api;\n    if (typeof raw === 'string') raw = JSON.parse(raw);\n    return { status: "sucesso", dados: raw };\n} catch(e) {\n    return { status: "erro", message: e.message };\n}`
              },
              {
                id: crypto.randomUUID(),
                type: 'route_return',
                __spec: true,
                __spec_version: '1.0.0',
                content_type: 'application/json',
                status_code: '200',
                value: '{{#tojson}}\n{{tratar_dados}}\n{{/tojson}}'
              }
            ]
          }
        ];
      }

      rawOutput = JSON.stringify({
        agent: {
          id: crypto.randomUUID(),
          name: businessContext ? businessContext.slice(0, 35) : 'Agente Fortics',
          description: businessContext || 'Assistente de Atendimento Inteligente Fortics',
          audience: 'Clientes corporativos e usuários em atendimento',
          cat: 'atendimento',
          color: '#3dd56d',
          icon: 'avatar-4',
          emojis: true,
          enabled: true,
          force_greetings: false,
          greetings: `Olá! Sou o assistente virtual da empresa. Como posso te ajudar hoje?`,
          style: 'Você é um assistente virtual empático, objetivo e técnico. Siga rigorosamente as instruções e regras de negócio sem desviar do escopo.',
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
            objective: businessContext || 'Atendimento e execução de integrações',
            role: 'Atender ao cliente com cordialidade, validar dados e executar integrações. Siga os seguintes passos:',
            steps: stepsArray.length > 0 ? stepsArray : (
              validCurlItems.length > 0 ? [
                'Cumprimentar o cliente e identificar a necessidade do atendimento',
                'Solicitar e confirmar o CPF ou documento do titular',
                ...validCurlItems.map((c: any, i: number) => {
                  if (i === 0) return `Disparar a ferramenta de consulta (${c.name || 'consulta_inicial'}) com o documento informado`;
                  return `Utilizar o identificador retornado na etapa anterior para acionar (${c.name || `etapa_${i + 1}`})`;
                }),
                'Apresentar os dados e confirmar a finalização do atendimento'
              ] : [
                'Cumprimentar o cliente e identificar o nome',
                'Solicitar o CPF ou CNPJ do titular',
                'Executar a consulta via integração do workflow',
                'Confirmar os dados com o cliente antes de prosseguir',
                'Finalizar o atendimento com cordialidade'
              ]
            )
          },
          other_rules: naturalRules?.trim() || `# REGRAS E DIRETRIZES DO AGENTE\n\n- Aceitar o CPF com 11 dígitos numéricos, com ou sem pontuação (ex: 123.456.789-00 ou 12345678900)\n- Validar se o cliente informou todos os dígitos do documento antes de acionar a ferramenta\n- Não inventar ou alucinar dados; responder estritamente com base no retornado pela consulta\n- Apresentar as informações ao cliente de forma clara, objetiva e cordial`
        },
        workflow: generatedWorkflowsList[0],
        workflows: generatedWorkflowsList,
        summary: 'Agente e Workflows gerados com rigor técnico no padrão oficial Fortics 2026.',
        variableChainSummary: '1. O SZ Omnichannel injeta as variáveis.\n2. O Agente extrai e confirma dados no diálogo.\n3. O nó request desempacota o payload.\n4. O nó rest consome os parâmetros extraídos.\n5. O nó tratar_dados higieniza a resposta.\n6. O nó route_return entrega o JSON ao Agente.'
      });
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
          clean = clean.replace(/^(?:passo\s*\d+[\s\:\-]*|\d+[\.\-\)\:]\s*|\[\d+\]\s*)/i, '');
          clean = clean.replace(/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s_]{3,25}[:\-]\s*/, '');
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
          const oldName = n.name || 'payload';
          n.name = 'request';
          if (!n.error_message) {
            n.error_message = 'Desculpe, ocorreu uma instabilidade ao processar os dados da requisição.';
          }
          if (!n.value || n.value.includes('_vars._request') || n.value.includes('request') || n.value.includes('_vars')) {
            n.value = STANDARD_REQUEST_CODE;
          }

          wf.flow.forEach((subNode: any) => {
            if (subNode.type === 'rest' && subNode.body && typeof subNode.body === 'string') {
              if (oldName !== 'request') {
                const regex = new RegExp(`{{${oldName}\\.`, 'g');
                subNode.body = subNode.body.replace(regex, '{{request.');
              }
              subNode.body = subNode.body
                .replace(/{{payload_desempacotado\./g, '{{request.')
                .replace(/{{variavel_saida\./g, '{{request.')
                .replace(/{{dados_extraidos\./g, '{{request.');
            }
          });
        }

        // 3. Sanitize 'rest' HTTP node
        if (n.type === 'rest') {
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
            n.headers = n.headers.filter((h: any) => h && typeof h.key === 'string' && h.key.trim().length > 0 && typeof h.value === 'string' && h.value.trim().length > 0);
            if (n.headers.length === 0 && (n.method === 'POST' || n.method === 'PUT' || n.method === 'PATCH')) {
              n.headers = [{ key: 'Content-Type', value: 'application/json' }];
            }
          } else {
            n.headers = (n.method === 'POST' || n.method === 'PUT' || n.method === 'PATCH') ? [{ key: 'Content-Type', value: 'application/json' }] : [];
          }

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
      sanitizedWorkflows = [parsed.workflow];
    }

    if (workflowArchitectureMode === 'single_consolidated' && sanitizedWorkflows.length > 1) {
      // Merge all nodes into 1 continuous pipeline workflow
      const consolidatedFlow: any[] = [];
      const instructionsNode = sanitizedWorkflows[0].flow.find((n: any) => n.type === 'instructions') || {
        id: crypto.randomUUID(),
        type: 'instructions',
        __spec: true,
        __spec_version: '1.0.0',
        content: `Fluxo Integrado em Cadeia\nExecuta o fluxo completo das integrações em sequência contínua.`
      };
      const requestCodeNode = sanitizedWorkflows[0].flow.find((n: any) => n.type === 'code' && n.name === 'request') || {
        id: crypto.randomUUID(),
        name: 'request',
        type: 'code',
        __spec: true,
        __spec_version: '1.0.0',
        error_message: 'Erro ao extrair parâmetros da requisição',
        value: STANDARD_REQUEST_CODE
      };

      consolidatedFlow.push(instructionsNode, requestCodeNode);

      sanitizedWorkflows.forEach((wf: any) => {
        const middleNodes = wf.flow.filter((n: any) => n.type !== 'instructions' && n.type !== 'route_return' && !(n.type === 'code' && n.name === 'request'));
        consolidatedFlow.push(...middleNodes);
      });

      const lastReturn = sanitizedWorkflows[sanitizedWorkflows.length - 1].flow.find((n: any) => n.type === 'route_return') || {
        id: crypto.randomUUID(),
        type: 'route_return',
        __spec: true,
        __spec_version: '1.0.0',
        content_type: 'application/json',
        status_code: '200',
        value: '{{#tojson}}\n{{tratar_dados}}\n{{/tojson}}'
      };
      consolidatedFlow.push(lastReturn);

      const mergedWf = {
        id: sanitizedWorkflows[0].id || crypto.randomUUID(),
        name: 'WF - Pipeline Encadeado Integrado',
        enabled: true,
        allow_workflow_import: true,
        protected: false,
        options: sanitizedWorkflows[0].options || {
          abort_keyword: '###',
          abort_message: 'Sessão abortada!',
          finish_message: 'Atendimento concluído!',
          inactivity_message: 'Sessão encerrada por inatividade!',
          inactivity_warning: 'Sua sessão vai expirar em breve',
          inactivity_warning_time: 60,
          timeout: 300
        },
        flow: consolidatedFlow
      };

      sanitizedWorkflows = [mergedWf];
      parsed.workflow = mergedWf;
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
apiRouter.post('/simulate-chat', async (req, res) => {
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

// Register router under both /api and / so it works with all routing setups
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
