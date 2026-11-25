import { useEffect, useMemo, useState } from 'react';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import type { LandingZoneItem } from '@/types/landingZone';
import type { LandingZoneState } from '../hooks/useLandingZone';
import { displayPath, formatBytes, isInside, parentOf, validateName } from '../utils';

const INPUT = 'w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 outline-none';
const CANCEL = 'px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold';
const PRIMARY = 'px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold';

// ---------------------------------------------------------------------------

export function NewFolderDialog({
  parentPath,
  working,
  onSubmit,
  onCheckExists,
  onClose,
}: {
  parentPath: string;
  working: boolean;
  onSubmit: (name: string) => Promise<boolean>;
  onCheckExists: (names: string[], isFolder: boolean, signal?: AbortSignal) => Promise<string[]>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [check, setCheck] = useState<ExistCheck>('idle');
  const [checkedName, setCheckedName] = useState<string | null>(null);
  const nameProblem = validateName(name);
  const nameKey = name.trim();
  const checked = check === 'done' && checkedName === nameKey;

  useEffect(() => {
    if (!nameKey || nameProblem) {
      setExisting(false);
      setCheck('idle');
      setCheckedName(null);
      return;
    }

    const ctrl = new AbortController();
    setCheck('checking');
    setCheckedName(null);
    const timer = setTimeout(() => {
      onCheckExists([nameKey], true, ctrl.signal)
        .then((names) => {
          if (ctrl.signal.aborted) return;
          setExisting(names.includes(nameKey));
          setCheckedName(nameKey);
          setCheck('done');
        })
        .catch(() => {
          if (ctrl.signal.aborted) return;
          setExisting(false);
          setCheckedName(nameKey);
          setCheck('failed');
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // Re-check only when the trimmed folder name changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameKey]);

  const submit = async () => {
    if (nameProblem) return setError(nameProblem);
    if (!checked || existing) return;
    if (await onSubmit(name.trim())) onClose();
  };

  return (
    <Modal maxWidth="max-w-md">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">Create New Folder</h3>
        <ModalCloseButton onClick={onClose} />
      </div>
      <div className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Parent Folder</label>
          <input readOnly value={displayPath(parentPath)} className={cn(INPUT, 'bg-slate-50 font-mono text-slate-500')} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Folder Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
            placeholder="e.g., dbo.schema"
            className={INPUT}
          />
          {error && <p className="text-rose-600 text-[11px] mt-1">{error}</p>}
          {check === 'checking' && <p className="text-[11px] text-slate-400 mt-1"><i className="fa-solid fa-spinner fa-spin mr-1.5" />Checking for an existing folder…</p>}
          {check === 'failed' && checkedName === nameKey && <p className="text-[11px] text-rose-600 mt-1"><i className="fa-solid fa-circle-info mr-1.5" />Could not check whether this folder name is available. Try again.</p>}
          {checked && existing && <p className="text-[11px] text-rose-600 mt-1"><i className="fa-solid fa-circle-exclamation mr-1.5" />A file or folder with this name already exists. Choose another name.</p>}
          {checked && !existing && <p className="text-[11px] text-emerald-600 mt-1"><i className="fa-solid fa-circle-check mr-1.5" />No folder with this name exists in this location.</p>}
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className={CANCEL}>Cancel</button>
        <button type="button" disabled={working || (!!nameKey && !nameProblem && (!checked || existing))} onClick={() => void submit()} className={PRIMARY}>
          {working && <i className="fa-solid fa-spinner fa-spin mr-1.5" />}
          {working ? 'Creating…' : 'Create'}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function RenameDialog({ item, working, onSubmit, onClose }: { item: LandingZoneItem; working: boolean; onSubmit: (newName: string) => Promise<boolean>; onClose: () => void }) {
  const [name, setName] = useState(item.name);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const problem = validateName(name);
    if (problem) return setError(problem);
    if (name.trim() === item.name) return setError('The new name is the same as the current name.');
    if (await onSubmit(name.trim())) onClose();
  };

  return (
    <Modal maxWidth="max-w-md">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">Rename Item</h3>
        <ModalCloseButton onClick={onClose} />
      </div>
      <div className="space-y-3 text-xs">
        <div>
          <label className="block font-semibold text-slate-500 mb-1">Current Name</label>
          <input readOnly value={item.name} className={cn(INPUT, 'bg-slate-50 font-mono')} />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">New Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
            className={INPUT}
          />
          {error && <p className="text-rose-600 text-[11px] mt-1">{error}</p>}
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className={CANCEL}>Cancel</button>
        <button type="button" disabled={working} onClick={() => void submit()} className={PRIMARY}>
          {working && <i className="fa-solid fa-spinner fa-spin mr-1.5" />}
          {working ? 'Renaming…' : 'Apply Rename'}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

export function DeleteDialog({ items, working, onConfirm, onClose }: { items: LandingZoneItem[]; working: boolean; onConfirm: () => Promise<boolean>; onClose: () => void }) {
  const hasFolder = items.some((i) => i.isFolder);
  return (
    <Modal maxWidth="max-w-md">
      <h3 className="text-base font-bold text-slate-900">Delete Selected Items?</h3>
      <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 text-xs space-y-2">
        <div className="font-bold text-rose-900">{items.length} item(s) will be permanently removed</div>
        <ul className="text-[11px] text-rose-800 font-mono space-y-1 max-h-28 overflow-y-auto pl-4 list-disc">
          {items.map((i) => (
            <li key={i.path} className="break-all">{i.name}{i.isFolder ? '/' : ''}</li>
          ))}
        </ul>
        {hasFolder && <p className="text-[11px] text-rose-700">Folders are deleted together with everything inside them.</p>}
      </div>
      <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
        <button type="button" onClick={onClose} className={CANCEL}>Cancel</button>
        <button
          type="button"
          disabled={working}
          onClick={async () => {
            if (await onConfirm()) onClose();
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold"
        >
          {working && <i className="fa-solid fa-spinner fa-spin mr-1.5" />}
          {working ? 'Deleting…' : 'Confirm Delete'}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

interface FlatFolder {
  path: string;
  disabled: boolean;
}

/** Folders known to the tree (opened so far); folders that were never opened are not listed. */
function useKnownFolders(state: LandingZoneState, mode: 'move' | 'copy', items: LandingZoneItem[]): FlatFolder[] {
  return useMemo(() => {
    const paths = new Set<string>(['']);
    Object.values(state.children).forEach((list) => list.forEach((f) => paths.add(f.path)));

    const moved = items.filter((i) => i.isFolder).map((i) => i.path);
    return Array.from(paths)
      .sort((a, b) => a.localeCompare(b))
      .map((path) => ({
        path,
        disabled:
          moved.some((m) => isInside(path, m)) || // never into itself
          (mode === 'move' && items.every((i) => parentOf(i.path) === path)), // already there
      }));
  }, [state.children, mode, items]);
}

export function TransferDialog({ mode, items, state, onSubmit, onClose }: { mode: 'move' | 'copy'; items: LandingZoneItem[]; state: LandingZoneState; onSubmit: (destination: string) => Promise<boolean>; onClose: () => void }) {
  const folders = useKnownFolders(state, mode, items);
  const [destination, setDestination] = useState<string | null>(null);
  const label = mode === 'move' ? 'Move' : 'Copy';

  return (
    <Modal maxWidth="max-w-lg">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">{label} {items.length} Item(s)</h3>
        <ModalCloseButton onClick={onClose} />
      </div>
      <div className="space-y-3 text-xs">
        <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex items-center justify-between">
          <span className="text-slate-500">Current Location:</span>
          <span className="font-mono font-bold text-slate-800">{displayPath(state.currentPath)}</span>
        </div>
        <div className="border border-slate-200 rounded-xl max-h-52 overflow-y-auto divide-y divide-slate-100">
          {folders.map((f) => (
            <label key={f.path || 'root'} className={cn('flex items-center space-x-2 px-3.5 py-2.5', f.disabled ? 'opacity-45 bg-slate-50' : 'hover:bg-indigo-50/40 cursor-pointer')}>
              <input type="radio" name="lzDestFolder" disabled={f.disabled} checked={destination === f.path} onChange={() => setDestination(f.path)} className="text-indigo-600" />
              <i className="fa-solid fa-folder text-amber-500" />
              <span className="font-mono text-xs break-all">{displayPath(f.path)}</span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-slate-400">Only folders already opened in the tree are listed. Expand a folder in the tree to see its sub-folders here.</p>
      </div>
      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className={CANCEL}>Cancel</button>
        <button
          type="button"
          disabled={destination === null || state.working}
          onClick={async () => {
            if (destination !== null && (await onSubmit(destination))) onClose();
          }}
          className={PRIMARY}
        >
          {state.working && <i className="fa-solid fa-spinner fa-spin mr-1.5" />}
          {state.working ? `${label === 'Move' ? 'Moving' : 'Copying'}…` : `${label} Here`}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

type ExistCheck = 'idle' | 'checking' | 'done' | 'failed';

export function UploadDialog({
  destination,
  working,
  onSubmit,
  onCheckExists,
  onClose,
}: {
  destination: string;
  working: boolean;
  onSubmit: (files: File[], overwrite: boolean) => Promise<boolean>;
  onCheckExists: (names: string[], isFolder: boolean, signal?: AbortSignal) => Promise<string[]>;
  onClose: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [overwrite, setOverwrite] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [existing, setExisting] = useState<ReadonlySet<string>>(() => new Set());
  const [check, setCheck] = useState<ExistCheck>('idle');

  // Ask the server which of the selected files are already in the destination folder.
  const namesKey = files.map((f) => f.name).join('\u0000');
  useEffect(() => {
    if (files.length === 0) {
      setExisting(new Set());
      setCheck('idle');
      return;
    }

    const ctrl = new AbortController();
    setCheck('checking');
    const timer = setTimeout(() => {
      onCheckExists(files.map((f) => f.name), false, ctrl.signal)
        .then((names) => {
          if (ctrl.signal.aborted) return;
          setExisting(new Set(names));
          setCheck('done');
        })
        .catch(() => {
          if (ctrl.signal.aborted) return;
          setExisting(new Set());
          setCheck('failed');
        });
    }, 250);

    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // re-check only when the set of file names changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey]);

  const conflicts = files.filter((f) => existing.has(f.name));
  const blocked = files.length === 0 || check !== 'done' || conflicts.length > 0;

  const add = (list: FileList | null) => {
    if (!list) return;
    // Copy the FileList now: the input is reset right after this call, which empties the live list.
    const picked = Array.from(list);
    setFiles((prev) => {
      const known = new Set(prev.map((f) => f.name));
      return [...prev, ...picked.filter((f) => !known.has(f.name))];
    });
  };

  return (
    <Modal maxWidth="max-w-xl">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base">
            <i className="fa-solid fa-cloud-arrow-up" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload Files</h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Destination: <span className="font-bold text-indigo-600">{displayPath(destination)}</span>
            </p>
          </div>
        </div>
        <ModalCloseButton onClick={onClose} />
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={cn('block border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all space-y-1.5', dragging ? 'border-indigo-500 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-500 bg-slate-50/60')}
      >
        <input type="file" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        <i className="fa-solid fa-file-arrow-up text-2xl text-indigo-600" />
        <p className="text-xs font-bold text-slate-800">
          Drag & drop files here or <span className="text-indigo-600 underline">Browse Files</span>
        </p>
      </label>

      {files.length > 0 && (
        <div className="space-y-1.5 max-h-44 overflow-y-auto">
          {files.map((f) => (
            <div key={f.name} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold truncate">{f.name} ({formatBytes(f.size) === '—' ? '0 B' : formatBytes(f.size)})</span>
              {existing.has(f.name) && (
                <span className={cn('ml-auto mr-2 shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border', overwrite ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200')}>
                  {overwrite ? 'Will be replaced' : 'Already exists'}
                </span>
              )}
              <button type="button" onClick={() => setFiles((prev) => prev.filter((x) => x !== f))} className="text-slate-400 hover:text-rose-600">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="flex items-center space-x-2 text-xs text-slate-600">
          <input type="checkbox" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
          <span>Overwrite files that already exist</span>
        </label>

        {check === 'checking' && (
          <p className="text-[11px] text-slate-400 pl-6"><i className="fa-solid fa-spinner fa-spin mr-1.5" />Checking for existing files…</p>
        )}
        {check === 'failed' && (
          <p className="text-[11px] text-slate-500 pl-6"><i className="fa-solid fa-circle-info mr-1.5" />Could not check for existing files; the server will decide on upload.</p>
        )}
        {check === 'done' && conflicts.length === 0 && (
          <p className="text-[11px] text-emerald-600 pl-6"><i className="fa-solid fa-circle-check mr-1.5" />No file with the same name exists in this folder.</p>
        )}
        {check === 'done' && conflicts.length > 0 && (
          <p className={cn('text-[11px] pl-6 leading-relaxed', overwrite ? 'text-amber-700' : 'text-rose-600')}>
            <i className={cn('fa-solid mr-1.5', overwrite ? 'fa-triangle-exclamation' : 'fa-circle-exclamation')} />
            {overwrite
              ? `${conflicts.length} existing file${conflicts.length === 1 ? '' : 's'} will be replaced: `
              : `${conflicts.length} file${conflicts.length === 1 ? '' : 's'} already exist${conflicts.length === 1 ? 's' : ''} and will fail unless you tick Overwrite: `}
            <span className="font-mono break-all">{conflicts.map((f) => f.name).join(', ')}</span>
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className={CANCEL}>Cancel</button>
        <button
          type="button"
          disabled={working || blocked}
          title={
            blocked
              ? files.length === 0
                ? 'Select at least one file before uploading.'
                : check === 'checking'
                  ? 'Wait until all selected file names have been checked.'
                  : check === 'failed'
                    ? 'Could not verify that the selected files are available for upload.'
                    : check === 'done' && conflicts.length > 0
                      ? 'Remove or rename the selected files that already exist.'
                      : 'Wait until all selected file names have been checked.'
              : undefined
          }
          onClick={async () => {
            if (await onSubmit(files, overwrite)) onClose();
          }}
          className={PRIMARY}
        >
          {working && <i className="fa-solid fa-spinner fa-spin mr-1.5" />}
          {working ? 'Uploading…' : 'Start Upload'}
        </button>
      </div>
    </Modal>
  );
}
