import React, { useState, useEffect } from 'react';
import { 
  ForticsAgent, 
  ForticsWorkflow, 
  ValidationReport,
  ValidationIssue 
} from '../types/fortics';
import { 
  Code2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Copy, 
  Check, 
  Download, 
  FileCheck, 
  RefreshCw,
  Sparkles,
  GitCommit,
  Tag,
  ArrowRight,
  Database,
  Bot,
  ListOrdered,
  ShieldCheck,
  Edit3,
  Sliders,
  Eye,
  FileText
} from 'lucide-react';
import { validateForticsAgentAndWorkflow } from '../utils/forticsValidator';

interface JsonInspectorProps {
  agent: ForticsAgent | null;
  workflow: ForticsWorkflow | null;
  workflows?: ForticsWorkflow[];
  validationReport: ValidationReport | null;
  onUpdateAgent: (agent: ForticsAgent) => void;
  onUpdateWorkflow: (workflow: ForticsWorkflow) => void;
  onUpdateWorkflows?: (workflows: ForticsWorkflow[]) => void;
  variableChainSummary?: string;
  studioMode?: 'both' | 'workflow_only';
}

export const JsonInspector: React.FC<JsonInspectorProps> = ({
  agent,
  workflow,
  workflows = [],
  validationReport: initialValidation,
  onUpdateAgent,
  onUpdateWorkflow,
  onUpdateWorkflows,
  variableChainSummary,
  studioMode = 'both'
}) => {
  const [activeTab, setActiveTab] = useState<'agent' | 'workflow'>(
    studioMode === 'workflow_only' ? 'workflow' : 'agent'
  );
  const [selectedWfIndex, setSelectedWfIndex] = useState<number>(0);

  useEffect(() => {
    if (studioMode === 'workflow_only') {
      setActiveTab('workflow');
    }
  }, [studioMode]);
  
  // Workflows list (fallback to [workflow] if none provided)
  const currentWorkflowsList: ForticsWorkflow[] = (workflows && workflows.length > 0) 
    ? workflows 
    : (workflow ? [workflow] : []);

  const activeWorkflow = currentWorkflowsList[selectedWfIndex] || workflow;

  const [agentText, setAgentText] = useState<string>('');
  const [workflowText, setWorkflowText] = useState<string>('');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Real-time live validation state
  const [liveValidation, setLiveValidation] = useState<ValidationReport | null>(initialValidation);

  // Agent visual vs raw JSON editing mode
  const [agentViewMode, setAgentViewMode] = useState<'visual' | 'json'>('visual');
  const [agentPromptMode, setAgentPromptMode] = useState<'freeform' | 'structured'>('freeform');
  const [agentFreeformText, setAgentFreeformText] = useState<string>('');

  useEffect(() => {
    if (agent) {
      setAgentText(JSON.stringify(agent, null, 2));
      const stepsFormatted = (agent.instruction?.steps || []).map(s => `- ${s}`).join('\n');
      const rulesFormatted = agent.other_rules || '';
      setAgentFreeformText(`PASSOS DO ATENDIMENTO:\n${stepsFormatted}\n\nREGRAS E DIRETRIZES:\n${rulesFormatted}`);
    }
  }, [agent]);

  const handleAgentFreeformChange = (text: string) => {
    setAgentFreeformText(text);
    if (!agent) return;

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const stepsList: string[] = [];
    const rulesList: string[] = [];
    let isRuleSection = false;

    lines.forEach(line => {
      const lineLower = line.toLowerCase();
      if (lineLower.includes('regra') || lineLower.includes('validação') || lineLower.includes('diretrizes') || lineLower.includes('como fazer') || lineLower.includes('outras regras')) {
        isRuleSection = true;
        return;
      }
      if (lineLower.includes('passo') || lineLower.includes('o que fazer') || lineLower.includes('fluxo') || lineLower.includes('etapa')) {
        isRuleSection = false;
        return;
      }

      if (isRuleSection) {
        rulesList.push(line.startsWith('-') ? line : `- ${line}`);
      } else {
        const cleanStep = line.replace(/^[-*•\d.]+\s*/, '').trim();
        if (cleanStep) stepsList.push(cleanStep);
      }
    });

    const updatedAgent: ForticsAgent = {
      ...agent,
      instruction: {
        ...agent.instruction,
        steps: stepsList.length > 0 ? stepsList : agent.instruction.steps
      },
      other_rules: rulesList.length > 0 ? rulesList.join('\n') : agent.other_rules
    };

    setAgentText(JSON.stringify(updatedAgent, null, 2));
    onUpdateAgent(updatedAgent);
    if (activeWorkflow) {
      setLiveValidation(validateForticsAgentAndWorkflow(updatedAgent, activeWorkflow));
    }
  };

  const handleAgentStructuredFieldChange = (field: 'steps' | 'rules' | 'greetings' | 'objective', value: string) => {
    if (!agent) return;
    let updatedAgent = { ...agent };

    if (field === 'steps') {
      const cleanSteps = value.split('\n').map(s => s.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean);
      updatedAgent.instruction = {
        ...updatedAgent.instruction,
        steps: cleanSteps
      };
      setAgentFreeformText(`PASSOS DO ATENDIMENTO:\n${value}\n\nREGRAS E DIRETRIZES:\n${agent.other_rules}`);
    } else if (field === 'rules') {
      updatedAgent.other_rules = value;
      const stepsFormatted = (agent.instruction?.steps || []).map(s => `- ${s}`).join('\n');
      setAgentFreeformText(`PASSOS DO ATENDIMENTO:\n${stepsFormatted}\n\nREGRAS E DIRETRIZES:\n${value}`);
    } else if (field === 'greetings') {
      updatedAgent.greetings = value;
    } else if (field === 'objective') {
      updatedAgent.instruction = {
        ...updatedAgent.instruction,
        objective: value
      };
    }

    setAgentText(JSON.stringify(updatedAgent, null, 2));
    onUpdateAgent(updatedAgent);
    if (activeWorkflow) {
      setLiveValidation(validateForticsAgentAndWorkflow(updatedAgent, activeWorkflow));
    }
  };

  useEffect(() => {
    const targetWf = currentWorkflowsList[selectedWfIndex] || workflow;
    if (targetWf) {
      setWorkflowText(JSON.stringify(targetWf, null, 2));
    }
  }, [workflow, workflows, selectedWfIndex]);

  useEffect(() => {
    if (agent && activeWorkflow) {
      const report = validateForticsAgentAndWorkflow(agent, activeWorkflow);
      setLiveValidation(report);
    }
  }, [agent, activeWorkflow]);

  const handleAgentTextChange = (text: string) => {
    setAgentText(text);
    try {
      const parsed = JSON.parse(text);
      setParseError(null);
      onUpdateAgent(parsed);
      if (activeWorkflow) {
        setLiveValidation(validateForticsAgentAndWorkflow(parsed, activeWorkflow));
      }
    } catch (e: any) {
      setParseError(`Erro de sintaxe no agente.json: ${e.message}`);
    }
  };

  const handleWorkflowTextChange = (text: string) => {
    setWorkflowText(text);
    try {
      const parsed = JSON.parse(text);
      setParseError(null);
      onUpdateWorkflow(parsed);
      
      if (onUpdateWorkflows && currentWorkflowsList.length > 0) {
        const updatedList = [...currentWorkflowsList];
        updatedList[selectedWfIndex] = parsed;
        onUpdateWorkflows(updatedList);
      }

      if (agent) {
        setLiveValidation(validateForticsAgentAndWorkflow(agent, parsed));
      }
    } catch (e: any) {
      setParseError(`Erro de sintaxe no workflow.json: ${e.message}`);
    }
  };

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const downloadJson = (data: any, filename: string) => {
    const cleanFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', cleanFilename);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 150);
  };

  const handleDownloadAllWorkflows = () => {
    currentWorkflowsList.forEach((wf, idx) => {
      setTimeout(() => {
        const safeName = (wf.name || `workflow_${idx + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_');
        downloadJson(wf, `${safeName}.json`);
      }, idx * 300);
    });
  };

  const formatCurrentJson = () => {
    try {
      if (activeTab === 'agent') {
        const parsed = JSON.parse(agentText);
        const formatted = JSON.stringify(parsed, null, 2);
        setAgentText(formatted);
      } else if (activeTab === 'workflow') {
        const parsed = JSON.parse(workflowText);
        const formatted = JSON.stringify(parsed, null, 2);
        setWorkflowText(formatted);
      }
      setParseError(null);
    } catch (e: any) {
      setParseError(`Não foi possível formatar: ${e.message}`);
    }
  };

  return (
    <div className="py-6 px-2 sm:px-4 w-full space-y-6">

      {/* Quick Downloads & Copy Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 bg-[#061833]/80 rounded-2xl border border-[#0066FF]/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#020b18] text-[#00D2FF] border border-[#0066FF]/40">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-white block">JSONs Oficiais Prontos para o Fortics</span>
            <span className="text-[11px] text-slate-300">Copie o JSON formatado diretamente ou baixe o arquivo .json</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Agente Group */}
          {studioMode !== 'workflow_only' && (
            <div className="flex items-center gap-1 bg-[#020b18] p-1 rounded-full border border-[#0066FF]/30">
              <button
                type="button"
                onClick={() => copyToClipboard(agentText, 'agente_bar')}
                className="py-1.5 px-3.5 rounded-full hover:bg-[#0066FF]/20 text-xs font-bold text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copiar código JSON do Agente para colar direto no Fortics"
              >
                {copiedTab === 'agente_bar' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{copiedTab === 'agente_bar' ? 'Copiado!' : 'Copiar agente.json'}</span>
              </button>
              <button
                type="button"
                onClick={() => downloadJson(agentText, 'agente.json')}
                className="py-1.5 px-3 rounded-full hover:bg-[#0066FF]/30 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                title="Baixar arquivo agente.json"
              >
                <Download className="w-3.5 h-3.5 text-[#00D2FF]" />
                <span className="hidden sm:inline">Baixar</span>
              </button>
            </div>
          )}

          {/* Workflow Group */}
          <div className="flex items-center gap-1 bg-[#020b18] p-1 rounded-full border border-[#0066FF]/30">
            <button
              type="button"
              onClick={() => copyToClipboard(workflowText, 'workflow_bar')}
              className="py-1.5 px-3.5 rounded-full hover:bg-[#0066FF]/20 text-xs font-bold text-[#00D2FF] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copiar código JSON do Workflow para colar direto no Fortics"
            >
              {copiedTab === 'workflow_bar' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#00D2FF]" />}
              <span>{copiedTab === 'workflow_bar' ? 'Copiado!' : 'Copiar workflow.json'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const safeName = (activeWorkflow?.name || 'workflow')
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, '_')
                  .replace(/_+/g, '_');
                downloadJson(workflowText, `${safeName}.json`);
              }}
              className="py-1.5 px-3 rounded-full hover:bg-[#0066FF]/30 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              title={currentWorkflowsList.length > 1 ? `Baixar ${activeWorkflow?.name || 'workflow'}.json` : 'Baixar workflow.json'}
            >
              <Download className="w-3.5 h-3.5 text-[#00D2FF]" />
              <span className="hidden sm:inline">Baixar</span>
            </button>
          </div>

          {/* Baixar Todos os Workflows */}
          {currentWorkflowsList.length > 1 && (
            <button
              type="button"
              onClick={handleDownloadAllWorkflows}
              className="fortics-btn-primary py-2 px-4 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Baixar todos os workflows separadamente (.json de cada um)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Todos ({currentWorkflowsList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Parse Error Notice */}
      {parseError && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Main Inspector Container */}
      <div className="bg-[#061325]/90 rounded-2xl border border-[#0066FF]/25 shadow-xl overflow-hidden">
        
        {/* Tab Headers */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#020b18] border-b border-[#0066FF]/20 flex-wrap gap-2">
          
          <div className="flex items-center gap-1.5 bg-[#061325] p-1 rounded-full border border-[#0066FF]/30 text-xs">
            {studioMode !== 'workflow_only' && (
              <button
                onClick={() => setActiveTab('agent')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                  activeTab === 'agent'
                    ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/40'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>agente.json</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('workflow')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                activeTab === 'workflow'
                  ? 'bg-[#0066FF] text-white shadow-md shadow-[#0066FF]/40'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>workflow(s).json</span>
            </button>
          </div>

          {/* Action Tools */}
          {(activeTab === 'agent' || activeTab === 'workflow') && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(activeTab === 'agent' ? agentText : workflowText, activeTab)}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                {copiedTab === activeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTab === activeTab ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>
          )}

        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5">
          
          {/* 1. AGENTE TAB (Visual / Freeform & JSON Bruto) */}
          {activeTab === 'agent' && (
            <div className="space-y-4">
              
              {/* Header Switcher: Visual & Texto Livre vs JSON Bruto */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setAgentViewMode('visual')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      agentViewMode === 'visual'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Visual & Texto Livre</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAgentViewMode('json')}
                    className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      agentViewMode === 'json'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>JSON Bruto (agente.json)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Schema Oficial Fortics v4
                  </span>
                </div>
              </div>

              {agentViewMode === 'visual' ? (
                /* Visual & Freeform / Structured Editing Mode */
                <div className="space-y-4">
                  
                  {/* Basic Metadata Info */}
                  {agent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Nome do Agente</label>
                        <input
                          type="text"
                          value={agent.name}
                          onChange={(e) => {
                            const updated = { ...agent, name: e.target.value };
                            setAgentText(JSON.stringify(updated, null, 2));
                            onUpdateAgent(updated);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">Saudação Inicial</label>
                        <input
                          type="text"
                          value={agent.greetings || ''}
                          onChange={(e) => handleAgentStructuredFieldChange('greetings', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Instructions & Rules Section with Freeform/Structured Mode */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                          Instruções & Regras do Agente
                        </span>
                      </div>

                      {/* Mode Toggle: Freeform vs Structured */}
                      <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setAgentPromptMode('freeform')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            agentPromptMode === 'freeform'
                              ? 'bg-emerald-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Texto Livre
                        </button>
                        <button
                          type="button"
                          onClick={() => setAgentPromptMode('structured')}
                          className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                            agentPromptMode === 'structured'
                              ? 'bg-emerald-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Passos & Regras
                        </button>
                      </div>
                    </div>

                    {agentPromptMode === 'freeform' ? (
                      /* Freeform Textarea */
                      <div className="space-y-1.5">
                        <textarea
                          rows={12}
                          value={agentFreeformText}
                          onChange={(e) => handleAgentFreeformChange(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:border-emerald-500 focus:outline-none"
                          placeholder="Digite aqui todo o fluxo do agente em texto livre..."
                        />
                        <p className="text-[10px] text-slate-500">
                          A IA sincroniza automaticamente os passos (`instruction.steps`) e as regras (`other_rules`).
                        </p>
                      </div>
                    ) : (
                      /* Structured Side-by-Side */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                            <ListOrdered className="w-3.5 h-3.5" />
                            <span>Passos do Agente (instruction.steps)</span>
                          </label>
                          <textarea
                            rows={10}
                            value={(agent?.instruction?.steps || []).map(s => `- ${s}`).join('\n')}
                            onChange={(e) => handleAgentStructuredFieldChange('steps', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Regras & Validações (other_rules)</span>
                          </label>
                          <textarea
                            rows={10}
                            value={agent?.other_rules || ''}
                            onChange={(e) => handleAgentStructuredFieldChange('rules', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                /* Raw JSON Mode */
                <div className="space-y-2">
                  <textarea
                    rows={20}
                    value={agentText}
                    onChange={(e) => handleAgentTextChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner"
                  />
                </div>
              )}

            </div>
          )}

          {/* 2. WORKFLOW JSON TAB */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              {/* Multi-Workflow Switcher Toolbar */}
              {currentWorkflowsList.length > 1 && (
                <div className="p-3 bg-slate-950 rounded-xl border border-cyan-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      Workflows Gerados ({currentWorkflowsList.length}):
                    </span>
                    <div className="flex items-center gap-1.5 flex-nowrap">
                      {currentWorkflowsList.map((wf, idx) => (
                        <button
                          key={wf.id || idx}
                          onClick={() => setSelectedWfIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                            selectedWfIndex === idx
                              ? 'bg-cyan-600 text-white shadow-sm ring-1 ring-cyan-400/50'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{wf.name || `Workflow ${idx + 1}`}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions for Multi-Workflows */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const curWf = currentWorkflowsList[selectedWfIndex];
                        const safeName = (curWf.name || `workflow_${selectedWfIndex + 1}`)
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, '_')
                          .replace(/_+/g, '_');
                        downloadJson(curWf, `${safeName}.json`);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-cyan-800/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Baixar apenas o workflow selecionado"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Baixar Selecionado</span>
                    </button>

                    <button
                      onClick={handleDownloadAllWorkflows}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      title="Baixar todos os workflows separadamente (.json de cada um)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Todos ({currentWorkflowsList.length})</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Grafo de nós estruturado para importação direta no Fortics Omnichannel:</span>
                  {activeWorkflow?.name && (
                    <span className="font-semibold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-[11px]">
                      {activeWorkflow.name}
                    </span>
                  )}
                </div>
                <span className="font-mono text-cyan-400 text-[11px]">Flow Spec v1.0.0</span>
              </div>

              <textarea
                rows={20}
                value={workflowText}
                onChange={(e) => handleWorkflowTextChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-cyan-300 focus:outline-none focus:border-emerald-500 leading-relaxed shadow-inner"
              />
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
