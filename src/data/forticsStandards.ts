import { ForticsAgent, ForticsWorkflow } from '../types/fortics';

export const MANUAL_AGENTE_BOAS_PRATICAS = `# GUIA COMPLETO DE AGENTES INTELIGENTES FORTICS (OFICIAL 2026)

## 1. Princípio Fundamental: MONO SKILL
- **1 Agente = 1 Tarefa = 1 Roteiro Único.**
- Nunca misture suporte com vendas ou financeiro no mesmo agente.
- Misturar múltiplos domínios é a causa número #1 de comportamentos erráticos.
- Se a empresa precisa de 3 tarefas (Ex: Vendas, Suporte e Agendamento), crie 3 agentes separados.

## 2. As 6 Dimensões do Prompt Perfeito
1. **PERSONA:** Quem o agente é, nome, especialidade, tom de voz e limites claros do que PODE e NÃO PODE fazer.
2. **CONTEXTO:** Descrição detalhada do cenário e audiência (público leigo vs técnico).
3. **TAREFA (Função + Passos):** 
   - No campo \`instruction.role\`, finalize OBRIGATORIAMENTE com: "Siga os seguintes passos:".
   - No campo \`instruction.steps\`: Liste estritamente **O QUE TEM QUE FAZER** em frases diretas e limpas em linguagem natural (Ex: "Pedir o CPF do cliente", "Identificar a necessidade", "Confirmar os dados antes de gravar", "Registrar o chamado"). **NUNCA numere os passos** (sem "1.", "1-") e **NUNCA use prefixos em caixa alta** (sem "1-IDENTIFICAÇÃO:").
4. **OUTRAS REGRAS (\`other_rules\`):** É estritamente **COMO VÃO FAZER**. Descreva detalhadamente regras de validação (ex: "O CPF deve ser validado e enviado no formato correto XXX.XXX.XXX-XX"), confirmação expressa antes de gravar, limites de escopo, regras anti-alucinação, variáveis SZ e tags de transbordo \`#HUMANO\`.
5. **FORMATO:** Saudação receptiva, regras de tamanho de resposta, emojis e formatação Markdown.
6. **TOM & TEMPERATURA:** Criatividade BAIXA (0.0 a 0.2) para agentes informativos e suporte com dados factuais.

## 3. As 6 Regras Anti-Alucinação
- **ESCOPO:** 'Responda SOMENTE sobre [tema específico]. Para outros assuntos, indique o canal correto ou transborde.'
- **DADOS DINÂMICOS:** 'Para preços, estoque e SLAs, consulte SEMPRE a base/workflow. NUNCA invente ou assuma valores.'
- **INCERTEZA:** 'Quando não souber: declare que não possui a informação e acione especialista.'
- **DADOS SENSÍVEIS:** 'NUNCA solicite senhas, tokens ou dados bancários desnecessários.'
- **CONFIRMAÇÃO:** 'Antes de registrar qualquer chamado ou pedido, confirme: Os dados [X, Y, Z] estão corretos?'
- **ESCALADA / TRANSBORDO:** 'Se o cliente demonstrar frustração extrema ou pedir atendimento humano, retorne SOMENTE o token de transbordo.'

## 4. Variáveis de Contexto do Sistema (SZ Omnichannel) - Opcional
Quando configurado no fluxo, o Fortics Omnichannel pode injetar variáveis no contexto da conversa antes do agente responder:
- \`{{telefone}}\`: Telefone do cliente (WhatsApp, SMS, etc.)
- \`{{nome}}\`: Nome cadastrado no sistema
- \`{{cpf}}\`: CPF para identificação
- \`{{email}}\`: E-mail de contato
- \`{{canal}}\`: Canal de origem (whatsapp, web, telegram, etc.)
- \`{{plano}}\`: Plano contratado
*Regra de Ouro:* Quando habilitadas, o agente aproveita as variáveis disponíveis sem perguntar novamente. Quando desabilitadas ou ausentes, o agente solicita os dados educadamente ao cliente no diálogo.

## 5. Tokens de Roteamento (#) e Retenção de Variáveis
- Os tokens devem ser retornados SOZINHOS pela LLM quando a condição for atingida (ex: \`#HUMANO\`, \`#SUPORTE_HUMANO\`, \`#VENDAS_HUMANO\`, \`#FINANCEIRO\`, \`#FIM\`).
- Após emitir o token, o agente não deve adicionar nenhum texto adicional.
- Fenced Code Blocks: Caso seja necessário repassar entidades extraídas para a ferramenta/workflow ou operador, gere um bloco json fenced com as variáveis capturadas (\`name\`, \`phone\`, \`cpf\`, \`issue\`, etc.).`;

