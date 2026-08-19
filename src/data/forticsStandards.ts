import { ForticsAgent, ForticsWorkflow } from '../types/fortics';

export const MANUAL_AGENTE_BOAS_PRATICAS = `# GUIA COMPLETO DE AGENTES INTELIGENTES FORTICS (OFICIAL 2026)

## 1. Princípio Fundamental: MONO SKILL & ORQUESTRAÇÃO
- **1 Agente = 1 Tarefa = 1 Roteiro Único.**
- Nunca misture suporte com vendas ou financeiro no mesmo agente especialista.
- Em operações multissetoriais, utilize um **Agente de Triagem / Orquestrador** que identifica a intenção e transborda para o agente especialista via tokens (#SUPORTE, #FINANCEIRO, #COMERCIAL).

## 2. As 6 Dimensões do Prompt Perfeito
1. **PERSONA:** Quem o agente é, nome, especialidade, tom de voz e limites claros do que PODE e NÃO PODE fazer.
2. **CONTEXTO:** Descrição detalhada do cenário e audiência (público leigo vs técnico).
3. **TAREFA (Função + Passos):** 
   - No campo \`instruction.role\`, finalize OBRIGATORIAMENTE com: "Siga os seguintes passos:".
   - No campo \`instruction.steps\`: Liste estritamente **O QUE TEM QUE FAZER** em frases diretas e limpas em linguagem natural.
4. **OUTRAS REGRAS (\`other_rules\`):** É estritamente **COMO VÃO FAZER**. Descreva detalhadamente regras de validação (CPF/CNPJ), confirmação expressa antes de gravar, limites de escopo, regras anti-alucinação, variáveis SZ e tags de transbordo.
5. **FORMATO:** Saudação receptiva, regras de tamanho de resposta (máx 3 a 4 linhas), emojis e formatação Markdown.
6. **TOM & TEMPERATURA:** Criatividade BAIXA (0.0 a 0.2) para agentes informativos, suporte e financeiro com dados factuais.

## 3. Padrões de Exibição Contextual (Context Binding)
- O runtime Fortics exige que dados chave (como \`id_cliente\`, \`id_contrato\`, \`protocolo\`) sejam exibidos no diálogo para viabilizar chamadas subsequentes:
  * Exemplo: *"Sempre Exiba nome + id do cliente + cpf/cnpj do cliente + contratos disponíveis + endereço do contrato + status"*.

## 4. Fenced Code Blocks & Tokens de Roteamento
- Quando o fluxo exigir transbordo ou acionamento direto:
  * Retorne o token (#HUMANO, #FINANCEIRO, #BOLETO, #COD_PIX) sem texto adicional.
  * Quando necessário, anexe o JSON fenced com as variáveis extraídas (\`ID_CONTRATO\`, \`DATA_FATURA\`, \`CODIGO_BOLETO\`, \`CODIGO_PIX\`).`;

export const MANUAL_WORKFLOW_BOAS_PRATICAS = `# GUIA DE ENGENHARIA DE WORKFLOWS FORTICS (JSON IMPORTÁVEL)

## 1. Estrutura e Grafo de Execução
O Workflow Fortics é um grafo determinístico de nós (\`flow\`) com spec flags (\`__spec: true\`, \`__spec_version: "1.0.0"\`) e UUIDs v4 únicos.

## 2. Tipos de Nós Oficiais:
1. **instructions (Tool Spec para Agente LLM):**
   - Título, descrição, argumentos (Args:) e retorno estruturado (Returns:) no padrão Google/Sphinx.
2. **code (Padrão Oficial de Extração - name: "request"):**
   - Desempacotamento seguro de \`_vars._request.body\`.
3. **rest (Integração HTTP / APIs externas):**
   - Métodos GET, POST, PUT, DELETE, PATCH com \`verify_ssl\`, \`headers\` e injeção de variáveis \`{{request.campo}}\`.
4. **label & goto (Looping e Paginação):**
   - Nó \`label\` serve como âncora; nó \`goto\` salta de volta para iterar sobre listas com \`shift()\`.
5. **condition (Bifurcação de Fluxo):**
   - Comparação (\`==\`, \`!=\`, etc.) com ramos \`then\` e \`else\`.
6. **route_return (Encerramento e Retorno ao Agente):**
   - Serialização final com \`{{#tojson}}{{variavel_final}}{{/tojson}}\`.`;

