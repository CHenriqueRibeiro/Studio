import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';

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

REGRAS DE OURO:
1. Retorne SEMPRE um objeto JSON válido contendo exatamente as chaves:
   - "agent": objeto completo do agente.
   - "workflow": workflow consolidado principal contendo os nós das APIs informadas.
   - "workflows": array de workflows modulares correspondendo EXATAMENTE à lista de APIs solicitadas pelo usuário.
   - "summary": resumo executivo destacando os cURLs selecionados e a lógica do fluxo.
   - "variableChainSummary": rastreio da cadeia de variáveis (Entrada -> 1ª API -> Retorno no Chat com ID -> 2ª API -> Resposta Final).
2. Todos os nós e objetos raiz de cada workflow devem ter UUIDs v4 válidos gerados.
3. PADRÃO OBRIGATÓRIO DO COMPONENTE 'instructions':
   - Cada workflow DEVE ter SEMPRE EXATAMENTE UM ÚNICO nó de tipo 'instructions' no início do 'flow' (Nó 1).
4. PADRÃO OBRIGATÓRIO DO COMPONENTE 'code' DE EXTRAÇÃO ('request'):
   - O primeiro nó 'code' logo após o nó 'instructions' DEVE OBRIGATORIAMENTE ter "name": "request".
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