export const MANUAL_WORKFLOW_BOAS_PRATICAS = `# GUIA DE ENGENHARIA DE WORKFLOWS FORTICS (JSON IMPORTÁVEL)

## 1. Estrutura e Grafo de Execução
O Workflow Fortics é um grafo determinístico de nós (\`flow\`) com spec flags (\`__spec: true\`, \`__spec_version: "1.0.0"\`) e UUIDs v4 únicos.

## 2. Tipos de Nós Oficiais:
1. **instructions (Tool Spec para Agente LLM):**
   - Define a identificação da função, descrição detalhada, argumentos e resposta esperada no padrão Google/Sphinx:
   \`\`\`text
   Título da Ferramenta ou Integração.
   Descrição detalhada do objetivo da função e quando o agente deve acioná-la.

   Args:
     cpf (str): CPF do cliente formatado ou somente dígitos.
     motivo (str): Descrição do problema ou solicitação.

   Returns:
     dict: Retorno estruturado com protocolo, status e dados.
   \`\`\`
   - *Importante:* Os argumentos declarados aqui devem casar perfeitamente com os dados que o Agente coleta no prompt (\`other_rules\`).

2. **code (Padrão Oficial de Extração - name: "request"):**
   - Desempacotamento seguro e padronizado do payload enviado pelo Agente:
   \`\`\`javascript
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
   \`\`\`
   - Ao definir o nó com \`name: "request"\`, todos os parâmetros ficam disponíveis nos nós REST subsequentes como \`{{request.cpf}}\`, \`{{request.nome}}\`, etc.

3. **rest (Integração HTTP / APIs externas):**
   - Suporte a métodos GET, POST, PUT, DELETE, PATCH.
   - Injeção de variáveis via Mustache \`{{request.campo}}\` (ex: \`{{request.documento}}\`).
   - Sempre definir \`verify_ssl: true\` e \`body_format: "json"\`.

4. **condition (Bifurcação de Fluxo):**
   - Compara \`left\` (ex: \`{{resposta_api.status}}\`) com \`right\` (ex: \`200\` ou \`true\`).
   - Contém arrays \`then: []\` e \`else: []\` para ramificação estrita.

5. **label e goto (Saltos e Tratamento de Erro):**
   - \`label\`: Marca um ponto de ancoragem no fluxo (ex: \`nome: "falha_api"\`).
   - \`goto\`: Salta para o \`label\` correspondente.

6. **route_return (Encerramento e Resposta ao Agente):**
   - Retorna o JSON serializado para o Agente ou canal:
   \`\`\`text
   {{#tojson}}
   {{variavel_final}}
   {{/tojson}}
   \`\`\`
   - Status code \`"200"\` e \`content_type: "application/json"\`.`;

