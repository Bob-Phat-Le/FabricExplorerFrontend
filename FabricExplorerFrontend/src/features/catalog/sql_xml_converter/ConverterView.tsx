'use client'

export function ConverterView() {
    const doSomething = () => console.log("this function has not done yet");

    return (
        <section id="view-sql-converter" className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <div className="flex items-center space-x-2.5">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">SQL to SQL XML Converter</h1>
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            <i className="fa-solid fa-arrows-rotate mr-1 text-[9px]"></i>
                            Format Engine
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Convert standard T-SQL queries into structured Microsoft Fabric SQL XML request specifications.</p>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button onClick={() => doSomething()} className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm flex items-center space-x-1.5">
                        <i className="fa-solid fa-wand-magic-sparkles text-indigo-500"></i>
                        <span>Load Sample SQL</span>
                    </button>
                    <button onClick={() => doSomething()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-2">
                        <i className="fa-solid fa-arrows-rotate text-xs"></i>
                        <span>Convert to SQL XML</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-md p-4 flex flex-col h-[520px]">
                    <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2.5 mb-3">
                        <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-database text-indigo-400"></i>
                            <span className="font-bold text-white">Input SQL Statement</span>
                        </div>
                        <button onClick={() => doSomething()} className="text-xs text-slate-400 hover:text-white transition-colors">Clear</button>
                    </div>
                    <textarea id="converterSqlInput" className="flex-1 bg-transparent text-emerald-400 outline-none resize-none font-mono text-xs leading-relaxed" spellCheck="false" placeholder="Enter T-SQL query here..."
                        defaultValue=
                        {
`SELECT 
    CustomerId, 
    CustomerName, 
    Email, 
    CreditLimit 
FROM dbo.Customers 
WHERE CreditLimit > 50000;
`
                        }
                    />
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-md p-4 flex flex-col h-[520px]">
                    <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2.5 mb-3">
                        <div className="flex items-center space-x-2">
                            <i className="fa-solid fa-code text-purple-400"></i>
                            <span className="font-bold text-white">Generated SQL XML Output</span>
                            <span className="bg-purple-900/60 text-purple-200 border border-purple-700/60 px-2 py-0.5 rounded text-[10px] font-mono">&lt;request_body&gt;</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => doSomething()} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-semibold transition-colors flex items-center space-x-1">
                                <i className="fa-regular fa-copy"></i>
                                <span>Copy</span>
                            </button>
                            <button onClick={() => doSomething()} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-semibold transition-colors flex items-center space-x-1">
                                <i className="fa-solid fa-download"></i>
                                <span>Download</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 font-mono text-xs text-emerald-400 leading-relaxed overflow-auto bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 mb-3">
                        <pre id="converterXmlDisplay" className="whitespace-pre-wrap">// Click "Convert to SQL XML" to generate the XML payload</pre>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Ready to execute in Fabric Query Studio</span>
                        <button onClick={() => doSomething()} className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-sm">
                            <i className="fa-solid fa-terminal"></i>
                            <span>Open in Query Editor</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}