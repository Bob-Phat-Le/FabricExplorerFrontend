import { useState } from 'react';
import * as itemsApi from '@/lib/api/items.api';
import { cn } from '@/lib/cn';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import { useConnection } from '@/providers/ConnectionProvider';
import { useToast } from '@/providers/ToastProvider';
import type { FabricItem, FabricItemType } from '@/types/fabric';

interface Props {
  onClose: () => void;
  onUseItem: (item: FabricItem) => void;
}

const TYPES: { type: FabricItemType; title: string; description: string; icon: string }[] = [
  { type: 'Lakehouse', title: 'Lakehouse', description: 'Store and analyze data using a Fabric Lakehouse.', icon: 'fa-building-columns' },
  { type: 'Warehouse', title: 'Warehouse', description: 'Build a SQL-based analytical warehouse in Fabric.', icon: 'fa-warehouse' },
  { type: 'MirroredDatabase', title: 'Mirrored Database', description: 'Mirror data from a supported source into Fabric.', icon: 'fa-arrows-rotate' },
];

const STEP_LABELS = ['1. Item Type', '2. Configuration', '3. Create'];

export function CreateItemModal({ onClose, onUseItem }: Props) {
  const { showApiError } = useToast();
  const { activeConnection } = useConnection();

  const [step, setStep] = useState(1);
  const [type, setType] = useState<FabricItemType>('Lakehouse');
  const [name, setName] = useState('Sales Analytics Lakehouse');
  const [created, setCreated] = useState<FabricItem | null>(null);

  const workspaceName = activeConnection?.workspaceName || '—';
  const workspaceId = activeConnection?.workspaceId ?? '';

  const create = async () => {
    setStep(3);
    setCreated(null);
    try {
      setCreated(await itemsApi.create({ displayName: name || 'New Analytics Item', type }));
    } catch (err) {
      showApiError(err, 'Could not create item');
      setStep(2);
    }
  };

  return (
    <Modal maxWidth="max-w-2xl">
      {/* Modal Header */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold shrink-0">
            <i className="fa-solid fa-square-plus" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">Create Fabric Item</h3>
            <p className="text-xs text-slate-500 mt-0.5">Create an item in your Microsoft Fabric workspace and monitor its job instances.</p>
          </div>
        </div>
        <ModalCloseButton onClick={onClose} />
      </div>

      {/* Wizard Step Tracker */}
      <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-100 pb-3">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const on = n === step;
          return (
            <div key={label} className="contents">
              <div className={cn('flex items-center space-x-2', on ? 'text-indigo-600 font-bold' : 'text-slate-400')}>
                <span
                  className={cn(
                    'w-6 h-6 rounded-full text-[11px] flex items-center justify-center',
                    on ? 'bg-indigo-600 text-white' : 'bg-slate-100 border border-slate-300',
                  )}
                >
                  {n}
                </span>
                <span>{label}</span>
              </div>
              {n < STEP_LABELS.length && <div className="h-0.5 w-12 bg-slate-200" />}
            </div>
          );
        })}
      </div>

      {/* STEP 1: ITEM TYPE SELECTION */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-800">Select the Microsoft Fabric item type you want to create:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TYPES.map((t) => {
              const on = t.type === type;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className={cn(
                    'cursor-pointer p-4 rounded-xl transition-all text-left space-y-2',
                    on ? 'border-2 border-indigo-600 bg-indigo-50/40' : 'border border-slate-200 hover:border-indigo-400 bg-white',
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-sm',
                      on ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700',
                    )}
                  >
                    <i className={`fa-solid ${t.icon}`} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">{t.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{t.description}</p>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              Continue to Configuration
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CONFIGURATION FORM */}
      {step === 2 && (
        <div className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-800">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name..."
              className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-[11px] text-slate-400">Specify a unique name for the new item in this workspace.</p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-slate-400 text-[11px]">Target Workspace:</span>
            <p className="font-bold text-slate-900 text-xs">{workspaceName}</p>
            <p className="font-mono text-[10px] text-slate-500">{workspaceId}</p>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200">
              Back
            </button>
            <button type="button" onClick={() => void create()} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700">
              Create Item
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: CREATING PROGRESS & SUCCESS STATE */}
      {step === 3 && (
        <div className="space-y-5">
          {!created ? (
            <div className="space-y-3 p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
              <div className="flex items-center space-x-2 text-indigo-900 font-bold">
                <i className="fa-solid fa-circle-notch animate-spin text-indigo-600" />
                <span>Provisioning item in Microsoft Fabric...</span>
              </div>
              <ul className="space-y-1.5 pl-5 text-[11px] text-indigo-800">
                <li>
                  <i className="fa-solid fa-circle-check text-emerald-600 mr-1.5" /> Validating item configuration name...
                </li>
                <li>
                  <i className="fa-solid fa-spinner animate-spin text-indigo-600 mr-1.5" /> Requesting Fabric resource allocation...
                </li>
                <li className="opacity-40">
                  <i className="fa-regular fa-circle text-slate-400 mr-1.5" /> Initializing job instances endpoint...
                </li>
              </ul>
            </div>
          ) : (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4 text-xs">
              <div className="flex items-center space-x-3 text-emerald-800">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">
                  <i className="fa-solid fa-circle-check" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Item Created Successfully</h4>
                  <p className="text-slate-600 text-[11px] mt-0.5">The item is ready for job instance monitoring.</p>
                </div>
              </div>

              <dl className="p-3 bg-white/80 rounded-lg border border-emerald-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <dt className="text-slate-400">Name:</dt>
                  <dd className="font-bold text-slate-900">{created.name}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Type:</dt>
                  <dd className="font-bold text-indigo-700">{created.type}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Item ID:</dt>
                  <dd className="font-mono text-slate-700">{created.id}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Workspace:</dt>
                  <dd className="font-medium text-slate-800">{created.workspace}</dd>
                </div>
              </dl>

              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={onClose} className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-semibold hover:bg-emerald-100">
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onUseItem(created);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Use as Monitored Item
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
