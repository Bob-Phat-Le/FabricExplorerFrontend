'use client'

import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { consumeQuerySample } from '../shared/querySampleStore';

const DEFAULT_QUERY = `SELECT 
    CustomerId, 
    CustomerName, 
    Email, 
    CreditLimit 
FROM dbo.Customers 
WHERE CreditLimit > 50000;
`;

export function EditorView(){
    const doSomething = () => console.log("this functions has not done yet");
    const { showToast } = useToast();
    const [sql, setSql] = useState(DEFAULT_QUERY);

    // A query sample sent from Catalog > Tables (consumed once)
    useEffect(() => {
        const sample = consumeQuerySample();
        if (!sample) return;
        setSql(sample.sql);
        showToast(sample.label ? `Loaded query sample for ${sample.label}` : 'Loaded query sample', 'success');
    }, [showToast]);
    
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

                    <div className="flex items-center space-x-3 mt-2 text-[11px]">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium border border-slate-200">
                            <strong className="text-slate-800">Connection:</strong> <span id="queryCtxConn">Production Fabric</span>
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md font-medium border border-indigo-100">
                            <strong className="text-indigo-900">Workspace:</strong> <span id="queryCtxWs">Analytics Production</span>
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button onClick={() => doSomething()} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-1.5">
                        <i className="fa-solid fa-folder-open"></i>
                        <span>Saved Queries</span>
                    </button>
                </div>
            </div>

            <div id="queryMonitoredItemCard" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                
                <div id="queryMonitoredItemSetup" className="p-6 text-center bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 space-y-4 hidden">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl shadow-sm">
                        <i className="fa-solid fa-cubes"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Select a Target Query Item</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">Choose an existing Microsoft Fabric artifact to execute SQL queries.</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <div className="relative">
                            <button type="button" onClick={() => doSomething()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-2">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <span>Select Existing Item</span>
                                <i className="fa-solid fa-chevron-down text-[10px]"></i>
                            </button>

                            <div id="queryItemSelectorMenu" className="hidden absolute left-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl z-30 p-3 text-left space-y-2">
                                <div className="relative">
                                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                                    <input type="text" id="queryItemSearchInput" onInput={() => doSomething()} placeholder="Search items by name or ID..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"/>
                                </div>

                                <div className="flex items-center space-x-1 border-b border-slate-100 pb-2 text-[10px]">
                                    <button type="button" onClick={() => doSomething()} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold">All</button>
                                    <button type="button" onClick={() => doSomething()} className="px-2 py-0.5 rounded hover:bg-slate-100 text-slate-600">Lakehouse</button>
                                    <button type="button" onClick={() => doSomething()} className="px-2 py-0.5 rounded hover:bg-slate-100 text-slate-600">Warehouse</button>
                                    <button type="button" onClick={() => doSomething()} className="px-2 py-0.5 rounded hover:bg-slate-100 text-slate-600">Mirrored DB</button>
                                </div>

                                <div className="space-y-1 max-h-56 overflow-y-auto pr-1" id="queryItemsListContainer"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="queryMonitoredItemActive" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-md shrink-0" id="queryMonitoredItemIcon">
                            <i className="fa-solid fa-building-columns"></i>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-slate-900 text-sm" id="queryMonitoredItemName">Sales Analytics Lakehouse</h3>
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full" id="queryMonitoredItemType">Lakehouse</span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5 flex-wrap gap-1">
                                <span>Workspace: <strong className="text-slate-800" id="queryMonitoredItemWorkspace">Analytics Production</strong></span>
                                <span>•</span>
                                <span>Item ID: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded" id="queryMonitoredItemId">431e8d7b-4a95-4c02-8ccd-6faef5ba1bd7</code></span>
                                <button onClick={() => doSomething()} className="text-slate-400 hover:text-indigo-600" title="Copy Item ID">
                                    <i className="fa-regular fa-copy text-xs"></i>
                                </button>
                                <span>•</span>
                                <button onClick={() => doSomething()} className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors flex items-center space-x-1.5 shadow-xs" title="View SQL Connection Strings">
                                    <i className="fa-solid fa-plug text-indigo-600 text-xs"></i>
                                    <span>SQL Connection String</span>
                                </button>	
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 relative">
                        <button type="button" onClick={() => doSomething()} className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-1.5">
                            <i className="fa-solid fa-arrow-right-arrow-left text-slate-400"></i>
                            <span>Change Item</span>
                        </button>

                        <div id="queryItemSelectorMenuAlt" className="hidden absolute right-0 top-10 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl z-30 p-3 text-left space-y-2">
                            <div className="relative">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                                <input type="text" id="queryItemSearchInputAlt" onInput={() => doSomething()} placeholder="Search items..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1" id="queryItemsListContainerAlt"></div>
                        </div>
                    </div>
                </div>

            </div>

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

                        <div className="flex items-center space-x-2 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
                            <label htmlFor="queryMaxRowsSelect" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                                <i className="fa-solid fa-list-ol text-[10px] text-indigo-400"></i>
                                <span>Max Row:</span>
                            </label>
                            <select id="queryMaxRowsSelect" className="bg-slate-800 text-emerald-400 border border-slate-700/60 rounded px-2 py-0.5 text-xs font-mono font-semibold outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer">
                                <option value="100" defaultValue={100}>100</option>
                                <option value="500">500</option>
                                <option value="1000">1,000</option>
                                <option value="5000">5,000</option>
                                <option value="10000">10,000</option>
                                <option value="unlimited">Unlimited</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-auto">
                        <button onClick={() => doSomething()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors text-xs font-semibold">Clear</button>
                        <button onClick={() => doSomething()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white rounded-lg transition-colors text-xs font-semibold flex items-center space-x-1.5">
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
                        value={sql}
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

        </section>
    )
}