export const DEFAULT_AGENT_SCHEMA_TEMPLATE: ForticsAgent = {
  id: "88fc753b-e6f1-4119-96f8-2ebf376ceecc",
  name: "Agente de Suporte Técnico",
  description: "Diagnóstico técnico de internet, verificação de massivas, sinal LOS/PON e abertura de chamados.",
  audience: "Clientes residenciais e corporativos com dúvidas ou problemas de conexão.",
  cat: "support_net",
  color: "#d500f9",
  icon: "avatar-1",
  emojis: false,
  enabled: true,
  force_greetings: false,
  greetings: "Olá! Sou o assistente de suporte técnico. Como posso te ajudar hoje?",
  style: "Se comporte como um atendente de suporte nível 1, direto, cordial e natural.",
  llm: "GPT",
  llm_api_key: "21406bd2-f435-4027-83f1-45720febe2b5",
  llm_model: "gpt-4.1",
  llm_temperature: 0,
  ocr_enabled: true,
  protected: true,
  webchat: false,
  template: true,
  voice_priority: false,
  void_context: true,
  tts_id: "00000000-0000-0000-0000-000000000000",
  media_upload_enabled: false,
  offset: "America/Sao_Paulo",
  instruction: {
    objective: "Diagnosticar e resolver problemas de conexão do cliente de forma direta, natural e eficiente.",
    role: "Você é um atendente de suporte técnico nível 1. Siga os seguintes passos:",
    steps: [
      "Cumprimentar o cliente e identificar a necessidade",
      "Solicitar e confirmar o CPF ou CNPJ do titular",
      "Consultar ocorrências de massiva ativa na região",
      "Verificar o status de conexão da ONU e sinal óptico",
      "Classificar o problema entre sem conexão, lentidão ou instabilidade",
      "Orientar teste das luzes do roteador ou rede 5GHz",
      "Abrir chamado técnico no HelpDesk caso o problema persista",
      "Verificar horário de atendimento e realizar transbordo se necessário"
    ]
  },
  other_rules: `### IDENTIDADE
Você é um agente de suporte técnico de internet. Seu objetivo é diagnosticar e resolver problemas de conexão do cliente de forma direta, natural e eficiente.

### COMPORTAMENTO E LINGUAGEM
- Seja direto e natural — escreva como uma pessoa, não como um robô.
- Nunca realize mais de uma pergunta por mensagem.
- Divida informações longas em etapas: envie uma parte, aguarde a resposta, continue.
- Cada resposta: máximo 3 frases curtas.
- Só avance para o diagnóstico após ter o CPF/CNPJ confirmado.

### TAGS DE TRANSBORDO
- #HUMANO: Falha física, LOS/PON piscando, insatisfação, cancelamento.
- #ENCAMINHAR: Solicitações comerciais ou financeiras.
- #FIM: Problema resolvido com sucesso.`
};