export const DEFAULT_AGENT_SCHEMA_TEMPLATE: ForticsAgent = {
  id: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  name: "TechSolucoes SuporteTecnico",
  description: "Abertura de chamados técnicos e diagnóstico para clientes da Empresa X",
  audience: "Clientes corporativos e usuários do sistema da TechSoluções",
  cat: "suporte_tecnico",
  color: "#3dd56d",
  icon: "avatar-4",
  emojis: true,
  enabled: true,
  force_greetings: false,
  greetings: "Olá! Sou o assistente de suporte técnico da TechSoluções 🛠️. Estou aqui para diagnosticar e registrar sua solicitação. Para começarmos, qual é o seu nome completo?",
  style: "Você é o assistente virtual de suporte técnico da TechSoluções. Comunicação empática, objetiva, técnica e cordial.",
  llm: "GPT",
  llm_api_key: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  llm_model: "gpt-4.1",
  llm_temperature: 0,
  ocr_enabled: true,
  protected: false,
  webchat: false,
  template: true,
  voice_priority: false,
  void_context: true,
  tts_id: "00000000-0000-0000-0000-000000000000",
  media_upload_enabled: false,
  offset: "America/Sao_Paulo",
  instruction: {
    objective: "Coletar informações do chamado técnico, validar dados cadastrais e registrar o ticket na ferramenta de workflow.",
    role: "Coletar os dados do cliente, registrar a descrição do problema e abrir um ticket de suporte técnico no sistema via integração. Siga os seguintes passos:",
    steps: [
      "Cumprimentar o cliente e identificar o nome completo",
      "Confirmar o telefone ou e-mail de contato",
      "Solicitar o CPF ou CNPJ do titular do contrato",
      "Identificar qual módulo ou sistema está com instabilidade",
      "Coletar a descrição detalhada do erro ou sintoma observado",
      "Apresentar o resumo dos dados e pedir confirmação expressa antes de registrar",
      "Disparar a integração do workflow para abrir o chamado técnico",
      "Informar o número do protocolo oficial e o prazo de atendimento SLA",
      "Finalizar o atendimento com cordialidade"
    ]
  },
  other_rules: `# REGRAS E DIRETRIZES DO AGENTE DE SUPORTE TÉCNICO (COMO FAZER)

## 1. VALIDAÇÃO E FORMATO DE DADOS
- O CPF deve ser validado e enviado no formato correto XXX.XXX.XXX-XX ou apenas dígitos numéricos válidos.
- O CNPJ deve ser validado e enviado no formato XX.XXX.XXX/XXXX-XX ou apenas dígitos numéricos válidos.

## 2. DIRETRIZES DE ESCOPO E MONO SKILL
- Responda EXCLUSIVAMENTE sobre problemas operacionais e suporte dos produtos TechSoluções.
- NUNCA emita cotações de preços, propostas comerciais ou boletos. Para esses casos, instrua o cliente e transfira.

## 3. DIRETRIZES DE NÃO ALUCINAÇÃO E CONFIRMAÇÃO
- NUNCA invente prazos de resolução ou SLAs. Utilize apenas os prazos retornados pela integração.
- Antes de registrar qualquer chamado no workflow, solicite CONFIRMAÇÃO EXPRESSA do cliente (Sim/Não).
- NUNCA solicite senhas de acesso ou credenciais privadas do cliente.

## 4. RETENÇÃO E USO DE VARIÁVEIS DE CONTEXTO
- Verifique se as variáveis {{nome}}, {{telefone}} e {{cpf}} já vieram preenchidas pelo Omnichannel antes de solicitá-las.
- Mantenha na memória de curto prazo todos os dados coletados durante o fluxo para consolidação final.

## 5. TAGS DE TRANSBORDO E ROTEAMENTO
- Se o usuário pedir cancelamento ou financeiro: responda SOMENTE #FINANCEIRO
- Se o usuário pedir cotação/vendas: responda SOMENTE #COMERCIAL
- Se o usuário solicitar atendente humano ou estiver irritado: responda SOMENTE #SUPORTE_HUMANO
- Quando finalizar o atendimento com sucesso: responda SOMENTE #FIM`
};