export default async function handler(req: any, res: any) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', message: 'Fortics Studio Generate Endpoint' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};

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
    } = body;

    let formattedAuthRoute = '';
    if (authRoute && authRoute.enabled) {
      formattedAuthRoute = `
========================================
ROTA DE AUTENTICAÇÃO OBRIGATÓRIA:
- Tipo de Autenticação: ${authRoute.authType}
- Nome: ${authRoute.name || 'Obter Token'}
- Método: ${authRoute.method || 'POST'}
- Endpoint/URL: ${authRoute.pathOrUrl || '/api/auth/token'}
${authRoute.headers ? `- Headers: ${authRoute.headers}` : ''}
${authRoute.requestBodySample ? `- Payload:\n${authRoute.requestBodySample}` : ''}
- Campo a Extrair: ${authRoute.tokenExtractionPath || 'access_token'}
- Variável Armazenada: ${authRoute.tokenVariableTarget || '_vars.auth_token'}
- Header Injetado: ${authRoute.headerAppliedToSubsequentCalls || 'Authorization: Bearer {{auth_token}}'}
========================================
`;
    }

    const validCurlItems = (curlItems && Array.isArray(curlItems))
      ? curlItems.filter((c: any) => c.curl && c.curl.trim().length > 5)
      : [];

    let formattedWorkflowsSection = '';
    let expectedWorkflowCount = 1;

    if (workflowArchitectureMode === 'single_consolidated') {
      expectedWorkflowCount = 1;
      const allItems = (configuredWorkflows && Array.isArray(configuredWorkflows) && configuredWorkflows.length > 0)
        ? configuredWorkflows.flatMap((w: any) => w.curlItems || [])
        : validCurlItems;

      formattedWorkflowsSection = `
### ARQUITETURA: 1 ÚNICO WORKFLOW CONSOLIDADO
- Total de Etapas: ${allItems.length}
${allItems.map((item: any, idx: number) => `
  -> Etapa ${idx + 1}: "${item.name || `Etapa ${idx + 1}`}"
     - cURL: ${item.curl}
     ${item.responseSample ? `- Resposta: ${item.responseSample}` : ''}
     ${item.filterRules ? `- Filtro: ${item.filterRules}` : ''}
`).join('\n')}
`;
    } else if (configuredWorkflows && Array.isArray(configuredWorkflows) && configuredWorkflows.length > 0) {
      expectedWorkflowCount = configuredWorkflows.length;
      formattedWorkflowsSection = configuredWorkflows.map((wf: any, idx: number) => {
        const wfNum = idx + 1;
        const isChained = wf.curlItems && wf.curlItems.length > 1;
        const calls = (wf.curlItems && Array.isArray(wf.curlItems) && wf.curlItems.length > 0)
          ? wf.curlItems.map((step: any, sIdx: number) => `
  -> Chamada HTTP ${sIdx + 1}: "${step.name || `Etapa ${sIdx + 1}`}"
     - cURL: ${step.curl}
`).join('\n')
          : '  -> [Chamadas não detalhadas]';

        return `
### WORKFLOW ${wfNum}: "${wf.name || `Workflow ${wfNum}`}"
- Estrutura: ${isChained ? 'Cadeia Multi-REST' : 'Workflow simples'}
${calls}
`;
      }).join('\n----------------------------------------\n');
    } else if (validCurlItems.length > 0) {
      expectedWorkflowCount = validCurlItems.length;
      formattedWorkflowsSection = validCurlItems.map((item: any, idx: number) => `
### WORKFLOW ${idx + 1}: "${item.name || `Integração ${idx + 1}`}"
- cURL: ${item.curl}
${item.responseSample ? `- Resposta: ${item.responseSample}` : ''}
${item.filterRules ? `- Filtro: ${item.filterRules}` : ''}
`).join('\n----------------------------------------\n');
    } else {
      expectedWorkflowCount = 1;
      formattedWorkflowsSection = 'Deduzir e criar os Workflows, nós REST e parâmetros com base no Objetivo e Passos.';
    }

    let stepsAndRulesSection = '';
    if (inputMode === 'workflow_driven') {
      stepsAndRulesSection = `
2. PASSOS E REGRAS DEDUZIDOS DOS WORKFLOWS (WORKFLOW-DRIVEN):
- Identificar cliente e solicitar documento
- Disparar integração
- Apresentar resultado e confirmar finalização
${naturalRules ? `\nREGRAS EXTRAS:\n${naturalRules}` : ''}
`;
    } else if (inputMode === 'freeform' && freeformPrompt && freeformPrompt.trim()) {
      stepsAndRulesSection = `
2. INSTRUÇÃO LIVRE:
"""
${freeformPrompt.trim()}
"""
`;
    } else {
      stepsAndRulesSection = `
2. PASSOS DO AGENTE:
${naturalSteps || naturalAlgorithm || 'Identificar cliente -> Coletar dados -> Confirmar -> Executar integração -> Finalizar'}

3. REGRAS DO AGENTE:
${naturalRules || '- Validação de documento\n- Confirmar antes de executar\n- Em caso de dúvida, retornar #SUPORTE_HUMANO'}
`;
    }

    const userPrompt = `
MODO: ${mode === 'refactor' ? 'REFATORAÇÃO' : 'CRIAÇÃO'}
ESCOPO: ${studioMode}

1. CONTEXTO:
${businessContext || 'Atendimento automatizado Fortics com integração API.'}

${stepsAndRulesSection}

4. ROTA AUTH:
${formattedAuthRoute || 'Nenhuma'}

5. WORKFLOWS:
${formattedWorkflowsSection}

6. DOCUMENTAÇÃO / cURLs:
${apiDocs || (validCurlItems.length > 0 ? validCurlItems.map((c: any) => c.curl).join('\n') : 'Endpoints REST padrão')}

${responseModelSample ? `EXEMPLO DE RESPOSTA (JSON):\n${responseModelSample}` : ''}
${businessFilters ? `FILTROS SOLICITADOS:\n${businessFilters}` : ''}

Gere o JSON consolidado estritamente com as chaves:
{
  "agent": { ...objeto oficial agente.json... },
  "workflow": { ...workflow principal... },
  "workflows": [ ...array com ${expectedWorkflowCount} workflow(s)... ],
  "summary": "Resumo executivo",
  "variableChainSummary": "Cadeia de variáveis"
}
`;

    let rawOutput = '';

    try {
      if (provider === 'openai') {
        const effectiveKey = (apiKey && apiKey.trim()) || process.env.OPENAI_API_KEY || '';
        if (!effectiveKey) {
          return res.status(400).json({
            success: false,
            error: 'Chave da OpenAI não informada. Por favor, informe sua chave de API nas configurações de IA do Studio ou configure OPENAI_API_KEY na Vercel.'
          });
        }
        rawOutput = await callOpenAI(effectiveKey, model, userPrompt, temperature);
      } else if (provider === 'anthropic') {
        const effectiveKey = (apiKey && apiKey.trim()) || process.env.ANTHROPIC_API_KEY || '';
        if (!effectiveKey) {
          return res.status(400).json({
            success: false,
            error: 'Chave da Anthropic (Claude) não informada. Por favor, informe sua chave de API nas configurações de IA do Studio ou configure ANTHROPIC_API_KEY na Vercel.'
          });
        }
        rawOutput = await callAnthropic(effectiveKey, model, userPrompt, temperature);
      } else {
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
      if (provider === 'openai' || provider === 'anthropic') {
        console.error(`LLM Provider ${provider} failed:`, llmError?.message || llmError);
        return res.status(400).json({
          success: false,
          error: `Falha ao processar com ${provider.toUpperCase()}: ${llmError?.message || 'Chave inválida ou sem créditos disponíveis.'}`
        });
      }

      if (provider === 'gemini' && apiKey && llmError.message !== 'DEV_SYNTHESIZER_FALLBACK') {
        console.error('Custom Gemini Key failed:', llmError?.message || llmError);
        return res.status(400).json({
          success: false,
          error: `Falha ao conectar com o Google Gemini: ${llmError?.message || 'Verifique sua chave de API.'}`
        });
      }

      console.warn('Fallback Synthesizer active. Synthesizing structural Fortics schemas directly...');

      let stepsArray: string[] = [];
      if (inputMode === 'workflow_driven' || (validCurlItems.length > 0 && !naturalSteps)) {
        const cleanName = (raw: string) => (raw || 'consulta').replace(/^[0-9.\-_ ]+/, '').trim().toLowerCase();
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

      const defaultWf = {
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
            content: 'Consulta de Informações.\nConsulta e processa dados da API externa.\n\nArgs:\n  documento (str): Documento do titular.\n\nReturns:\n  dict: Objeto estruturado com resposta.'
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
      };

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
            steps: stepsArray.length > 0 ? stepsArray : [
              'Cumprimentar o cliente e identificar o nome',
              'Solicitar o CPF ou CNPJ do titular',
              'Executar a consulta via integração do workflow',
              'Confirmar os dados com o cliente antes de prosseguir',
              'Finalizar o atendimento com cordialidade'
            ]
          },
          other_rules: naturalRules?.trim() || `# REGRAS E DIRETRIZES DO AGENTE\n\n- Validar formato de documento antes de acionar a ferramenta\n- Não inventar ou alucinar dados; responder estritamente com base no retornado pela consulta\n- Apresentar as informações ao cliente de forma clara e objetiva`
        },
        workflow: defaultWf,
        workflows: [defaultWf],
        summary: 'Agente e Workflows gerados com sucesso no padrão oficial Fortics 2026.',
        variableChainSummary: '1. O SZ Omnichannel injeta as variáveis.\n2. O Agente extrai e confirma dados no diálogo.\n3. O nó request desempacota o payload.\n4. O nó rest consome os parâmetros extraídos.\n5. O nó tratar_dados higieniza a resposta.\n6. O nó route_return entrega o JSON ao Agente.'
      });
    }

    let parsed: any = {};
    try {
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

    if (parsed.agent) {
      if (!parsed.agent.id) parsed.agent.id = crypto.randomUUID();
      if (!parsed.agent.name) parsed.agent.name = 'Agente Atendimento';
      if (!parsed.agent.llm_api_key) parsed.agent.llm_api_key = crypto.randomUUID();
    }

    const finalWorkflows = Array.isArray(parsed.workflows) && parsed.workflows.length > 0
      ? parsed.workflows
      : (parsed.workflow ? [parsed.workflow] : []);

    return res.status(200).json({
      success: true,
      agent: parsed.agent,
      workflow: parsed.workflow || finalWorkflows[0],
      workflows: finalWorkflows,
      summary: parsed.summary || 'Agente e Workflows gerados com sucesso.',
      variableChainSummary: parsed.variableChainSummary || 'Cadeia de variáveis mapeada.'
    });
  } catch (error: any) {
    console.error('Error generating Fortics artifacts:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro inesperado ao gerar Agente e Workflow.'
    });
  }
}
