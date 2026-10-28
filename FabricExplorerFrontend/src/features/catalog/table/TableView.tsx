'use client'

export function TableView(){
    const doSomething = () => console.log("This function hasn't been done yet");

    return (
        <section id="view-catalog" className="space-y-4 max-w-7xl mx-auto">
                    
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <div className="flex items-center space-x-2.5">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Catalog</h1>
                        <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            <i className="fa-solid fa-book-bookmark mr-1 text-[9px]"></i>
                            Tables Explorer
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Browse Fabric tables and generate reusable schema definitions.</p>

                    <div className="flex items-center space-x-3 mt-2 text-[11px]">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium border border-slate-200">
                            <strong className="text-slate-800">Connection:</strong> Production Fabric
                        </span>
                        <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md font-medium border border-indigo-100">
                            <strong className="text-indigo-900">Workspace:</strong> Analytics Production
                        </span>
                    </div>
                </div>
            </div>

            <div id="catalogMonitoredItemCard" className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                
                <div id="catalogMonitoredItemSetup" className="p-6 text-center bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 space-y-4 hidden">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl shadow-sm">
                        <i className="fa-solid fa-cubes"></i>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Select a Fabric Item</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">Choose an existing Microsoft Fabric artifact or create a new item to inspect tables.</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <div className="relative">
                            <button type="button" onClick={() => doSomething()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-2">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <span>Select Existing Item</span>
                                <i className="fa-solid fa-chevron-down text-[10px]"></i>
                            </button>

                            <div id="catalogItemSelectorMenu" className="hidden absolute left-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl z-30 p-3 text-left space-y-2">
                                <div className="relative">
                                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                                    <input type="text" id="catalogItemSearchInput" onInput={() => doSomething()} placeholder="Search items by name or ID..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"/>
                                </div>

                                <div className="flex items-center space-x-1 border-b border-slate-100 pb-2 text-[10px]">
                                    <button type="button" onClick={() => doSomething()} className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold">All</button>
                                    <button type="button" onClick={() => doSomething()} className="px-2 py-0.5 rounded hover:bg-slate-100 text-slate-600">Lakehouse</button>
                                    <button type="button" onClick={() => doSomething()} className="px-2 py-0.5 rounded hover:bg-slate-100 text-slate-600">Warehouse</button>
                                    <button type="button" onClick={() => doSomething()} className="px-2 py-0.5 rounded hover:bg-slate-100 text-slate-600">Mirrored DB</button>
                                </div>

                                <div className="space-y-1 max-h-56 overflow-y-auto pr-1" id="catalogItemsListContainer"></div>
                            </div>
                        </div>

                        <span className="text-xs text-slate-400 font-medium">or</span>

                        <button type="button" onClick={() => doSomething()} className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2">
                            <i className="fa-solid fa-plus text-indigo-600"></i>
                            <span>+ Create New Item</span>
                        </button>
                    </div>
                </div>

                <div id="catalogMonitoredItemActive" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-md shrink-0" id="catalogMonitoredItemIcon">
                            <i className="fa-solid fa-building-columns"></i>
                        </div>
                        <div>
                            <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-slate-900 text-sm" id="catalogMonitoredItemName">Sales Analytics Lakehouse</h3>
                                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full" id="catalogMonitoredItemType">Lakehouse</span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5 flex-wrap gap-1">
                                <span>Workspace: <strong className="text-slate-800" id="catalogMonitoredItemWorkspace">Analytics Production</strong></span>
                                <span>•</span>
                                <span>Item ID: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded" id="catalogMonitoredItemId">431e8d7b-4a95-4c02-8ccd-6faef5ba1bd7</code></span>
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

                        <div id="catalogItemSelectorMenuAlt" className="hidden absolute right-0 top-10 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl z-30 p-3 text-left space-y-2">
                            <div className="relative">
                                <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                                <input type="text" id="catalogItemSearchInputAlt" onInput={() => doSomething()} placeholder="Search items..." className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="space-y-1 max-h-56 overflow-y-auto pr-1" id="catalogItemsListContainerAlt"></div>
                        </div>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4 flex flex-col h-[calc(100vh-220px)] min-h-[600px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0">
                        <div>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tables</h3>
                            <p className="text-[10px] text-slate-400">Browse tables grouped by schema</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono" id="treeTableCountLabel">4 Tables</span>
                    </div>

                    <div className="relative shrink-0">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
                        <input type="text" id="catalogTreeSearchInput" onInput={() => doSomething()} placeholder="Search tables..." className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"/>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 text-xs" id="catalogSchemaTreeContainer">
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-220px)] min-h-[600px] overflow-hidden p-5 space-y-4" id="catalogSchemaRightPanel">
                    
                    <div id="catalogActiveTableState" className="space-y-4 flex-1 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 shrink-0">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h2 className="font-bold text-slate-900 text-base" id="catalogSelectedTableHeading">dbo.Customers</h2>
                                    <button onClick={() => doSomething()} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-white/80 transition-all" title="Copy Full Table Name">
                                        <i className="fa-regular fa-copy text-xs"></i>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">Physical Fabric Delta storage entity · <span id="catalogSelectedTableItemMeta">Sales Lakehouse</span></p>
                            </div>
                            <div className="flex items-center space-x-2 flex-wrap gap-2">
                                <button onClick={() => doSomething()} className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5" title="Load Query Sample into Query Editor">
                                    <i className="fa-solid fa-code text-indigo-600"></i>
                                    <span>Load Query Sample to Query Editor</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white">
                            <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold shrink-0">
                                <span>Column Structure</span>
                                <div className="flex items-center space-x-3">
                                    <span id="tableColumnCountLabel">6 Columns</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 font-medium border-b border-slate-200 text-[11px] sticky top-0 bg-slate-50 z-10">
                                            <th className="p-2.5 pl-4">Column</th>
                                            <th className="p-2.5">Type</th>
                                            <th className="p-2.5">Nullable</th>
                                            <th className="p-2.5">PK</th>
                                            <th className="p-2.5 pr-4">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700" id="catalogTableColumnsBody">
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div id="catalogUnselectedState" className="hidden flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3 shadow-sm">
                            <i className="fa-solid fa-table-list"></i>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm">Select a Table</h3>
                        <p className="text-xs text-slate-500 max-w-sm mt-1">Choose a table from the browser on the left to view its schema, inspect columns, or generate a reusable schema definition.</p>
                    </div>
                </div>
            </div>
        </section>
    )
}