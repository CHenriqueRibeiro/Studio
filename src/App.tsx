import React, { useState, useRef } from 'react';
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
  DEFAULT_WORKFLOW_SCHEMA_TEMPLATE 
} from './data/forticsStandards';
import { validateForticsAgentAndWorkflow } from './utils/forticsValidator';
import { Navbar } from './components/Navbar';
import { StudioBuilder } from './components/StudioBuilder';
import { JsonInspector } from './components/JsonInspector';
import { FlowstreamConverter } from './components/FlowstreamConverter';
import { CheckCircle2, AlertCircle, Sparkles, ChevronDown, Code2 } from 'lucide-react';

export default function App() {
  const [appTab, setAppTab] = useState<'builder' | 'converter'>('builder');

  // Current loaded Agent and Workflows
  const [agent, setAgent] = useState<ForticsAgent>(DEFAULT_AGENT_SCHEMA_TEMPLATE);
  const [workflow, setWorkflow] = useState<ForticsWorkflow>(DEFAULT_WORKFLOW_SCHEMA_TEMPLATE);
  const [workflows, setWorkflows] = useState<ForticsWorkflow[]>([DEFAULT_WORKFLOW_SCHEMA_TEMPLATE]);
  const [hasGenerated, setHasGenerated] = useState<boolean>(false);
  const [showJsonSection, setShowJsonSection] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [variableChainSummary, setVariableChainSummary] = useState<string>(
    '1. O SZ Omnichannel injeta {{nome}}, {{telefone}} e {{cpf}}.\n2. O Agente identifica o problema e confirma os dados.\n3. O Agente dispara a tool gerando payload com dados sanitizados.\n4. O nó Code (name: "request") desempacota _vars._request.body.\n5. O nó REST envia a requisição utilizando {{request.campo}}.\n6. O nó route_return devolve o JSON estruturado para o Agente.'
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastStudioMode, setLastStudioMode] = useState<'both' | 'workflow_only' | 'agent_only'>('both');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Compute live validation
  const validationReport: ValidationReport = validateForticsAgentAndWorkflow(agent, workflow);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
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
        const err = await res.json();
        throw new Error(err.error || 'Erro ao gerar schemas Fortics.');
      }

      const data: GenerationResponse = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Falha na resposta do motor de IA.');
      }

      setAgent(data.agent);
      setWorkflow(data.workflow);
      if (data.workflows && data.workflows.length > 0) {
        setWorkflows(data.workflows);
      } else {
        setWorkflows([data.workflow]);
      }

      if (data.variableChainSummary) {
        setVariableChainSummary(data.variableChainSummary);
      }

      setHasGenerated(true);
      setShowJsonSection(true);

      // Celebrate with confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      const count = data.workflows?.length || 1;
      showToast('success', `Agente e ${count} Workflow(s) gerados! Role abaixo para ver os JSONs.`);

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } catch (error: any) {
      console.error('Generation error:', error);
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
      }, idx * 400);
    });
    showToast('success', `Iniciando download de ${list.length} workflow(s) individuais!`);
  };

  const handleDownloadBoth = () => {
    handleDownloadAgent();
    setTimeout(() => {
      handleDownloadAllWorkflows();
    }, 500);
  };

  const scrollToResults = () => {
    setShowJsonSection(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-800'
              : 'bg-cyan-950/90 text-cyan-300 border-cyan-800'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Navigation Bar */}
      <Navbar 
        activeTab={appTab}
        onSelectTab={setAppTab}
      />

      {/* Unified Screen Flow */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-8">
        
        {appTab === 'converter' ? (
          /* Total.js / Flowstream Converter Tab */
          <FlowstreamConverter 
            onWorkflowsConverted={(newWfs) => {
              if (newWfs.length > 0) {
                setWorkflows(newWfs);
                setWorkflow(newWfs[0]);
              }
            }}
            showToast={showToast}
          />
        ) : (
          /* Main Studio Builder Tab */
          <>
            {/* 1. Main Configuration Form Screen */}
            <section className="bg-slate-900/50 border border-slate-800/90 rounded-3xl overflow-hidden shadow-xl">
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
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 text-sm font-bold shadow-lg transition-all cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Ver JSONs Gerados e Validação Fortics</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 2. Results Section (Liberada Abaixo da Tela Principal após Gerar) */}
            {showJsonSection && (
              <section 
                ref={resultsRef}
                id="resultados-json" 
                className="space-y-4 pt-4 border-t border-slate-800 animate-fadeIn"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Code2 className="w-5 h-5 text-emerald-400" />
                      <span>JSONs Gerados</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Arquivos prontos para importar diretamente no seu painel.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadBoth}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Baixar Tudo</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 border border-slate-800/90 rounded-3xl overflow-hidden shadow-2xl">
                  <JsonInspector
                    agent={agent}
                    workflow={workflow}
                    workflows={workflows}
                    validationReport={validationReport}
                    onUpdateAgent={setAgent}
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

      {/* Clean Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-5 px-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <span className="font-semibold text-slate-400">Fortics Studio</span>
        </div>
      </footer>

    </div>
  );
}
