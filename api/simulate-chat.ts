import { GoogleGenAI } from '@google/genai';

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
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

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) || {};
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
  } = body;

  try {
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
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: simulationPrompt,
      config: {
        systemInstruction: 'Você é o motor de execução e sandbox de Agentes e Workflows do Fortics.',
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    });

    const rawSim = response.text || '{}';
    const jsonMatch = rawSim.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, rawSim];
    const cleanJson = (jsonMatch[1] || rawSim).trim();
    const parsed = JSON.parse(cleanJson);

    return res.status(200).json({
      success: true,
      data: parsed
    });
  } catch (error: any) {
    console.error('Error simulating chat:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao simular conversa do agente.'
    });
  }
}
