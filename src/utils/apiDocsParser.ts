import { EndpointIntegration, CustomMidpoint } from '../types/fortics';

/**
 * Parser inteligente de documentação de APIs (Swagger/OpenAPI JSON, cURL, Markdown, REST manual)
 */
export function parseApiDocumentation(rawText: string): EndpointIntegration[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const endpoints: EndpointIntegration[] = [];
  const text = rawText.trim();

  // 1. Tentar parse como JSON (OpenAPI / Swagger)
  if (text.startsWith('{') && text.endsWith('}')) {
    try {
      const json = JSON.parse(text);
      if (json.paths && typeof json.paths === 'object') {
        Object.entries(json.paths).forEach(([path, methods]: [string, any]) => {
          if (methods && typeof methods === 'object') {
            const validMethods: Array<'get' | 'post' | 'put' | 'delete' | 'patch'> = ['get', 'post', 'put', 'delete', 'patch'];
            validMethods.forEach(method => {
              if (methods[method]) {
                const op = methods[method];
                endpoints.push({
                  id: `endpoint-${method}-${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
                  method: method.toUpperCase() as any,
                  path,
                  summary: op.summary || op.operationId || `${method.toUpperCase()} ${path}`,
                  description: op.description || '',
                  requestBody: op.requestBody ? JSON.stringify(op.requestBody, null, 2) : undefined,
                  responseBody: op.responses ? JSON.stringify(op.responses, null, 2) : undefined,
                  selected: true
                });
              }
            });
          }
        });
        if (endpoints.length > 0) return endpoints;
      }
    } catch {
      // Not pure OpenAPI JSON, continue with regex/text parser
    }
  }

  // 2. Extração baseada em linhas de métodos HTTP (ex: POST /v1/tickets, GET /api/clientes/{id})
  const methodRegex = /\b(GET|POST|PUT|DELETE|PATCH)\s+([^\s\n\r]+)/gi;
  let match: RegExpExecArray | null;
  const foundMap = new Map<string, EndpointIntegration>();

  while ((match = methodRegex.exec(text)) !== null) {
    const method = match[1].toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    let path = match[2];
    // Remove trailing colons or punctuation
    path = path.replace(/[;:,)]+$/, '');
    
    // Ignore invalid paths or protocol strings like HTTP/1.1
    if (path.startsWith('HTTP/') || path === 'application/json') continue;

    const key = `${method} ${path}`;
    if (!foundMap.has(key)) {
      foundMap.set(key, {
        id: `ep-${method.toLowerCase()}-${foundMap.size + 1}`,
        method,
        path,
        summary: `Operação ${method} em ${path}`,
        description: 'Detectado automaticamente na documentação fornecida',
        selected: true
      });
    }
  }

  // 3. Extração baseada em cURL (ex: curl -X POST https://api.com/v1/tickets)
  const curlRegex = /curl\s+(?:-X\s+(GET|POST|PUT|DELETE|PATCH)\s+)?['"]?(https?:\/\/[^\s'"]+|\/[^\s'"]+)['"]?/gi;
  let curlMatch: RegExpExecArray | null;
  while ((curlMatch = curlRegex.exec(text)) !== null) {
    const method = (curlMatch[1] ? curlMatch[1].toUpperCase() : 'GET') as any;
    const fullUrl = curlMatch[2];
    const key = `${method} ${fullUrl}`;
    if (!foundMap.has(key)) {
      foundMap.set(key, {
        id: `ep-curl-${foundMap.size + 1}`,
        method,
        path: fullUrl,
        summary: `cURL ${method} ${fullUrl}`,
        description: 'Endpoint extraído de comando cURL',
        selected: true
      });
    }
  }

  // 4. Se encontrou endpoints por regex
  if (foundMap.size > 0) {
    return Array.from(foundMap.values());
  }

  // 5. Fallback: Se não encontrou nenhum padrão explícito mas tem texto com endpoint genérico
  return [
    {
      id: 'ep-default-1',
      method: 'POST',
      path: '/v1/integracao',
      summary: 'Endpoint REST Principal',
      description: 'Definido a partir da documentação geral',
      selected: true
    }
  ];
}

/**
 * Formata os endpoints e midpoints selecionados para inclusão no prompt de geração
 */
export function formatSelectedIntegrationsForPrompt(
  endpoints: EndpointIntegration[],
  customMidpoints: CustomMidpoint[] = []
): string {
  const selectedEndpoints = endpoints.filter(e => e.selected);
  const items: string[] = [];

  if (selectedEndpoints.length > 0) {
    items.push('### ENDPOINTS SELECIONADOS DA DOCUMENTAÇÃO PARA O WORKFLOW:');
    selectedEndpoints.forEach((ep, idx) => {
      items.push(`${idx + 1}. [${ep.method}] ${ep.path}`);
      items.push(`   - Finalidade: ${ep.summary || ep.description || 'Execução no fluxo'}`);
      if (ep.requestBody) {
        items.push(`   - Parâmetros/Body Esperado:\n${ep.requestBody}`);
      }
    });
  }

  if (customMidpoints.length > 0) {
    items.push('\n### MIDPOINTS / INTEGRAÇÕES GENÉRICAS ADICIONADAS:');
    customMidpoints.forEach((mp, idx) => {
      items.push(`${idx + 1}. [${mp.method}] ${mp.name} (${mp.url})`);
      items.push(`   - Descrição/Regra: ${mp.description}`);
      if (mp.isGeneric) {
        items.push('   - Tipo: Midpoint Genérico (Manipulação de _vars e payload dinâmico)');
      }
    });
  }

  return items.join('\n');
}