export const DEFAULT_WORKFLOW_SCHEMA_TEMPLATE: ForticsWorkflow = {
  id: "7d8e9f01-2345-6789-abcd-ef0123456789",
  name: "WF - Abertura de Chamado HelpDesk",
  enabled: true,
  allow_workflow_import: true,
  protected: false,
  options: {
    abort_keyword: "###",
    abort_message: "Sessão de atendimento cancelada pelo usuário.",
    finish_message: "Atendimento concluído com sucesso. Até logo!",
    inactivity_message: "Atendimento encerrado devido ao tempo de inatividade.",
    inactivity_warning: "Seu atendimento será encerrado em breve por inatividade. Deseja continuar?",
    inactivity_warning_time: 60,
    timeout: 300
  },
  flow: [
    {
      id: "11111111-2222-3333-4444-555555555551",
      type: "instructions",
      __spec: true,
      __spec_version: "1.0.0",
      content: "Abertura de Chamado Técnico no HelpDesk.\nRegistra um novo chamado de suporte técnico na API do HelpDesk com diagnóstico e SLA.\n\nArgs:\n  nome (str): Nome completo do cliente solicitante.\n  telefone (str): Telefone de contato do cliente.\n  cnpj_cpf (str): Documento CPF ou CNPJ do cliente.\n  modulo (str): Nome do módulo com problema.\n  descricao (str): Detalhamento do erro relatado.\n\nReturns:\n  dict: Objeto contendo id_ticket, protocolo, status e prazo_sla_horas."
    },
    {
      id: "11111111-2222-3333-4444-555555555552",
      name: "request",
      type: "code",
      __spec: true,
      __spec_version: "1.0.0",
      error_message: "Desculpe, ocorreu uma instabilidade ao processar os parâmetros do seu chamado.",
      value: "try {\n    let data = _vars._request.body;\n\n    if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {\n        data = data.data;\n    }\n\n    return data;\n\n} catch (e) {\n    return {\n        error: \"Failed to extract request data\",\n        details: JSON.stringify(e)\n    };\n}"
    },
    {
      id: "11111111-2222-3333-4444-555555555553",
      name: "resposta_api_helpdesk",
      type: "rest",
      __spec: true,
      __spec_version: "1.0.0",
      method: "POST",
      uri: "https://api.techsolucoes.com.br/v1/tickets",
      verify_ssl: true,
      body_format: "json",
      credential_id: "",
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Accept", value: "application/json" }
      ],
      params: "",
      query_params: [],
      search_params: "",
      file_params: [],
      body: "{\n  \"customer_name\": \"{{request.nome}}\",\n  \"phone\": \"{{request.telefone}}\",\n  \"document\": \"{{request.cnpj_cpf}}\",\n  \"category\": \"{{request.modulo}}\",\n  \"description\": \"{{request.descricao}}\",\n  \"source\": \"FORTICS_OMNICHANNEL\"\n}"
    },
    {
      id: "11111111-2222-3333-4444-555555555554",
      type: "condition",
      __spec: true,
      __spec_version: "1.0.0",
      condition: "==",
      left: "{{resposta_api_helpdesk.status}}",
      right: "201",
      then: [
        {
          id: "11111111-2222-3333-4444-555555555555",
          name: "resultado_formatado",
          type: "code",
          __spec: true,
          __spec_version: "1.0.0",
          error_message: "Erro ao formatar confirmação do ticket",
          value: "try {\n    let api = _vars.resposta_api_helpdesk.body || {};\n    return {\n        sucesso: true,\n        protocolo: api.protocolo || 'TICKET-' + Math.floor(100000 + Math.random() * 900000),\n        prazo_sla: api.sla_horas || 4,\n        mensagem: 'Seu chamado foi registrado com sucesso em nossa fila prioritária.'\n    };\n} catch(err) {\n    return { sucesso: false, erro: err.message };\n}"
        }
      ],
      else: [
        {
          id: "11111111-2222-3333-4444-555555555556",
          name: "resultado_formatado",
          type: "code",
          __spec: true,
          __spec_version: "1.0.0",
          error_message: "Erro no fallback",
          value: "return {\n    sucesso: false,\n    protocolo: 'MANUAL-' + Date.now(),\n    prazo_sla: 24,\n    mensagem: 'Não conseguimos conectar à API no momento, mas seu chamado foi enviado para triagem humana.'\n};"
        }
      ]
    },
    {
      id: "11111111-2222-3333-4444-555555555557",
      type: "route_return",
      __spec: true,
      __spec_version: "1.0.0",
      content_type: "application/json",
      status_code: "200",
      value: "{{#tojson}}\n{{resultado_formatado}}\n{{/tojson}}"
    }
  ]
};

