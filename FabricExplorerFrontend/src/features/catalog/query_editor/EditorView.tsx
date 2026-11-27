'use client';

import { useCallback, useEffect, useState } from 'react';
import { useConnection } from '@/providers/ConnectionProvider';
import { useToast } from '@/providers/ToastProvider';
import type { QueryTargetItem } from '@/types/savedQuery/QueryTargetItem';
import type { SavedQuery } from '@/types/savedQuery/SavedQuery';
import { consumeQuerySample } from '../shared/querySampleStore';
import { MaxRowsSelect } from './components/MaxRowsSelect';
import { QueryTargetBar } from './components/QueryTargetBar';
import { SaveQueryModal } from './components/SaveQueryModal';
import { SavedQueriesModal } from './components/SavedQueriesModal';
import { useQueryDraft } from './hooks/useQueryDraft';
import { useQueryTargets } from './hooks/useQueryTargets';
import { lastTargetStore } from './targets/lastTargetStore';

const DEFAULT_QUERY = `SELECT 
    CustomerId, 
    CustomerName, 
    Email, 
    CreditLimit 
FROM dbo.Customers 
WHERE CreditLimit > 50000;
`;

type OpenModal = 'save' | 'list' | null;

export function EditorView(){
    const doSomething = () => console.log("this functions has not done yet");
    const { showToast } = useToast();
    const { activeConnection } = useConnection();
    const targets = useQueryTargets();
    const editor = useQueryDraft(activeConnection?.id, DEFAULT_QUERY);
    const { draft, setSql, setTarget } = editor;
    const [modal, setModal] = useState<OpenModal>(null);

    // A query sample sent from Catalog > Tables (consumed once)
    useEffect(() => {
        const sample = consumeQuerySample();
        if (!sample) return;
        setSql(sample.sql);
        showToast(sample.label ? `Loaded query sample for ${sample.label}` : 'Loaded query sample', 'success');
    }, [setSql, showToast]);

    // Start on the item used last time for this connection, else on the first one
    useEffect(() => {
        if (targets.state !== 'ready' || draft.target || !activeConnection) return;
        const remembered = lastTargetStore.read(activeConnection.id);
        setTarget(targets.items.find((i) => i.id === remembered) ?? targets.items[0] ?? null);
    }, [targets.state, targets.items, draft.target, activeConnection, setTarget]);

    const selectTarget = useCallback(
        (item: QueryTargetItem) => {
            setTarget(item);
            if (activeConnection) lastTargetStore.write(activeConnection.id, item.id);
        },
        [setTarget, activeConnection],
    );

    const loadSavedQuery = (query: SavedQuery) => {
        editor.load(query, targets.items);
        setModal(null);
        showToast(`Loaded “${query.name}” into the editor`, 'success');
    };

    const openSave = () => {
        if (!activeConnection) return showToast('Set an active connection first (Connection tab).', 'warning');
        if (!draft.target) return showToast('Select a target item first.', 'warning');
        if (!draft.sql.trim()) return showToast('Write a query before saving it.', 'warning');
        setModal('save');
    };

    return (
        <section id="view-query-editor" className="space-y-6 max-w-7xl mx-auto">
                    
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <div className="flex items-center space-x-2.5">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Query Editor</h1>
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            <i className="fa-solid fa-terminal mr-1 text-[9px]"></i>
                            SQL Studio
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Write and execute SQL queries against a selected Fabric item.</p>

                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium border border-slate-200">
                            <strong className="text-slate-800">Connection:</strong> <span id="queryCtxConn">{activeConnection?.name ?? 'None'}</span>
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md font-medium border border-indigo-100">
                            <strong className="text-indigo-900">Workspace:</strong> <span id="queryCtxWs">{activeConnection?.workspaceName ?? activeConnection?.workspaceId ?? '—'}</span>
                        </span>
                        {editor.loaded && (
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md font-medium border border-emerald-100">
                                <i className="fa-regular fa-bookmark mr-1"></i>
                                {editor.loaded.name}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button onClick={() => setModal('list')} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5">
                        <i className="fa-solid fa-folder-open"></i>
                        <span>Saved Queries</span>
                    </button>
                </div>
            </div>

            <QueryTargetBar targets={targets} target={draft.target} onSelect={selectTarget} />

            <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md p-4 flex flex-col space-y-3 h-[320px] w-full">
                <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2 flex-wrap gap-2">
                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                        <div className="flex items-center space-x-2 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Input Mode:</span>
                            <div className="flex items-center space-x-1 bg-slate-800 p-0.5 rounded-md border border-slate-700/60">
                                <button type="button" id="btnQueryModeSql" onClick={() => doSomething()} className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-600 text-white shadow-xs transition-all flex items-center space-x-1.5">
                                    <i className="fa-solid fa-table text-[10px]"></i>
                                    <span>T-SQL</span>
                                </button>
                            </div>
                        </div>

                        <MaxRowsSelect value={draft.maxRows} onChange={editor.setMaxRows} />
                    </div>

                    <div className="flex items-center space-x-2 ml-auto">
                        <button onClick={editor.clear} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-semibold">Clear</button>
                        <button onClick={openSave} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1.5">
                            <i className="fa-regular fa-bookmark"></i>
                            <span>Save Query</span>
                        </button>
                        <button onClick={() => doSomething()} id="btnRunQuery" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center space-x-2 shadow-sm">
                            <i className="fa-solid fa-play text-xs"></i>
                            <span id="btnRunQueryText">Run Query</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex font-mono text-xs text-emerald-400 leading-relaxed overflow-hidden relative">
                    <textarea id="sqlQueryTextarea" className="flex-1 bg-transparent text-emerald-400 outline-none resize-none font-mono text-xs leading-relaxed" spellCheck="false"
                        value={draft.sql}
                        onChange={(e) => setSql(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[380px]">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs shrink-0 flex-wrap gap-2">
                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900" id="queryResultTitleLabel">Query Result</span>
                            <span className="bg-slate-200 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded" id="queryResultBadge">Tabular View (Max 100 rows)</span>
                        </div>

                        <div className="flex items-center space-x-1 bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/60 text-[11px]">
                            <span className="text-[10px] font-bold text-slate-500 uppercase px-1.5">Format:</span>
                            <button type="button" id="btnFmtGrid" onClick={() => doSomething()} className="px-2.5 py-1 rounded-md font-bold bg-white text-indigo-600 shadow-xs transition-all flex items-center space-x-1">
                                <i className="fa-solid fa-table text-[10px]"></i>
                                <span>Grid</span>
                            </button>
                            <button type="button" id="btnFmtCsv" onClick={() => doSomething()} className="px-2.5 py-1 rounded-md font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center space-x-1">
                                <i className="fa-solid fa-file-csv text-[10px]"></i>
                                <span>CSV</span>
                            </button>
                            <button type="button" id="btnFmtJson" onClick={() => doSomething()} className="px-2.5 py-1 rounded-md font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center space-x-1">
                                <i className="fa-solid fa-code text-[10px]"></i>
                                <span>JSON</span>
                            </button>
                            <button type="button" id="btnFmtXml" onClick={() => doSomething()} className="px-2.5 py-1 rounded-md font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all flex items-center space-x-1">
                                <i className="fa-solid fa-file-code text-[10px]"></i>
                                <span>XML</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button onClick={() => doSomething()} id="btnCopyResult" className="hidden px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg text-xs flex items-center space-x-1 shadow-2xs">
                            <i className="fa-regular fa-copy text-xs"></i>
                            <span>Copy Output</span>
                        </button>
                        <button onClick={() => doSomething()} id="btnDownloadResult" className="hidden px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-lg text-xs flex items-center space-x-1 shadow-2xs">
                            <i className="fa-solid fa-download text-xs"></i>
                            <span>Export</span>
                        </button>
                        <button onClick={() => doSomething()} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 shadow-sm" title="Generate Schema Definition from Query Output Resultset">
                            <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                            <span>Generate Response Schema</span>
                        </button>
                    </div>
                </div>

                <div id="queryTabularResultContainer" className="flex-1 overflow-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
                                <th className="p-2.5 pl-4">CustomerId</th>
                                <th className="p-2.5">CustomerName</th>
                                <th className="p-2.5">Email</th>
                                <th className="p-2.5 pr-4">CreditLimit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700" id="queryTabularResultBody">
                            <tr className="hover:bg-slate-50">
                                <td className="p-2.5 pl-4 font-mono font-bold text-slate-900">1001</td>
                                <td className="p-2.5 font-bold">Acme Corp</td>
                                <td className="p-2.5 font-mono text-slate-500">contact@acme.com</td>
                                <td className="p-2.5 pr-4 font-mono text-indigo-600">$150,000.00</td>
                            </tr>
                            <tr className="hover:bg-slate-50">
                                <td className="p-2.5 pl-4 font-mono font-bold text-slate-900">1002</td>
                                <td className="p-2.5 font-bold">Global Logistics Ltd</td>
                                <td className="p-2.5 font-mono text-slate-500">info@globallogistics.com</td>
                                <td className="p-2.5 pr-4 font-mono text-indigo-600">$250,000.00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div id="queryCsvResultContainer" className="hidden flex-1 flex flex-col bg-slate-950 p-4 font-mono text-xs overflow-auto">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-2">
                        <span>Delimiter: <strong className="text-white">Comma (,)</strong> · Columns: <strong className="text-white">4</strong> · Rows: <strong className="text-white">2</strong></span>
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">text/csv</span>
                    </div>
                    <pre className="text-emerald-400 font-mono text-xs leading-relaxed overflow-auto flex-1 select-all" id="queryCsvResultDisplay">CustomerId,CustomerName,Email,CreditLimit
                        1001,"Acme Corp","contact@acme.com",150000.00
                        1002,"Global Logistics Ltd","info@globallogistics.com",250000.00
                    </pre>
                </div>

                <div id="queryJsonResultContainer" className="hidden flex-1 flex flex-col bg-slate-950 p-4 font-mono text-xs overflow-auto">
                    <div className="flex items-center justify-between text-[11px] text-indigo-300 border-b border-slate-800 pb-2 mb-2">
                        <span>Array Object Payload · Records: <strong className="text-white">2</strong></span>
                        <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded text-[10px]">application/json</span>
                    </div>
                    <pre className="text-amber-300 font-mono text-xs leading-relaxed overflow-auto flex-1 select-all" id="queryJsonResultDisplay">
                        [
                            `{'{'}`
                                "CustomerId": 1001,
                                "CustomerName": "Acme Corp",
                                "Email": "contact@acme.com",
                                "CreditLimit": 150000.00
                            `{'}'}`,
                            `{'{'}`
                                "CustomerId": 1002,
                                "CustomerName": "Global Logistics Ltd",
                                "Email": "info@globallogistics.com",
                                "CreditLimit": 250000.00
                            `{'}'}`
                        ]
                    </pre>
                </div>

                <div id="queryXmlResultContainer" className="hidden flex-1 flex flex-col bg-slate-950 p-4 font-mono text-xs overflow-auto">
                    <div className="flex items-center justify-between text-[11px] text-purple-300 border-b border-slate-800 pb-2 mb-3">
                        <span>Root Tag: <strong className="text-white">&lt;Customers&gt;</strong> · Element Nodes: <strong className="text-white" id="xmlElementCountDisplay">2</strong></span>
                        <span className="bg-purple-900/60 text-purple-200 border border-purple-700/60 px-2 py-0.5 rounded text-[10px]">text/xml</span>
                    </div>
                    <pre className="text-emerald-400 font-mono text-xs leading-relaxed overflow-auto flex-1 select-all" id="sqlXmlResultDisplay">&lt;?xml version="1.0" encoding="UTF-8"?&gt;
                        &lt;Customers xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"&gt;
                        &lt;Customer id="1001" region="US-East"&gt;
                        &lt;CustomerName&gt;Acme Corp&lt;/CustomerName&gt;
                        &lt;Email&gt;contact@acme.com&lt;/Email&gt;
                        &lt;Financials&gt;
                        &lt;CreditLimit currency="USD"&gt;150000.00&lt;/CreditLimit&gt;
                        &lt;/Financials&gt;
                        &lt;Status&gt;Active&lt;/Status&gt;
                        &lt;/Customer&gt;
                        &lt;Customer id="1002" region="EU-West"&gt;
                        &lt;CustomerName&gt;Global Logistics Ltd&lt;/CustomerName&gt;
                        &lt;Email&gt;info@globallogistics.com&lt;/Email&gt;
                        &lt;Financials&gt;
                        &lt;CreditLimit currency="EUR"&gt;250000.00&lt;/CreditLimit&gt;
                        &lt;/Financials&gt;
                        &lt;Status&gt;Active&lt;/Status&gt;
                        &lt;/Customer&gt;
                        &lt;/Customers&gt;
                    </pre>
                </div>
            </div>


            {modal === 'save' && activeConnection && draft.target && (
                <SaveQueryModal
                    draft={{ ...draft, target: draft.target }}
                    connection={activeConnection}
                    loaded={editor.loaded}
                    onClose={() => setModal(null)}
                    onSaved={editor.setLoaded}
                />
            )}

            {modal === 'list' && (
                <SavedQueriesModal connection={activeConnection} onLoad={loadSavedQuery} onClose={() => setModal(null)} />
            )}

        </section>
    )
}