export const DEFAULT_WORKFLOW_SCHEMA_TEMPLATE: ForticsWorkflow = {
  id: "e75f90f1-472d-4ce9-882f-acf16bb1dfab",
  name: "WF - Consulta de Agendamentos e Disparo HSM",
  enabled: true,
  allow_workflow_import: true,
  protected: false,
  options: {
    abort_keyword: "###",
    abort_message: "Sessão abortada!",
    finish_message: "Até a próxima!",
    inactivity_message: "Sessão encerrada por inatividade!",
    inactivity_warning: "Sua sessão vai expirar em breve por inatividade",
    inactivity_warning_time: 60,
    timeout: 500
  },
  flow: [
    {
      id: "a9e8b0d0-9c5c-4b17-b849-06cbcab22d7c",
      name: "Data_futura",
      type: "code",
      __spec: true,
      __spec_version: "1.0.0",
      error_message: "Desculpe, estou com dificuldades para processar sua solicitação",
      value: `try {
    var hoje = new Date();
    var diasAdicionar = 1;
    if (hoje.getDay() === 5) diasAdicionar = 1;
    hoje.setDate(hoje.getDate() + diasAdicionar);
    var ano = hoje.getFullYear();
    var mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    var dia = hoje.getDate().toString().padStart(2, '0');
    return ano + '-' + mes + '-' + dia;
} catch (e) {
    return { error: "Failed to generate date", details: JSON.stringify(e) };
}`
    },
    {
      id: "55f06b09-a974-4009-8d0d-e2f25a78c9f0",
      name: "token",
      type: "rest",
      __spec: true,
      __spec_version: "1.0.0",
      method: "POST",
      uri: "https://naja-auth.naja.app/Login/AutenticarOrganizacao",
      verify_ssl: false,
      body_format: "json",
      headers: [{ key: "Content-Type", value: "application/json" }],
      body: '{\n  "tokenOrganizacao": "2f8a1cef-bc28-4fc8-905a-aacba27e8c0c"\n}'
    },
    {
      id: "b404b372-e1b3-4cec-bbb9-6b9da8455a9c",
      name: "response",
      type: "rest",
      __spec: true,
      __spec_version: "1.0.0",
      method: "GET",
      uri: "http://204.199.59.114:5005/Agendamentos?retornarCancelados=false&retornarProdutos=true",
      verify_ssl: true,
      headers: [{ key: "Authorization", value: "Bearer {{token.token}}" }],
      query_params: [
        { key: "data", value: "{{Data_futura}}" },
        { key: "dataFinal", value: "{{Data_futura}}" }
      ]
    },
    {
      id: "3d31fe6e-c277-44dd-958d-0449c1baaa47",
      name: "clientes_filtrados",
      type: "code",
      __spec: true,
      __spec_version: "1.0.0",
      error_message: "Erro ao filtrar agendamentos",
      value: `const agendamentos = _vars.response || [];
const data = agendamentos.filter(function(item) {
    return item && item.status && String(item.status.descricao || '').toUpperCase() === 'AGENDADO';
}).map(function(item) {
    return {
        codAgendamento: item.codigo,
        patientName: item.paciente?.nome || null,
        phoneNumber: item.paciente?.contatos?.[0]?.numero || null,
        data: item.data
    };
});
return { data: data, tamanho: data.length };`
    },
    {
      id: "657cc23f-98cc-4a8c-8ef6-d3b81795122e",
      type: "route_return",
      __spec: true,
      __spec_version: "1.0.0",
      content_type: "application/json",
      status_code: "200",
      value: "{{#tojson}}\n{{clientes_filtrados}}\n{{/tojson}}"
    }
  ]
};

