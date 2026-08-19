import React, { useState } from 'react';
import { 
  SYSTEM_SZ_VARIABLES_INFO, 
  STANDARD_ROUTING_TOKENS,
  MANUAL_AGENTE_BOAS_PRATICAS,
  MANUAL_WORKFLOW_BOAS_PRATICAS
} from '../data/forticsStandards';
import { 
  BookOpen, 
  CheckCircle2, 
  Tag, 
  Database, 
  Copy, 
  Check, 
  UploadCloud, 
  Workflow,
  Bot,
  Zap,
  Code2,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';

interface TemplatesAndManualsProps {
  onSelectTemplate?: (templateId: string) => void;
}

export const TemplatesAndManuals: React.FC<TemplatesAndManualsProps> = () => {
  const [activeTab, setActiveTab] = useState<'importar' | 'exemplos' | 'tags_vars' | 'manuais'>('importar');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="py-6 px-4 sm:px-8 lg:px-12 w-full max-w-[1700px] mx-auto space-y-6">

      {/* Header Banner */}
      <div className="bg-[#061833]/80 rounded-3xl p-6 sm:p-8 border border-[#0066FF]/30 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#020b18] border border-[#0066FF]/40 rounded-2xl text-[#00D2FF] shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Guia Prático: Exemplos de Bom Uso &amp; Como Importar no Fortics
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
            Aprenda o passo a passo de como importar o <strong>workflow.json</strong> e o <strong>agente.json</strong> na plataforma Fortics, além de diretrizes de engenharia de prompts, tratamento de dados e variáveis.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-[#020b18] rounded-full border border-[#0066FF]/30 text-xs font-semibold self-start lg:self-center shadow-md">
          <button
            type="button"
            onClick={() => setActiveTab('importar')}
            className={`px-4 sm:px-5 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'importar' ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/40' : 'text-slate-300 hover:text-white hover:bg-[#0066FF]/10'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Como Importar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('exemplos')}
            className={`px-4 sm:px-5 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'exemplos' ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/40' : 'text-slate-300 hover:text-white hover:bg-[#0066FF]/10'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Exemplos de Bom Uso</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tags_vars')}
            className={`px-4 sm:px-5 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tags_vars' ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/40' : 'text-slate-300 hover:text-white hover:bg-[#0066FF]/10'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Tags # e Variáveis SZ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manuais')}
            className={`px-4 sm:px-5 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'manuais' ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/40' : 'text-slate-300 hover:text-white hover:bg-[#0066FF]/10'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Manuais Oficiais Fortics</span>
          </button>
        </div>
      </div>

      {/* 1. ABA: COMO IMPORTAR NO FORTICS */}
      {activeTab === 'importar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Passo a Passo: Workflow */}
            <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-lg">
              <div className="flex items-center gap-3.5 border-b border-[#0066FF]/20 pb-4">
                <div className="p-3 bg-[#020b18] border border-[#0066FF]/40 rounded-2xl text-[#00D2FF]">
                  <Workflow className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">1. Como Importar o Workflow (.json)</h3>
                  <span className="text-xs text-[#00D2FF] font-medium">No Fortics Studio &gt; Workflows</span>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="flex gap-3.5 items-start">
                  <span className="w-7 h-7 rounded-full bg-[#0066FF] flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">1</span>
                  <div>
                    <strong className="text-white block text-sm">Baixe o arquivo JSON:</strong>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Após gerar no estúdio, clique em <strong>"Baixar workflow.json"</strong> (ou baixe cada workflow individual caso tenha gerado no modo modular).</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <span className="w-7 h-7 rounded-full bg-[#0066FF] flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">2</span>
                  <div>
                    <strong className="text-white block text-sm">Acesse o Fortics Studio:</strong>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">No menu lateral, vá em <strong>Workflows &gt; Criar Novo &gt; Opções &gt; Importar Workflow</strong>.</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <span className="w-7 h-7 rounded-full bg-[#0066FF] flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">3</span>
                  <div>
                    <strong className="text-white block text-sm">Faça o upload do JSON:</strong>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Selecione o arquivo baixado. Todos os nós (Instructions, Code de request, REST e Retorno) serão carregados com os parâmetros configurados.</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <span className="w-7 h-7 rounded-full bg-[#0066FF] flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">4</span>
                  <div>
                    <strong className="text-white block text-sm">Salve e Ative:</strong>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Clique em <strong>Salvar</strong> e confirme se a opção <em>Habilitado</em> está marcada.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Passo a Passo: Agente */}
            <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-lg">
              <div className="flex items-center gap-3.5 border-b border-[#0066FF]/20 pb-4">
                <div className="p-3 bg-[#020b18] border border-[#0066FF]/40 rounded-2xl text-[#25D366]">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">2. Como Importar o Agente (.json)</h3>
                  <span className="text-xs text-emerald-400 font-medium">No Fortics Agentes &gt; IA</span>
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="flex gap-3.5 items-start">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">1</span>
                  <div>
                    <strong className="text-white block text-sm">Baixe o agente.json:</strong>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Clique em <strong>"Baixar agente.json"</strong> ou copie os Passos e Regras da aba de Inspeção de JSON.</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">2</span>
                  <div>
                    <strong className="text-white block text-sm">Acesse o Módulo de Agentes:</strong>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">No menu lateral, vá em <strong>Agentes de IA &gt; Novo Agente &gt; Importar JSON</strong>.</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">3</span>
                  <div>
                    <strong className="text-white block text-sm">Vincule as Ferramentas (Tools):</strong>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Na aba de <strong>Ferramentas / Integrações</strong> do Agente, selecione os Workflows importados.</p>
                  </div>
                </div>

                <div className="flex gap-3.5 items-start">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shrink-0 text-xs shadow-md">4</span>
                  <div>
                    <strong className="text-white block text-sm">Pronto para Testar:</strong>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Inicie o atendimento de testes no chat para validar o fluxo do cumprimento até a resposta da API.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Fluxograma Visual de Funcionamento */}
          <div className="bg-[#020b18] border border-[#0066FF]/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-md">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#00D2FF] flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Como a Esteira de Execução Funciona no Fortics (Chat &lt;--&gt; Workflow)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
              <div className="p-4 bg-[#040f24] border border-[#0066FF]/25 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-[#0066FF]/20 text-[#00D2FF] rounded-md font-mono">1. Chat</span>
                <p className="text-sm font-bold text-white">Cliente Envia Dados</p>
                <p className="text-xs text-slate-400 leading-relaxed">O cliente digita CPF, documento ou código na conversa.</p>
              </div>

              <div className="p-4 bg-[#040f24] border border-[#0066FF]/25 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-md font-mono">2. Agente</span>
                <p className="text-sm font-bold text-white">Dispara a Ferramenta</p>
                <p className="text-xs text-slate-400 leading-relaxed">O Agente empacota os parâmetros e chama o Workflow correspondente.</p>
              </div>

              <div className="p-4 bg-[#040f24] border border-[#0066FF]/25 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-md font-mono">3. Code "request"</span>
                <p className="text-sm font-bold text-white">Extrai os Parâmetros</p>
                <p className="text-xs text-slate-400 leading-relaxed">O nó Code desempacota <code className="text-amber-300 font-mono">_vars._request.body</code>.</p>
              </div>

              <div className="p-4 bg-[#040f24] border border-[#0066FF]/25 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-md font-mono">4. REST + Tratar</span>
                <p className="text-sm font-bold text-white">Consome API &amp; Trata</p>
                <p className="text-xs text-slate-400 leading-relaxed">Envia a requisição HTTP e higieniza o JSON no nó Code pós-REST.</p>
              </div>

              <div className="p-4 bg-[#040f24] border border-emerald-500/30 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-md font-mono">5. Retorno</span>
                <p className="text-sm font-bold text-white">Agente Responde</p>
                <p className="text-xs text-slate-400 leading-relaxed">O nó <code className="text-emerald-300 font-mono">route_return</code> devolve os dados para o Agente falar no chat.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA: EXEMPLOS DE BOM USO */}
      {activeTab === 'exemplos' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">

            {/* Exemplo 1 */}
            <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-lg uppercase">
                    Exemplo 1
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">Autenticação + Consulta Encadeada</h4>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Bom Uso (Padrão Recomendado):</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Quando o fluxo tem 2 integrações (ex: 1ª busca cliente e retorna ID; 2ª busca faturas pelo ID), o Agente <strong>exibe o ID localizado na conversa</strong> (ex: <em>"Localizei seu cadastro! Seu ID é 5542."</em>) para fixar a variável no histórico antes de chamar a 2ª ferramenta.
                  </p>
                </div>

                <div className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>O que Evitar:</span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Chamar a 2ª ferramenta sem ter certeza de que a 1ª retornou dados válidos ou sem registrar o ID no diálogo com o cliente.
                  </p>
                </div>
              </div>
            </div>

            {/* Exemplo 2 */}
            <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-lg uppercase">
                    Exemplo 2
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">Validação Rigorosa de Documentos (CPF / CNPJ)</h4>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Bom Uso (Padrão Recomendado):</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Nas regras (<em>other_rules</em>), oriente o robô a aceitar o CPF tanto formatado (XXX.XXX.XXX-XX) quanto apenas números (11 dígitos). Valide se todos os dígitos foram enviados antes de acionar a API.
                  </p>
                </div>

                <div className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>O que Evitar:</span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Disparar a ferramenta HTTP com parâmetros vazios, nomes ou valores incompletos fornecidos pelo cliente.
                  </p>
                </div>
              </div>
            </div>

            {/* Exemplo 3 */}
            <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-lg uppercase">
                    Exemplo 3
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">Transbordo Inteligente e Anti-Alucinação</h4>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Bom Uso (Padrão Recomendado):</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Se o cliente solicitar atendente humano, devolva estritamente a tag de roteamento correspondente (ex: <code className="text-amber-300 font-mono">#SUPORTE_HUMANO</code> ou <code className="text-amber-300 font-mono">#FINANCEIRO</code>). Se a API retornar vazio, diga com clareza que nenhum registro foi localizado.
                  </p>
                </div>

                <div className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>O que Evitar:</span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    O robô inventar números de protocolo fictícios, valores ou respostas que não vieram do backend.
                  </p>
                </div>
              </div>
            </div>

            {/* Exemplo 4 */}
            <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold rounded-lg uppercase">
                    Exemplo 4
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">Nó de Instruções do Workflow (Prompt Extension)</h4>
                </div>

                <div className="p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Bom Uso (Padrão Recomendado):</span>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    O nó <strong>instructions</strong> deve conter: 1ª linha com o Título, 2ª linha com a Descrição da função, seção <code className="text-cyan-300 font-mono">Args:</code> listando tipo e finalidade de cada argumento e seção <code className="text-cyan-300 font-mono">Returns:</code> com o dict tratado.
                  </p>
                </div>

                <div className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-2xl space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>O que Evitar:</span>
                  </div>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    Criar múltiplos nós de instructions no mesmo workflow ou deixar o campo vazio sem a especificação de Args.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. ABA: TAGS # E VARIÁVEIS SZ */}
      {activeTab === 'tags_vars' && (
        <div className="space-y-6">
          {/* Tags de Roteamento */}
          <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tag className="w-5 h-5 text-[#00D2FF]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Tags de Roteamento e Transbordo Fortics (#)
                </h3>
              </div>
              <span className="text-xs text-slate-400">Clique para copiar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {STANDARD_ROUTING_TOKENS.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => copyToClipboard(item.token, `token-${idx}`)}
                  className="p-4 bg-[#020b18] border border-[#0066FF]/25 hover:border-[#00D2FF] rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="text-xs sm:text-sm font-mono font-bold text-amber-300 group-hover:text-amber-200">
                      {item.token}
                    </span>
                    <p className="text-xs text-slate-300">{item.description}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-[#061833] text-slate-400 group-hover:text-[#00D2FF]">
                    {copiedToken === `token-${idx}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Variáveis Injetadas SZ */}
          <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-7 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-[#00D2FF]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Variáveis de Contexto Injetadas pelo SZ Omnichannel
                </h3>
              </div>
              <span className="text-xs text-slate-400">Clique para copiar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {SYSTEM_SZ_VARIABLES_INFO.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => copyToClipboard(item.name, `sz-${idx}`)}
                  className="p-4 bg-[#020b18] border border-[#0066FF]/25 hover:border-[#00D2FF] rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-sm"
                >
                  <div className="space-y-1">
                    <span className="text-xs sm:text-sm font-mono font-bold text-[#00D2FF] group-hover:text-cyan-200">
                      {item.name}
                    </span>
                    <p className="text-xs text-slate-300">{item.description}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-[#061833] text-slate-400 group-hover:text-[#00D2FF]">
                    {copiedToken === `sz-${idx}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. ABA: MANUAIS COMPLETOS */}
      {activeTab === 'manuais' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2.5 border-b border-[#0066FF]/20 pb-3">
              <Bot className="w-5 h-5 text-[#00D2FF]" />
              <span>Manual de Boas Práticas do Agente (6 Dimensões)</span>
            </h3>
            <div className="bg-[#020b18] border border-[#0066FF]/25 rounded-2xl p-5 text-xs font-mono text-slate-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {MANUAL_AGENTE_BOAS_PRATICAS}
            </div>
          </div>

          <div className="bg-[#061833]/70 border border-[#0066FF]/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-lg">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2.5 border-b border-[#0066FF]/20 pb-3">
              <Workflow className="w-5 h-5 text-[#00D2FF]" />
              <span>Manual de Boas Práticas do Workflow (Nós &amp; Scripts)</span>
            </h3>
            <div className="bg-[#020b18] border border-[#0066FF]/25 rounded-2xl p-5 text-xs font-mono text-slate-300 max-h-[500px] overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {MANUAL_WORKFLOW_BOAS_PRATICAS}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
