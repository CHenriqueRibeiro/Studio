import { ForticsAgent, ForticsWorkflow, ValidationReport, ValidationIssue, VariableFlowTrace, ForticsFlowNode } from '../types/fortics';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateForticsAgentAndWorkflow(
  agent: ForticsAgent | null | undefined,
  workflow: ForticsWorkflow | null | undefined
): ValidationReport {
  const issues: ValidationIssue[] = [];
  const variableTraces: VariableFlowTrace[] = [];
  const routingTokensDetected: string[] = [];
  const docstringArgsMatched: { argName: string; inInstructions: boolean; inAgentRules: boolean }[] = [];

  let agentScore = 100;
  let workflowScore = 100;

  // --- 1. AGENT VALIDATION ---
  if (!agent) {
    issues.push({
      type: 'error',
      title: 'Agente Ausente',
      message: 'O JSON do Agente Fortics não foi carregado ou é inválido.',
      location: 'agent.json'
    });
    agentScore = 0;
  } else {
    // Check Agent ID
    if (!agent.id || !UUID_REGEX.test(agent.id)) {
      issues.push({
        type: 'warning',
        title: 'ID do Agente inválido',
        message: 'O ID do agente deve ser um UUID v4 válido.',
        location: 'agent.id',
        fixSuggestion: 'Gere um UUID v4 para o identificador raiz do agente.'
      });
      agentScore -= 5;
    }

    // Check Name convention (Empresa Função)
    if (!agent.name || agent.name.trim().length < 3) {
      issues.push({
        type: 'error',
        title: 'Nome do Agente muito curto',
        message: 'O nome do agente deve ser descritivo no formato "Empresa Função".',
        location: 'agent.name',
        fixSuggestion: 'Ex: "TechSolucoes SuporteTecnico" ou "EmpresaXYZ Vendas".'
      });
      agentScore -= 10;
    } else if (agent.name.toLowerCase().includes('bot') || agent.name.toLowerCase() === 'meu agente') {
      issues.push({
        type: 'warning',
        title: 'Nome genérico detectado',
        message: 'Evite nomes genéricos como "Bot1" ou "Meu Agente". Siga a convenção "Empresa Função".',
        location: 'agent.name',
        fixSuggestion: 'Altere para o formato "Empresa [Função]".'
      });
      agentScore -= 5;
    }

    // Temperature Check
    if (agent.llm_temperature > 0.4) {
      issues.push({
        type: 'warning',
        title: 'Criatividade / Temperatura Alta',
        message: `Temperatura atual (${agent.llm_temperature}) é alta. Agentes informativos ou de suporte devem ter temperatura baixa (0.0 a 0.2) para evitar alucinações.`,
        location: 'agent.llm_temperature',
        fixSuggestion: 'Ajuste "llm_temperature" para 0 ou no máximo 0.2.'
      });
      agentScore -= 5;
    }

    // MONO SKILL check in role: must end with "siga os seguintes passos:"
    const role = agent.instruction?.role || '';
    if (!role.toLowerCase().includes('siga os seguintes passos') && !role.toLowerCase().includes('siga os passos')) {
      issues.push({
        type: 'warning',
        title: 'Formatação do campo "role"',
        message: 'Segundo o Guia Oficial Fortics, o campo instruction.role deve finalizar com: "siga os seguintes passos:" sem quebra de linha.',
        location: 'agent.instruction.role',
        fixSuggestion: 'Adicione " Siga os seguintes passos:" ao final do role.'
      });
      agentScore -= 5;
    }

    // Steps check
    const steps = agent.instruction?.steps || [];
    if (steps.length === 0) {
      issues.push({
        type: 'error',
        title: 'Passos ausentes',
        message: 'O agente deve possuir uma lista sequencial de passos descrevendo o QUE deve ser feito.',
        location: 'agent.instruction.steps',
        fixSuggestion: 'Defina a lista de passos com o QUE fazer em linguagem direta (ex: "Pedir CPF do cliente", "Confirmar dados", "Registrar chamado"), sem numeração ou caixa alta.'
      });
      agentScore -= 20;
    } else {
      let hasConfirmation = false;
      let hasNumberedOrCapsPrefix = false;

      steps.forEach((step) => {
        const lower = step.toLowerCase();
        if (lower.includes('confirm') || lower.includes('confirmação')) hasConfirmation = true;
        if (/^(?:\d+[\.\-\)]\s*|passo\s*\d+|[A-ZÁÉÍÓÚÂÊÔÃÕÇ\s_]{3,20}[:\-])/i.test(step)) {
          hasNumberedOrCapsPrefix = true;
        }
      });

      if (hasNumberedOrCapsPrefix) {
        issues.push({
          type: 'info',
          title: 'Numeração ou prefixo em caixa alta nos passos',
          message: 'Dica Fortics: Os passos do agente devem conter apenas O QUE fazer (ex: "Pedir o CPF do cliente"), sem necessidade de numerar ou usar caixa alta. O COMO fazer (ex: formato XXX.XXX.XXX-XX) deve ficar em "other_rules".',
          location: 'agent.instruction.steps',
          fixSuggestion: 'Remova prefixos como "1-IDENTIFICAÇÃO:" mantendo apenas a frase direta.'
        });
      }

      if (!hasConfirmation) {
        issues.push({
          type: 'info',
          title: 'Sem passo explícito de Confirmação',
          message: 'Recomendado incluir um passo de confirmação de dados (Nome, CPF, etc.) antes da chamada à integração.',
          location: 'agent.instruction.steps'
        });
      }
    }

    // Check Routing Tokens in other_rules or steps
    const fullText = (agent.other_rules || '') + ' ' + steps.join(' ');
    const tokenRegex = /#([A-Z0-9_]+)/g;
    let match;
    while ((match = tokenRegex.exec(fullText)) !== null) {
      if (!routingTokensDetected.includes(match[0])) {
        routingTokensDetected.push(match[0]);
      }
    }

    if (routingTokensDetected.length === 0) {
      issues.push({
        type: 'warning',
        title: 'Nenhum Token de Roteamento (#) Encontrado',
        message: 'Agentes Fortics utilizam tokens como #HUMANO, #SUPORTE_HUMANO, #FINANCEIRO ou #FIM para transbordo no Omnichannel.',
        location: 'agent.other_rules',
        fixSuggestion: 'Adicione diretrizes em "other_rules" especificando quando o agente deve responder apenas a tag de transbordo (Ex: #HUMANO).'
      });
      agentScore -= 10;
    }

    // Check SZ Variables in text
    const szVars = ['{{telefone}}', '{{nome}}', '{{cpf}}', '{{email}}', '{{canal}}', '{{plano}}'];
    szVars.forEach(v => {
      if (fullText.includes(v)) {
        variableTraces.push({
          name: v,
          sourceType: 'sz_context',
          consumedBy: ['Agent Context Ingestion']
        });
      }
    });
  }

  // --- 2. WORKFLOW VALIDATION ---
  if (!workflow) {
    issues.push({
      type: 'error',
      title: 'Workflow Ausente',
      message: 'O JSON do Workflow Fortics não foi carregado ou é inválido.',
      location: 'workflow.json'
    });
    workflowScore = 0;
  } else {
    // Check Workflow ID
    if (!workflow.id || !UUID_REGEX.test(workflow.id)) {
      issues.push({
        type: 'warning',
        title: 'ID do Workflow inválido',
        message: 'O ID raiz do workflow deve ser um UUID v4 válido.',
        location: 'workflow.id',
        fixSuggestion: 'Gere um UUID v4 no campo "id".'
      });
      workflowScore -= 5;
    }

    // Check options
    if (!workflow.options || !workflow.options.abort_keyword) {
      issues.push({
        type: 'warning',
        title: 'Opções do Workflow incompletas',
        message: 'O bloco options deve conter abort_keyword, abort_message, timeout, etc.',
        location: 'workflow.options'
      });
      workflowScore -= 5;
    }

    // Check Flow Nodes
    const flow = workflow.flow || [];
    if (flow.length === 0) {
      issues.push({
        type: 'error',
        title: 'Grafo de Nós Vazio',
        message: 'O array flow precisa ter pelo menos um nó de instruções, código ou REST.',
        location: 'workflow.flow'
      });
      workflowScore -= 30;
    } else {
      let hasInstructions = false;
      let hasRouteReturn = false;
      const labels: string[] = [];
      const gotos: string[] = [];
      const declaredWorkflowVariables: string[] = [];

      function inspectNode(node: ForticsFlowNode, depth = 0) {
        // Node ID check
        if (!node.id || !UUID_REGEX.test(node.id)) {
          issues.push({
            type: 'warning',
            title: `ID do nó inválido (${node.type})`,
            message: `O nó ${node.type} possui ID não-UUID v4.`,
            location: `workflow.flow[${node.type}]`
          });
          workflowScore -= 2;
        }

        // Check instructions
        if (node.type === 'instructions') {
          hasInstructions = true;
          const content = node.content || '';
          const hasArgs = content.includes('Args:');
          const hasReturns = content.includes('Returns:') || content.includes('Resposta:');
          const lines = content.trim().split('\n').filter(l => l.trim().length > 0);
          const hasTitleAndDesc = lines.length >= 2;

          if (!hasArgs || !hasReturns || !hasTitleAndDesc) {
            const missingParts = [];
            if (!hasTitleAndDesc) missingParts.push('Título/Descrição');
            if (!hasArgs) missingParts.push('Args');
            if (!hasReturns) missingParts.push('Returns/Resposta');
            issues.push({
              type: 'warning',
              title: 'Docstring do Tool Spec Incompleto',
              message: `O nó instructions deve conter: Título, Descrição, seção "Args:" e seção "Returns:". Faltando: ${missingParts.join(', ')}.`,
              location: `workflow.node(${node.id})`,
              fixSuggestion: 'Estruture o content do instructions com: Linha 1: Título | Linha 2: Descrição | Args: ... | Returns: ...'
            });
            workflowScore -= 5;
          } else {
            // Extract args from docstring
            const argsMatch = content.match(/Args:\s*([\s\S]*?)(?=Returns:|Resposta:|$)/i);
            if (argsMatch && argsMatch[1]) {
              const argLines = argsMatch[1].split('\n');
              for (const line of argLines) {
                const paramMatch = line.trim().match(/^([a-zA-Z0-9_]+)\s*\(/);
                if (paramMatch && paramMatch[1]) {
                  const arg = paramMatch[1];
                  const inRules = agent ? (agent.other_rules || '').toLowerCase().includes(arg.toLowerCase()) || JSON.stringify(agent.instruction).toLowerCase().includes(arg.toLowerCase()) : false;
                  docstringArgsMatched.push({
                    argName: arg,
                    inInstructions: true,
                    inAgentRules: inRules
                  });
                }
              }
            }
          }
        }

        // Check code node
        if (node.type === 'code') {
          if (node.name) {
            declaredWorkflowVariables.push(node.name);
            variableTraces.push({
              name: node.name,
              sourceType: 'workflow_code',
              sourceNodeId: node.id,
              consumedBy: []
            });
          }
          if (!node.value || node.value.trim().length === 0) {
            issues.push({
              type: 'error',
              title: 'Nó de Código sem script',
              message: `O nó code "${node.name || node.id}" está sem valor de script.`,
              location: `workflow.node(${node.id})`
            });
            workflowScore -= 10;
          } else {
            // Check request body unpacking pattern
            if (node.value.includes('_vars._request.body') || node.value.includes('request')) {
              if (node.name !== 'request' && node.name !== 'request_data') {
                issues.push({
                  type: 'info',
                  title: 'Nome do Nó de Extração',
                  message: `Recomendado nomear o nó de desempacotamento de requisição como "request" para permitir o uso direto de {{request.campo}} nos nós REST subsequentes.`,
                  location: `workflow.node(${node.id})`,
                  fixSuggestion: 'Altere o name do nó para "request".'
                });
              }
            }
          }
        }

        // Check rest node
        if (node.type === 'rest') {
          if (node.name) {
            declaredWorkflowVariables.push(node.name);
            variableTraces.push({
              name: node.name,
              sourceType: 'workflow_rest',
              sourceNodeId: node.id,
              consumedBy: []
            });
          }
          if (!node.uri || (!node.uri.startsWith('http://') && !node.uri.startsWith('https://'))) {
            issues.push({
              type: 'error',
              title: 'URI inválida no nó REST',
              message: `O nó REST "${node.name || node.id}" deve possuir uma URL HTTP/HTTPS válida.`,
              location: `workflow.node(${node.id})`
            });
            workflowScore -= 10;
          }
          // Check mustache variables in URI or Body
          const mustacheRegex = /\{\{([^{}]+)\}\}/g;
          const searchIn = (node.uri || '') + ' ' + (node.body || '');
          let mMatch;
          while ((mMatch = mustacheRegex.exec(searchIn)) !== null) {
            const varName = mMatch[1].trim();
            const trace = variableTraces.find(t => t.name === varName.split('.')[0]);
            if (trace) {
              trace.consumedBy.push(`REST Node: ${node.name || node.id}`);
            }
          }
        }

        // Check condition node
        if (node.type === 'condition') {
          if (!node.left || !node.condition) {
            issues.push({
              type: 'error',
              title: 'Nó Condition mal formatado',
              message: `O nó condition ${node.id} requer campos "left" e "condition".`,
              location: `workflow.node(${node.id})`
            });
            workflowScore -= 10;
          }
          if (node.then) node.then.forEach(child => inspectNode(child, depth + 1));
          if (node.else) node.else.forEach(child => inspectNode(child, depth + 1));
        }

        // Check label
        if (node.type === 'label') {
          if (node.name) labels.push(node.name);
        }

        // Check goto
        if (node.type === 'goto') {
          if (node.label) gotos.push(node.label);
        }

        // Check route_return
        if (node.type === 'route_return') {
          hasRouteReturn = true;
          if (!node.value || (!node.value.includes('{{#tojson}}') && !node.value.includes('{{'))) {
            issues.push({
              type: 'info',
              title: 'Formatação de route_return',
              message: 'Recomenda-se utilizar a tag "{{#tojson}}\\n{{variavel}}\\n{{/tojson}}" no valor de route_return.',
              location: `workflow.node(${node.id})`
            });
          }
        }
      }

      flow.forEach(n => inspectNode(n));

      // Check goto references
      gotos.forEach(g => {
        if (!labels.includes(g)) {
          issues.push({
            type: 'error',
            title: `Goto para label inexistente: "${g}"`,
            message: `O fluxo contém um nó goto para "${g}", mas nenhum nó label correspondente foi declarado.`,
            location: 'workflow.flow'
          });
          workflowScore -= 15;
        }
      });

      if (!hasInstructions) {
        issues.push({
          type: 'warning',
          title: 'Nó "instructions" ausente',
          message: 'Workflows usados como ferramentas de Agentes LLM devem ter um nó "instructions" no início para servir de Tool Spec.',
          location: 'workflow.flow',
          fixSuggestion: 'Adicione um nó "instructions" no topo do flow com a docstring dos argumentos.'
        });
        workflowScore -= 10;
      }

      if (!hasRouteReturn) {
        issues.push({
          type: 'warning',
          title: 'Nó "route_return" ausente',
          message: 'O workflow deve terminar com um nó "route_return" para devolver a resposta à LLM ou ao canal.',
          location: 'workflow.flow',
          fixSuggestion: 'Adicione um nó "route_return" com "{{#tojson}}{{variavel_final}}{{/tojson}}".'
        });
        workflowScore -= 10;
      }
    }
  }

  // --- 3. AGENT <-> WORKFLOW HARMONY ---
  if (docstringArgsMatched.length > 0) {
    const unmappedArgs = docstringArgsMatched.filter(a => !a.inAgentRules);
    if (unmappedArgs.length > 0) {
      issues.push({
        type: 'info',
        title: 'Argumentos do Workflow não mapeados no Agente',
        message: `Os seguintes argumentos da docstring do workflow não foram encontrados explicitamente nas regras do agente: ${unmappedArgs.map(u => u.argName).join(', ')}.`,
        location: 'integration',
        fixSuggestion: 'Garanta que o Agente tenha instrução para coletar estes campos e passá-los para a ferramenta.'
      });
    }
  }

  const isValid = issues.filter(i => i.type === 'error').length === 0;

  return {
    isValid,
    agentScore: Math.max(0, Math.min(100, agentScore)),
    workflowScore: Math.max(0, Math.min(100, workflowScore)),
    issues,
    variableTraces,
    routingTokensDetected,
    docstringArgsMatched
  };
}
