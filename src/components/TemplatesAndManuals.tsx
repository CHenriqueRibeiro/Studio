import React, { useState } from 'react';
import { 
  TEMPLATES_LIBRARY, 
  SYSTEM_SZ_VARIABLES_INFO, 
  STANDARD_ROUTING_TOKENS,
  MANUAL_AGENTE_BOAS_PRATICAS,
  MANUAL_WORKFLOW_BOAS_PRATICAS
} from '../data/forticsStandards';
import { 
  BookOpen, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Tag, 
  Database, 
  ArrowRight, 
  Copy, 
  Check, 
  Compass, 
  Cpu,
  BrainCircuit,
  Search
} from 'lucide-react';

interface TemplatesAndManualsProps {
  onSelectTemplate: (templateId: string) => void;
}

export const TemplatesAndManuals: React.FC<TemplatesAndManualsProps> = ({
  onSelectTemplate
}) => {
  const [activeSection, setActiveSection] = useState<'templates' | 'manual-agent' | 'manual-workflow' | 'antihallucination' | 'szvars'>('templates');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const copyToken = (tok: string) => {
    navigator.clipboard.writeText(tok);
    setCopiedToken(tok);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredTemplates = TEMPLATES_LIBRARY.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>Biblioteca de Templates & Guia Oficial Fortics IA 2026</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Templates pré-configurados prontos para importação e documentação completa de engenharia de prompts, MONO SKILL, 6 dimensões e anti-alucinação.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-950/60 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveSection('templates')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeSection === 'templates' ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Templates Oficiais
          </button>
          <button
            onClick={() => setActiveSection('antihallucination')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeSection === 'antihallucination' ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Anti-Alucinação & 7 Causas
          </button>
          <button
            onClick={() => setActiveSection('szvars')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeSection === 'szvars' ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Variáveis SZ & Tokens #
          </button>
          <button
            onClick={() => setActiveSection('manual-agent')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeSection === 'manual-agent' ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Agente (6 Dimensões)
          </button>
          <button
            onClick={() => setActiveSection('manual-workflow')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeSection === 'manual-workflow' ? 'bg-emerald-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual Workflows & Nós
          </button>
        </div>
      </div>

      {/* 1. TEMPLATES SECTION */}
      {activeSection === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar templates por área, título ou recurso..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              {filteredTemplates.length} templates disponíveis
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredTemplates.map((tpl) => (
              <div 
                key={tpl.id}
                className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                      {tpl.category}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {tpl.badge}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {tpl.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="pt-2 text-[11px] text-slate-400 space-y-1 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono">
                    <div><strong>Agente:</strong> {tpl.sampleAgent.name}</div>
                    <div><strong>Workflow:</strong> {tpl.sampleWorkflow.name} ({tpl.sampleWorkflow.flow.length} nós)</div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <button
                    onClick={() => onSelectTemplate(tpl.id)}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Carregar no Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ANTI-HALLUCINATION & 7 CAUSES SECTION */}
      {activeSection === 'antihallucination' && (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Por que os Agentes Alucinam? As 7 Causas Mais Comuns (Fortics Docs)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-rose-400">1. Tarefa sem conteúdo</span>
                <p className="text-xs text-slate-300">Agente sem base de conhecimento ou ferramenta tenta inventar respostas.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-rose-400">2. Criatividade muito alta</span>
                <p className="text-xs text-slate-300">Temperatura elevada = mais criativo, menos factual. Mantenha em 0.0.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-rose-400">3. Múltiplas tarefas (Quebra de MONO SKILL)</span>
                <p className="text-xs text-slate-300">Sobrecarga de instruções conflitantes no mesmo agente gera comportamento errático.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-rose-400">4. Persona mal definida</span>
                <p className="text-xs text-slate-300">Sem identidade clara e limites do que PODE e NÃO PODE, a IA improvisa.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-rose-400">5. Roteiro ambíguo</span>
                <p className="text-xs text-slate-300">Passos vagos permitem que o LLM interprete livremente e pule validações.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-rose-400">6. Sem regras de contenção</span>
                <p className="text-xs text-slate-300">Sem dizer o que NÃO fazer, o agente responde sobre qualquer assunto externo.</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-rose-400">7. Dados dinâmicos sem ressalva</span>
                <p className="text-xs text-slate-300">Preços/estoques mudam; passe sempre com ressalva "valores sujeitos a alteração".</p>
              </div>
            </div>
          </div>

          {/* 6 Anti-Hallucination Guardrails */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>As 6 Regras Anti-Alucinação Implementadas pelo Fortics Studio</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block uppercase font-bold text-[11px]">ESCOPO</strong>
                <p className="text-slate-300">"Responda SOMENTE sobre [tema]. Para outros, indique o canal."</p>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block uppercase font-bold text-[11px]">DADOS DINÂMICOS</strong>
                <p className="text-slate-300">"Para preços e prazos, consulte a base ou Workflow. NUNCA assuma valores."</p>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block uppercase font-bold text-[11px]">INCERTEZA</strong>
                <p className="text-slate-300">"Quando não souber: declare 'Não tenho essa informação no momento'."</p>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block uppercase font-bold text-[11px]">DADOS SENSÍVEIS</strong>
                <p className="text-slate-300">"NUNCA solicite senhas de acesso ou dados bancários privados."</p>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block uppercase font-bold text-[11px]">CONFIRMAÇÃO EXPRESSA</strong>
                <p className="text-slate-300">"Antes de registrar, confirme: 'Os dados [X, Y, Z] estão corretos?'"</p>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <strong className="text-emerald-400 block uppercase font-bold text-[11px]">ESCALADA / TRANSBORDO</strong>
                <p className="text-slate-300">"Se o cliente demonstrar frustração, retorne SOMENTE o token #HUMANO."</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SZ CONTEXT VARIABLES & ROUTING TOKENS */}
      {activeSection === 'szvars' && (
        <div className="space-y-6">
          {/* SZ Variables */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Variáveis de Contexto Injetadas pelo SZ Omnichannel</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Injeção Pré-Prompt</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SYSTEM_SZ_VARIABLES_INFO.map((v, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {v.name}
                    </span>
                    <button
                      onClick={() => copyToken(v.name)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      {copiedToken === v.name ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-slate-300">{v.description}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Ex: {v.example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Routing Tokens */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Tokens Oficiais de Roteamento (#) e Transbordo</span>
            </h3>
            <p className="text-xs text-slate-400">
              A LLM deve responder o token SOZINHO sem texto adicional quando a condição de transbordo for satisfeita.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {STANDARD_ROUTING_TOKENS.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {item.token}
                    </span>
                    <button
                      onClick={() => copyToken(item.token)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      {copiedToken === item.token ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. MANUAL AGENTE */}
      {activeSection === 'manual-agent' && (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Manual Oficial: Guia Completo de Agentes Inteligentes (6 Dimensões)</span>
            </h3>
            <button
              onClick={() => copyToken(MANUAL_AGENTE_BOAS_PRATICAS)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedToken === MANUAL_AGENTE_BOAS_PRATICAS ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copiar Manual</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
            {MANUAL_AGENTE_BOAS_PRATICAS}
          </pre>
        </div>
      )}

      {/* 5. MANUAL WORKFLOW */}
      {activeSection === 'manual-workflow' && (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Manual Técnico: Especificação de Grafos de Workflows Fortics</span>
            </h3>
            <button
              onClick={() => copyToken(MANUAL_WORKFLOW_BOAS_PRATICAS)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedToken === MANUAL_WORKFLOW_BOAS_PRATICAS ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copiar Manual</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
            {MANUAL_WORKFLOW_BOAS_PRATICAS}
          </pre>
        </div>
      )}

    </div>
  );
};