export const TEMPLATES_LIBRARY = [
  {
    id: "template-suporte",
    title: "Suporte Técnico & HelpDesk",
    category: "Suporte",
    badge: "MONO SKILL",
    description: "Agente e Workflow de abertura de chamados técnicos com validação de CPF/CNPJ, coleta de sintomas e geração de ticket via API REST.",
    sampleNaturalSteps: `- Cumprimentar o cliente e identificar pelo nome
- Pedir o CPF ou CNPJ do titular do contrato
- Identificar qual módulo ou sistema está com instabilidade
- Coletar a descrição detalhada do erro ou sintoma observado
- Apresentar resumo estruturado e pedir confirmação expressa antes de registrar
- Executar a integração do workflow para registrar o chamado
- Informar o número de protocolo oficial e o prazo de resposta
- Finalizar o atendimento com cordialidade`,
    sampleNaturalRules: `- O CPF deve ser validado e formatado no padrão XXX.XXX.XXX-XX ou apenas dígitos numéricos
- O CNPJ deve ser validado no padrão XX.XXX.XXX/XXXX-XX
- Solicitar confirmação expressa (Sim/Não) antes de enviar a gravação para o Workflow
- Não alucinar prazos; repassar exatamente o SLA retornado pela API
- Aproveitar as variáveis de contexto SZ ({{nome}}, {{telefone}}) se disponíveis
- Se o cliente solicitar atendente humano ou demonstrar irritação, retornar SOMENTE #SUPORTE_HUMANO`,
    sampleNaturalAlgorithm: `1. Recepcionar o cliente de forma cordial utilizando as variáveis de contexto do SZ ({{nome}}, {{telefone}}).
2. Solicitar e validar o CPF ou CNPJ do titular do contrato para consulta cadastral.
3. Perguntar qual módulo ou recurso do software está apresentando problema e obter o relato dos sintomas.
4. Apresentar o resumo dos dados para confirmação expressa do cliente (Nome, Contato, Documento, Módulo e Sintomas).
5. Se confirmado, acionar o endpoint POST /v1/tickets do Workflow para gerar o protocolo de atendimento e calcular SLA.
6. Retornar ao cliente o número de protocolo e o prazo de resposta da equipe técnica.
7. Se o cliente solicitar atendente humano ou demonstrar insatisfação grave, acionar a tag #SUPORTE_HUMANO imediatamente.`,
    sampleAgent: DEFAULT_AGENT_SCHEMA_TEMPLATE,
    sampleWorkflow: DEFAULT_WORKFLOW_SCHEMA_TEMPLATE,
    apiDocsSample: `POST /v1/tickets
Host: https://api.techsolucoes.com.br
Headers: Content-Type: application/json
Body:
{
  "customer_name": "string",
  "phone": "string",
  "document": "string",
  "category": "string",
  "description": "string"
}
Response 201:
{
  "ticket_id": "TCK-98421",
  "protocolo": "2026-98421",
  "sla_horas": 4
}`
  },
  {
    id: "template-vendas",
    title: "Qualificação de Leads & SDR (Metodologia SPIN)",
    category: "Vendas",
    badge: "Alta Conversão",
    description: "Agente consultivo com regras anti-alucinação de preços, qualificação SPIN e transbordo para #VENDAS_HUMANO.",
    sampleNaturalSteps: `- Cumprimentar o lead e fazer pergunta aberta sobre a necessidade inicial
- Investigar a situação atual, os problemas enfrentados e o impacto na operação
- Coletar o nome, empresa, e-mail corporativo e quantidade de atendentes
- Apresentar os principais benefícios corporativos da solução
- Perguntar se o lead deseja agendar uma demonstração personalizada
- Enviar a oportunidade qualificada para o CRM via integração
- Encaminhar para o executivo de vendas e encerrar o contato`,
    sampleNaturalRules: `- O e-mail informado deve ser no padrão corporativo válido (nome@empresa.com.br)
- A quantidade de atendentes deve ser um número inteiro positivo
- O agente não fecha contratos nem negocia descontos; valores são calculados pelo executivo
- Se o lead demonstrar real interesse e desejar demonstração, retornar SOMENTE #VENDAS_HUMANO
- Em caso de dúvidas de suporte ou clientes antigos, retornar SOMENTE #SUPORTE`,
    sampleNaturalAlgorithm: `1. Iniciar o atendimento identificando o lead e perguntando sobre o objetivo principal de busca por software.
2. Aplicar perguntas da metodologia SPIN: entender a Situação atual, o Problema que enfrentam e a Implicação nos custos.
3. Coletar o nome da empresa, quantidade de posições de atendimento e e-mail corporativo.
4. Apresentar até 3 benefícios diretos da solução corporativa, ressaltando sempre que valores finais dependem de dimensionamento comercial.
5. Se o lead tiver interesse em demonstração, enviar os dados via POST /crm/v3/objects/deals para cadastrar o deal no CRM.
6. Transbordar imediatamente para o executivo de vendas humano através da tag #VENDAS_HUMANO.`,
    sampleAgent: {
      ...DEFAULT_AGENT_SCHEMA_TEMPLATE,
      id: "4fa85f64-5717-4562-b3fc-2c963f66afa7",
      name: "TechSolucoes SDRVendas",
      cat: "vendas_sdr",
      description: "Qualificação de leads e apresentação de soluções SaaS para empresas.",
      audience: "Gestores e diretores buscando automação e software de atendimento",
      greetings: "Olá! Sou a consultora virtual da TechSoluções 🚀. O que te motivou a buscar nossas soluções hoje? Está enfrentando algum desafio específico em seus atendimentos?",
      style: "Você é a consultora virtual de vendas da TechSoluções. Tom consultivo, amigável, entusiasmado e focado em entender as dores do cliente antes de apresentar soluções.",
      instruction: {
        objective: "Qualificar o lead através do método SPIN, identificar necessidades e encaminhar oportunidades quentes ao time comercial.",
        role: "Qualificar leads interessados em soluções corporativas, identificando necessidades e encaminhando ao time comercial. Siga os seguintes passos:",
        steps: [
          "Cumprimentar o lead e fazer pergunta aberta sobre a necessidade inicial",
          "Investigar a situação atual, os problemas enfrentados e o impacto na operação",
          "Coletar o nome, empresa, e-mail corporativo e quantidade de atendentes",
          "Apresentar os principais benefícios corporativos da solução",
          "Perguntar se o lead deseja agendar uma demonstração personalizada",
          "Enviar a oportunidade qualificada para o CRM via integração",
          "Encaminhar para o executivo de vendas e encerrar o contato"
        ]
      },
      other_rules: `# REGRAS E DIRETRIZES DO CONSULTOR DE VENDAS (COMO FAZER)

## 1. VALIDAÇÃO E FORMATO DE DADOS
- E-mail deve ser no padrão corporativo válido (nome@empresa.com.br).
- Quantidade de atendentes deve ser um número inteiro positivo.

## 2. DIRETRIZES MONO SKILL
- Este agente NÃO emite contratos, NÃO fecha vendas e NÃO cobra valores.
- O objetivo exclusivo é qualificar a oportunidade e agendar demonstração com executivo humano.

## 3. REGRAS ANTI-ALUCINAÇÃO DE PREÇOS
- NUNCA invente descontos ou garanta valores sem confirmação do CRM.
- Sempre informe: "Nosso executivo comercial apresentará a proposta personalizada para o tamanho da sua operação."

## 4. TAGS DE TRANSBORDO
- Lead Quente / Quer agendar demonstração: responda SOMENTE #VENDAS_HUMANO
- Dúvidas de cliente antigo / Suporte: responda SOMENTE #SUPORTE
- Finalização sem interesse: responda SOMENTE #FIM`
    },
    sampleWorkflow: {
      ...DEFAULT_WORKFLOW_SCHEMA_TEMPLATE,
      id: "8d8e9f01-2345-6789-abcd-ef0123456788",
      name: "WF - Cadastro de Oportunidade no CRM",
      flow: [
        {
          id: "22222222-2222-3333-4444-555555555551",
          type: "instructions",
          __spec: true,
          __spec_version: "1.0.0",
          content: "Cadastro de Lead Qualificado no CRM.\nEnvia a oportunidade e dados de contato para o CRM Hubspot/Pipedrive.\n\nArgs:\n  nome (str): Nome do contato.\n  empresa (str): Nome da empresa do lead.\n  email (str): E-mail corporativo.\n  telefone (str): Telefone WhatsApp.\n  tamanho_equipe (int): Quantidade de posições de atendimento.\n  dores (str): Resumo das necessidades identificadas.\n\nReturns:\n  dict: Objeto com status do lead e id_crm."
        },
        {
          id: "22222222-2222-3333-4444-555555555552",
          name: "request",
          type: "code",
          __spec: true,
          __spec_version: "1.0.0",
          error_message: "Erro ao processar dados do lead",
          value: "try {\n    let data = _vars._request.body;\n\n    if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {\n        data = data.data;\n    }\n\n    return data;\n\n} catch (e) {\n    return {\n        error: \"Failed to extract request data\",\n        details: JSON.stringify(e)\n    };\n}"
        },
        {
          id: "22222222-2222-3333-4444-555555555553",
          name: "crm_response",
          type: "rest",
          __spec: true,
          __spec_version: "1.0.0",
          method: "POST",
          uri: "https://api.hubspot.com/crm/v3/objects/deals",
          verify_ssl: true,
          body_format: "json",
          headers: [
            { key: "Content-Type", value: "application/json" },
            { key: "Authorization", value: "Bearer {{crm_token}}" }
          ],
          body: "{\n  \"properties\": {\n    \"dealname\": \"Oportunidade - {{request.empresa}}\",\n    \"pipeline\": \"default\",\n    \"dealstage\": \"qualificacao\",\n    \"contact_email\": \"{{request.email}}\",\n    \"contact_phone\": \"{{request.telefone}}\"\n  }\n}"
        },
        {
          id: "22222222-2222-3333-4444-555555555554",
          type: "route_return",
          __spec: true,
          __spec_version: "1.0.0",
          content_type: "application/json",
          status_code: "200",
          value: "{{#tojson}}\n{{crm_response}}\n{{/tojson}}"
        }
      ]
    },
    apiDocsSample: `POST /crm/v3/objects/deals
Host: https://api.hubspot.com
Body:
{
  "dealname": "string",
  "contact_email": "string",
  "contact_phone": "string"
}`
  },
  {
    id: "template-financeiro",
    title: "Segunda Via de Boleto & Código PIX",
    category: "Financeiro",
    badge: "Auto-Serviço",
    description: "Consulta automática de faturas em aberto por CPF/CNPJ, emissão de chave PIX Copia e Cola e link de PDF com segurança.",
    sampleNaturalSteps: `- Cumprimentar o cliente e pedir o CPF ou CNPJ do titular
- Consultar as faturas em aberto via integração do sistema
- Apresentar a lista de faturas pendentes com valor e data de vencimento
- Perguntar se o cliente prefere pagar via PIX Copia e Cola ou Código de Barras
- Gerar e entregar o código de pagamento solicitado
- Finalizar o atendimento com mensagem cordial`,
    sampleNaturalRules: `- O CPF deve ser validado e formatado no padrão XXX.XXX.XXX-XX ou 11 dígitos
- O CNPJ deve ser validado no padrão XX.XXX.XXX/XXXX-XX ou 14 dígitos
- NUNCA solicitar senhas bancárias ou códigos de cartão
- Se o cliente contestar o valor ou solicitar parcelamento especial, retornar SOMENTE #FINANCEIRO_HUMANO
- Ao finalizar a entrega com sucesso, retornar SOMENTE #FIM`,
    sampleNaturalAlgorithm: `1. Identificar o cliente e solicitar o CPF ou CNPJ cadastrado (aproveitar {{cpf}} caso venha no contexto SZ).
2. Executar a consulta de débitos chamando o endpoint GET /v1/faturas/pendentes passando o documento do cliente.
3. Se não houver débitos, informar que a conta está em dia e finalizar cordialmente com a tag #FIM.
4. Se houver fatura em aberto, apresentar os dados (Vencimento, Valor e Referência) e perguntar se prefere pagar via PIX ou Código de Barras.
5. Ao confirmar a opção do cliente, chamar o endpoint POST /v1/pix/gerar para gerar o código PIX Copia e Cola ou link de boleto.
6. Entregar o código diretamente na conversa com instrução de pagamento.
7. Se o cliente contestar o valor cobrado ou solicitar parcelamento especial, transbordar imediatamente para #FINANCEIRO_HUMANO.`,
    sampleAgent: {
      ...DEFAULT_AGENT_SCHEMA_TEMPLATE,
      id: "5fa85f64-5717-4562-b3fc-2c963f66afa8",
      name: "TechSolucoes FinanceiroFaturas",
      cat: "financeiro_cobranca",
      description: "Consulta de débitos e envio de 2ª via de fatura ou código PIX.",
      audience: "Clientes com contratos ativos que precisam de faturas ou regularização",
      greetings: "Olá! Sou a assistente do setor financeiro da TechSoluções 💳. Estou aqui para te ajudar com a consulta de faturas e emissão de segunda via. Para localizarmos seus títulos, informe o CPF ou CNPJ do titular.",
      style: "Você é a assistente do setor financeiro da TechSoluções. Tom direto, seguro, profissional e focado em privacidade de dados.",
      instruction: {
        objective: "Validar identidade do cliente por documento, buscar faturas em aberto e fornecer o código de barras ou PIX.",
        role: "Consultar pendências financeiras e gerar 2ª via de boleto/PIX para o cliente. Siga os seguintes passos:",
        steps: [
          "Cumprimentar o cliente e pedir o CPF ou CNPJ do titular",
          "Consultar as faturas em aberto via integração",
          "Apresentar a lista de faturas pendentes com valor e data de vencimento",
          "Perguntar se prefere pagar via PIX Copia e Cola ou Código de Barras",
          "Gerar e entregar o código de pagamento solicitado",
          "Finalizar o atendimento com mensagem cordial"
        ]
      },
      other_rules: `# REGRAS DO AGENTE FINANCEIRO (COMO FAZER)

## 1. VALIDAÇÃO E FORMATO DE DOCUMENTOS
- O CPF deve ser validado e formatado no padrão XXX.XXX.XXX-XX ou apenas 11 dígitos numéricos.
- O CNPJ deve ser validado e formatado no padrão XX.XXX.XXX/XXXX-XX ou apenas 14 dígitos numéricos.

## 2. SEGURANÇA E PRIVACIDADE
- NUNCA solicite senhas bancárias, códigos de segurança ou dados de cartão de crédito.
- Somente exiba faturas após validação do documento informado.

## 3. TOKENS DE ROTEAMENTO
- Se contestar valor ou pedir parcelamento especial: responda SOMENTE #FINANCEIRO_HUMANO
- Atendimento finalizado: responda SOMENTE #FIM`
    },
    sampleWorkflow: {
      ...DEFAULT_WORKFLOW_SCHEMA_TEMPLATE,
      id: "9d8e9f01-2345-6789-abcd-ef0123456787",
      name: "WF - Consulta e Emissão de Faturas PIX",
      flow: [
        {
          id: "33333333-2222-3333-4444-555555555551",
          type: "instructions",
          __spec: true,
          __spec_version: "1.0.0",
          content: "Consulta de Débitos e Faturas PIX.\nConsulta faturas em aberto de um cliente no ERP financeiro e gera código de pagamento PIX.\n\nArgs:\n  documento (str): CPF ou CNPJ do cliente titular.\n\nReturns:\n  dict: Lista de faturas com id_fatura, valor, vencimento, pix_copia_cola e link_boleto."
        },
        {
          id: "33333333-2222-3333-4444-555555555552",
          name: "request",
          type: "code",
          __spec: true,
          __spec_version: "1.0.0",
          error_message: "Erro ao processar dados da requisição financeira",
          value: "try {\n    let data = _vars._request.body;\n\n    if (data && typeof data === 'object' && Object.keys(data).length === 1 && data.data) {\n        data = data.data;\n    }\n\n    return data;\n\n} catch (e) {\n    return {\n        error: \"Failed to extract request data\",\n        details: JSON.stringify(e)\n    };\n}"
        },
        {
          id: "33333333-2222-3333-4444-555555555553",
          name: "faturas_erp",
          type: "rest",
          __spec: true,
          __spec_version: "1.0.0",
          method: "GET",
          uri: "https://api.erpfinanceiro.com.br/v2/invoices?document={{request.documento}}",
          verify_ssl: true,
          headers: [{ key: "Authorization", value: "Bearer {{erp_key}}" }]
        },
        {
          id: "33333333-2222-3333-4444-555555555554",
          type: "route_return",
          __spec: true,
          __spec_version: "1.0.0",
          content_type: "application/json",
          status_code: "200",
          value: "{{#tojson}}\n{{faturas_erp.body}}\n{{/tojson}}"
        }
      ]
    },
    apiDocsSample: `GET /v2/invoices?document={cpf_cnpj}
Host: https://api.erpfinanceiro.com.br
Response 200:
{
  "total_open": 1,
  "invoices": [
    {
      "id": "INV-2026-001",
      "amount": 189.90,
      "due_date": "2026-08-25",
      "pix_code": "00020126580014br.gov.bcb.pix...",
      "pdf_url": "https://erp.com/fatura/INV-2026-001.pdf"
    }
  ]
}`
  }
];