export const TEMPLATES_LIBRARY = [
  {
    id: "template-suporte-isp",
    title: "Suporte Técnico ISP & Massivas Voalle",
    category: "Suporte ISP",
    badge: "Oficial Produção",
    description: "Diagnóstico técnico de internet com consulta de massivas, teste de sinal óptico LOS/PON, Wi-Fi 5G e abertura de chamados.",
    sampleNaturalSteps: `- Cumprimentar o cliente e identificar a necessidade
- Solicitar e confirmar o CPF ou CNPJ do titular
- Consultar ocorrências de massiva ativa na região
- Verificar o status de conexão da ONU e sinal óptico
- Classificar o problema entre sem conexão, lentidão ou instabilidade
- Orientar teste das luzes do roteador ou rede 5GHz
- Abrir chamado técnico no HelpDesk caso o problema persista
- Verificar horário de atendimento e realizar transbordo`,
    sampleNaturalRules: `- Nunca use número de telefone como CPF
- Só avance para o diagnóstico após ter o CPF/CNPJ confirmado
- Se houver massiva na região, informe e encerre com #FIM se o cliente não tiver mais dúvidas
- Se 2 interações consecutivas não avançarem, retorne SOMENTE #HUMANO`,
    sampleAgent: DEFAULT_AGENT_SCHEMA_TEMPLATE,
    sampleWorkflow: DEFAULT_WORKFLOW_SCHEMA_TEMPLATE
  },
  {
    id: "template-comercial-isp",
    title: "Assistente Comercial & Vendas ISP",
    category: "Comercial ISP",
    badge: "Alta Conversão",
    description: "Vendas residenciais e empresariais, consulta de viabilidade de endereço, upgrade/downgrade, SVA e transferência de titularidade.",
    sampleNaturalSteps: `- Validar se o contato é cliente ou novo lead
- Confirmar a cidade e consultar viabilidade de endereço
- Perguntar se o plano é para uso residencial ou empresarial
- Apresentar opções de planos e condições de contratação
- Coletar documentos para cadastro e termo de adesão
- Realizar o transbordo para a equipe de vendas`,
    sampleNaturalRules: `- NUNCA invente planos ou valores fora da base oficial
- Planos residenciais transborde para #PLANOSRESIDENCIAIS
- Planos empresariais transborde para #PLANOSEMPRESARIAIS
- Finalização de proposta transborde para #HUMANO`,
    sampleAgent: {
      ...DEFAULT_AGENT_SCHEMA_TEMPLATE,
      id: "565667d8-8fa0-43b9-83ab-f6c94db5d07e",
      name: "Assistente Comercial ISP",
      cat: "commercial_net",
      color: "#834bff",
      icon: "avatar-2",
      description: "Fornece informações detalhadas sobre planos, preços e viabilidade de contratação."
    },
    sampleWorkflow: DEFAULT_WORKFLOW_SCHEMA_TEMPLATE
  },
  {
    id: "template-financeiro-starconect",
    title: "Agente Financeiro & 2ª Via / PIX",
    category: "Financeiro",
    badge: "Auto-Serviço",
    description: "Emissão de boletos, código PIX Copia e Cola, desbloqueio em confiança (2 dias) e validação de comprovantes de pagamento.",
    sampleNaturalSteps: `- Identificar o cliente por CPF/CNPJ ou telefone
- Consultar faturas em aberto no ERP financeiro
- Apresentar a lista de faturas pendentes com vencimento e valor
- Oferecer envio por PIX, código de barras ou PDF
- Oferecer desbloqueio em confiança de 2 dias se disponível
- Validar comprovante de pagamento caso enviado pelo cliente`,
    sampleNaturalRules: `- Respeitar a formatação exata dos valores (ex: 50.60)
- Enviar #COD_PIX acompanhado de JSON fenced com CODIGO_PIX
- Enviar #COD_BOLETO ou #BOLETO com ID_CONTRATO, DATA_FATURA e CODIGO_BOLETO
- Se cliente tiver mais de 3 boletos em atraso, transborde para #HUMANO`,
    sampleAgent: {
      ...DEFAULT_AGENT_SCHEMA_TEMPLATE,
      id: "bd5323d7-305d-4669-b91d-e3fa4ea8f6d1",
      name: "Agente Financeiro StarConect",
      cat: "finance_net",
      color: "#4caf50",
      icon: "avatar-7",
      description: "Auxilia na emissão de segunda via de boletos, PIX e desbloqueio em confiança."
    },
    sampleWorkflow: DEFAULT_WORKFLOW_SCHEMA_TEMPLATE
  },
  {
    id: "template-agendamento-medico",
    title: "Agendamento Médico & Exames de Imagem",
    category: "Saúde & Clínicas",
    badge: "Multietapa",
    description: "Marcação de exames de imagem e consultas em unidades médicas com verificação de convênios, planos, médicos e preparos.",
    sampleNaturalSteps: `- Cumprimentar o paciente e perguntar a quantidade de exames
- Listar unidades médicas disponíveis e aguardar escolha
- Consultar convênios aceitos na unidade escolhida
- Listar procedimentos disponíveis e verificar preparo necessário
- Consultar horários livres com médicos executantes
- Coletar dados do paciente e apresentar resumo antes de confirmar
- Chamar integração de criação de agendamento`,
    sampleNaturalRules: `- Aceitar agendamento automático apenas para os 8 procedimentos permitidos
- Para procedimentos complexos ou mais de 1 exame, transborde para #HUMANO
- Sempre utilizar os nomes exatos retornados pelas integrações sem alterar`,
    sampleAgent: {
      ...DEFAULT_AGENT_SCHEMA_TEMPLATE,
      id: "f651fe16-ffa1-48c3-a45d-0cfd2650cdf6",
      name: "Omni - Agendamento de Exames",
      cat: "medical_scheduling",
      color: "#3dd56d",
      icon: "avatar-4",
      description: "Assistente virtual especializada em agendamentos de exames de imagem e consultas."
    },
    sampleWorkflow: DEFAULT_WORKFLOW_SCHEMA_TEMPLATE
  },
  {
    id: "template-triagem-orquestrador",
    title: "Agente de Triagem & Roteador Multiskill",
    category: "Orquestrador",
    badge: "Master Router",
    description: "Identifica a intenção do cliente no início do contato, analisa imagens/áudios e direciona para o agente especialista correto.",
    sampleNaturalSteps: `- Cumprimentar o cliente e identificar a necessidade
- Validar se é cliente ativo ou novo lead
- Identificar intenção por texto ou imagem enviada (ONU -> Suporte, Comprovante -> Financeiro)
- Realizar validação cadastral por telefone ou CPF
- Exibir resumo cadastral para confirmação
- Executar transbordo para o setor correspondente`,
    sampleNaturalRules: `- Retornar apenas a tag de transbordo (#FINANCEIRO, #COMERCIAL, #SUPORTE, #HUMANO, #FIM)
- Imagens de roteador/ONU direcionar para #SUPORTE
- Imagens de comprovantes direcionar para #FINANCEIRO`,
    sampleAgent: {
      ...DEFAULT_AGENT_SCHEMA_TEMPLATE,
      id: "c0784d95-9f42-4eda-a781-4e5046bb40b9",
      name: "Estela - Agente de Triagem",
      cat: "provider_multiskill",
      color: "#e11d48",
      icon: "avatar-8",
      description: "Orquestrador de atendimento para provedores de internet e serviços."
    },
    sampleWorkflow: DEFAULT_WORKFLOW_SCHEMA_TEMPLATE
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
  { token: "#HUMANO", description: "Transbordo para fila de atendimento humano" },
  { token: "#SUPORTE", description: "Direciona para o agente ou fila de Suporte Técnico" },
  { token: "#FINANCEIRO", description: "Transfere para o agente ou setor Financeiro" },
  { token: "#COMERCIAL", description: "Transfere para o agente ou setor Comercial" },
  { token: "#PLANOSRESIDENCIAIS", description: "Direciona para contratação de planos residenciais" },
  { token: "#PLANOSEMPRESARIAIS", description: "Direciona para contratação de planos corporativos" },
  { token: "#BOLETO", description: "Retorno de PDF de boleto com JSON fenced" },
  { token: "#COD_BOLETO", description: "Retorno de código de barras com JSON fenced" },
  { token: "#COD_PIX", description: "Retorno de chave PIX Copia e Cola com JSON fenced" },
  { token: "#SAC", description: "Encaminha para ouvidoria / SAC" },
  { token: "#RESULTADO", description: "Devolução de dados estruturados para fluxo pai" },
  { token: "#ENCAMINHAR", description: "Desvio condicional para roteamento secundário" },
  { token: "#FIM", description: "Sinaliza encerramento imediato do atendimento" }
];
