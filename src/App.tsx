import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ForticsAgent,
  ForticsWorkflow,
  GenerationRequest,
  GenerationResponse,
  ValidationReport
} from './types/fortics';
import {
  DEFAULT_AGENT_SCHEMA_TEMPLATE,
  DEFAULT_WORKFLOW_SCHEMA_TEMPLATE,
  TEMPLATES_LIBRARY
} from './data/forticsStandards';
import { validateForticsAgentAndWorkflow } from './utils/forticsValidator';
import { Navbar, AppTabType } from './components/Navbar';
import { StudioBuilder } from './components/StudioBuilder';
import { JsonInspector } from './components/JsonInspector';
import { FlowstreamConverter } from './components/FlowstreamConverter';
import { TemplatesAndManuals } from './components/TemplatesAndManuals';
import { CheckCircle2, AlertCircle, Sparkles, ChevronDown, Code2, ShieldCheck, Download, ArrowUpRight, Zap } from 'lucide-react';

export default function App() {
  const [appTab, setAppTab] = useState<AppTabType>('builder');

  // Global Theme: 'dark' (Default) vs 'light' (Branco)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('fortics_studio_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('fortics_studio_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.style.colorScheme = 'light';
    } else {
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      document.documentElement.style.colorScheme = 'dark';
    }
  }, [theme]);

  // Current loaded Agent and Workflows backed by sessionStorage
  const [agent, setAgent] = useState<ForticsAgent>(() => {
    try {
      const saved = sessionStorage.getItem('fortics_current_agent');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_AGENT_SCHEMA_TEMPLATE;
  });

  const [agents, setAgents] = useState<ForticsAgent[]>(() => {
    try {
      const saved = sessionStorage.getItem('fortics_current_agents');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const [workflow, setWorkflow] = useState<ForticsWorkflow>(() => {
    try {
      const saved = sessionStorage.getItem('fortics_current_workflow');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_WORKFLOW_SCHEMA_TEMPLATE;
  });

  const [workflows, setWorkflows] = useState<ForticsWorkflow[]>(() => {
    try {
      const saved = sessionStorage.getItem('fortics_current_workflows');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [DEFAULT_WORKFLOW_SCHEMA_TEMPLATE];
  });

  const [hasGenerated, setHasGenerated] = useState<boolean>(() => {
    return sessionStorage.getItem('fortics_has_generated') === 'true';
  });

  const [showJsonSection, setShowJsonSection] = useState<boolean>(() => {
    return sessionStorage.getItem('fortics_show_json') === 'true';
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('fortics_current_agent', JSON.stringify(agent));
    } catch (_) {}
  }, [agent]);

  useEffect(() => {
    try {
      sessionStorage.setItem('fortics_current_workflow', JSON.stringify(workflow));
    } catch (_) {}
  }, [workflow]);

  useEffect(() => {
    try {
      sessionStorage.setItem('fortics_current_workflows', JSON.stringify(workflows));
    } catch (_) {}
  }, [workflows]);

  useEffect(() => {
    sessionStorage.setItem('fortics_has_generated', String(hasGenerated));
    sessionStorage.setItem('fortics_show_json', String(showJsonSection));
  }, [hasGenerated, showJsonSection]);

  const resultsRef = useRef<HTMLDivElement>(null);

  const [variableChainSummary, setVariableChainSummary] = useState<string>(
    '1. O SZ Omnichannel injeta {{nome}}, {{telefone}} e {{cpf}}.\n2. O Agente identifica o problema e confirma os dados.\n3. O Agente dispara a tool gerando payload com dados sanitizados.\n4. O nó Code (name: "request") desempacota _vars._request.body.\n5. O nó REST envia a requisição utilizando {{request.campo}}.\n6. O nó route_return devolve o JSON estruturado para o Agente.'
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastStudioMode, setLastStudioMode] = useState<'both' | 'workflow_only'>('both');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Compute live validation
  const validationReport: ValidationReport = validateForticsAgentAndWorkflow(agent, workflow);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSelectTemplate = (templateId: string) => {
    const tpl = TEMPLATES_LIBRARY.find(t => t.id === templateId);
    if (!tpl) return;

    setAgent(tpl.sampleAgent as ForticsAgent);
    setWorkflow(tpl.sampleWorkflow as ForticsWorkflow);
    setWorkflows([tpl.sampleWorkflow as ForticsWorkflow]);
    setHasGenerated(true);
    setShowJsonSection(true);
    setAppTab('builder');
    showToast('success', `Template "${tpl.title}" carregado com sucesso!`);

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleGenerate = async (req: GenerationRequest) => {
    setIsGenerating(true);
    if (req.studioMode) {
      setLastStudioMode(req.studioMode);
    }
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });

      if (!res.ok) {
        let errorMsg = `Erro na requisição (${res.status} ${res.statusText || 'Erro no servidor'})`;
        try {
          const err = await res.json();
          errorMsg = err.details || err.error || err.message || errorMsg;
        } catch {
          try {
            const rawText = await res.text();
            if (rawText && rawText.trim().length > 0) {
              const cleanText = rawText.replace(/<[^>]*>?/gm, '').trim();
              if (cleanText) {
                errorMsg += `: ${cleanText.slice(0, 200)}`;
              }
            }
          } catch (_) {
            // ignore text parsing error
          }
        }
        throw new Error(errorMsg);
      }

      let data: GenerationResponse;
      try {
        data = await res.json();
      } catch (jsonErr: any) {
        throw new Error(`Resposta inválida do servidor: ${jsonErr.message}`);
      }

      if (data.agents && data.agents.length > 0) {
        setAgents(data.agents);
        setAgent(data.agents[0]);
      } else if (data.agent) {
        setAgent(data.agent);
        setAgents([data.agent]);
      }

      if (data.workflows && data.workflows.length > 0) {
        setWorkflows(data.workflows);
        setWorkflow(data.workflows[0]);
      } else if (data.workflow) {
        setWorkflow(data.workflow);
        setWorkflows([data.workflow]);
      }

      if (data.variableChainSummary) {
        setVariableChainSummary(data.variableChainSummary);
      }

      setHasGenerated(true);
      setShowJsonSection(true);

      // Trigger celebrate confetti
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#0066FF', '#00D2FF', '#25D366', '#ffffff']
        });
      } catch (e) {
        // Ignore in environments without canvas
      }

      showToast('success', data.summary || 'Agente e Workflows gerados com rigor técnico Fortics!');

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);

    } catch (error: any) {
      console.error(error);
      showToast('error', error.message || 'Erro inesperado durante a geração.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAgent = () => {
    if (!agent) {
      showToast('error', 'Nenhum agente disponível para download.');
      return;
    }
    const blob = new Blob([JSON.stringify(agent, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'agente.json');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
    showToast('success', 'agente.json baixado! Importe em Agentes -> Importar');
  };

  const handleDownloadWorkflow = (wfToDownload?: ForticsWorkflow) => {
    const targetWf = wfToDownload || workflow;
    if (!targetWf) {
      showToast('error', 'Nenhum workflow disponível para download.');
      return;
    }
    const safeName = (targetWf.name || 'workflow')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    const blob = new Blob([JSON.stringify(targetWf, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${safeName}.json`);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
    showToast('success', `${safeName}.json baixado! Importe em Workflows -> Importar`);
  };

  const handleDownloadAllWorkflows = () => {
    const list = workflows.length > 0 ? workflows : [workflow];
    list.forEach((wf, idx) => {
      setTimeout(() => {
        handleDownloadWorkflow(wf);
      }, idx * 300);
    });
    showToast('success', `Iniciando download de ${list.length} workflow(s) individuais!`);
  };

  const handleDownloadBoth = () => {
    handleDownloadAgent();
    setTimeout(() => {
      handleDownloadAllWorkflows();
    }, 400);
  };

  const scrollToResults = () => {
    setShowJsonSection(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#020b18] text-slate-100 flex flex-col selection:bg-[#0066FF] selection:text-white font-sans">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-fadeIn">
          <div className={`px-4 py-3 rounded-full shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-xl ${toastMessage.type === 'success'
              ? 'bg-[#061833]/95 text-[#00D2FF] border-[#0066FF]/60 shadow-[#0066FF]/30'
              : toastMessage.type === 'error'
                ? 'bg-rose-950/95 text-rose-300 border-rose-700/80 shadow-rose-950/50'
                : 'bg-[#020b18]/95 text-slate-200 border-[#0066FF]/40 shadow-[#0066FF]/20'
            }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#00D2FF] shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-[#0066FF] shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={appTab}
        onSelectTab={setAppTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-8 lg:px-12 py-6 space-y-8 animate-fadeIn">

        {appTab === 'templates' ? (
          /* Templates & Manuals Tab */
          <section className="bg-[#061325]/70 border border-[#0066FF]/20 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
            <TemplatesAndManuals
              onSelectTemplate={handleSelectTemplate}
            />
          </section>
        ) : appTab === 'converter' ? (
          /* Total.js / Flowstream Converter Tab */
          <section className="bg-[#061325]/70 border border-[#0066FF]/20 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
            <FlowstreamConverter
              onGenerate={async (req) => {
                await handleGenerate(req);
                setAppTab('builder');
                setTimeout(() => {
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 300);
              }}
              isGenerating={isGenerating}
              showToast={showToast}
            />
          </section>
        ) : (
          /* Main Studio Builder Tab */
          <>
            {/* 1. Main Configuration Form Screen */}
            <section className="bg-[#061325]/70 border border-[#0066FF]/20 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
              <StudioBuilder
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                currentAgent={agent}
                currentWorkflow={workflow}
              />
            </section>

            {/* Quick View Button if not yet scrolled or to reveal JSON */}
            {hasGenerated && !showJsonSection && (
              <div className="text-center py-2">
                <button
                  onClick={scrollToResults}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#061833] hover:bg-[#0066FF]/20 border border-[#0066FF]/50 text-[#00D2FF] text-sm font-bold shadow-xl transition-all cursor-pointer hover:scale-105"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Ver JSONs Gerados</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 2. Results Section (Liberada Abaixo da Tela Principal após Gerar) */}
            {showJsonSection && (
              <section
                ref={resultsRef}
                id="resultados-json"
                className="space-y-4 pt-6 border-t border-[#0066FF]/20 animate-fadeIn"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                      <Code2 className="w-5 h-5 text-[#00D2FF]" />
                      <span>{lastStudioMode === 'workflow_only' ? 'Workflows Oficiais Fortics' : 'Resultados e JSONs Oficiais Fortics'}</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {lastStudioMode === 'workflow_only'
                        ? 'Arquivos workflow.json no padrão oficial 2026 prontos para importação no Fortics Omnichannel.'
                        : 'Arquivos no padrão oficial 2026 para importar diretamente no painel Fortics Omnichannel (Agentes e Workflows).'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {lastStudioMode !== 'workflow_only' && (
                      <button
                        onClick={handleDownloadAgent}
                        className="px-4 py-2 bg-[#061833] hover:bg-[#0066FF]/20 text-slate-200 border border-[#0066FF]/40 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-[#00D2FF]" />
                        <span>Baixar agente.json</span>
                      </button>
                    )}

                    <button
                      onClick={handleDownloadAllWorkflows}
                      className="px-4 py-2 bg-[#061833] hover:bg-[#0066FF]/20 text-slate-200 border border-[#0066FF]/40 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00D2FF]" />
                      <span>Baixar Workflows ({workflows.length})</span>
                    </button>
                  </div>
                </div>

                <div className="bg-[#061325]/70 border border-[#0066FF]/20 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
                  <JsonInspector
                    agent={agent}
                    agents={agents}
                    workflow={workflow}
                    workflows={workflows}
                    validationReport={validationReport}
                    onUpdateAgent={setAgent}
                    onUpdateAgents={setAgents}
                    onUpdateWorkflow={setWorkflow}
                    onUpdateWorkflows={setWorkflows}
                    variableChainSummary={variableChainSummary}
                    studioMode={lastStudioMode}
                  />
                </div>
              </section>
            )}
          </>
        )}

      </main>

      {/* Minimal Footer */}
      <footer className="bg-[#010710] border-t border-[#0066FF]/15 py-5 px-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0066FF]"></span>
            <span className="font-bold text-slate-300">Fortics Studio</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