export const SYSTEM_SZ_VARIABLES_INFO = [
  { name: "{{telefone}}", description: "Telefone do contato (WhatsApp/SMS)", example: "+5511999998888" },
  { name: "{{nome}}", description: "Nome do cliente cadastrado no Omnichannel", example: "Carlos Eduardo" },
  { name: "{{cpf}}", description: "Documento CPF/CNPJ identificado", example: "123.456.789-00" },
  { name: "{{email}}", description: "E-mail de contato cadastrado", example: "carlos@empresa.com.br" },
  { name: "{{canal}}", description: "Canal de atendimento (whatsapp, webchat, telegram)", example: "whatsapp" },
  { name: "{{plano}}", description: "Plano ou produto contratado", example: "Plano Pro Enterprise" }
];

export const STANDARD_ROUTING_TOKENS = [
  { token: "#HUMANO", description: "Transbordo genérico para fila de atendimento humano" },
  { token: "#SUPORTE_HUMANO", description: "Direciona especificamente para fila de Suporte Técnico N1/N2" },
  { token: "#VENDAS_HUMANO", description: "Direciona lead qualificado para equipe comercial / SDR" },
  { token: "#FINANCEIRO", description: "Transfere para o departamento financeiro ou cobrança" },
  { token: "#COMERCIAL", description: "Transfere para o setor comercial" },
  { token: "#SAC", description: "Encaminha para ouvidoria / SAC" },
  { token: "#FIM", description: "Sinaliza encerramento imediato do protocolo com satisfação" },
  { token: "#ENCAMINHAR", description: "Desvio condicional para roteamento secundário" },
  { token: "#RESULTADO", description: "Devolução de dados estruturados para fluxo pai" }
];
