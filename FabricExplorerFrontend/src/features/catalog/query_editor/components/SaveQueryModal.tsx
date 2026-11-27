import { useState, type FormEvent } from 'react';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import { RadioCard } from '@/components/ui/RadioCard';
import { ApiError } from '@/lib/api/client';
import * as savedQueriesApi from '@/lib/api/savedQueries.api';
import { useToast } from '@/providers/ToastProvider';
import type { Connection } from '@/types/connection';
import type { QueryDraft } from '@/types/savedQuery/QueryDraft';
import type { QueryTargetItem } from '@/types/savedQuery/QueryTargetItem';
import type { SaveMode } from '@/types/savedQuery/SaveMode';
import type { SavedQuery } from '@/types/savedQuery/SavedQuery';
import type { SavedQueryTarget } from '@/types/savedQuery/SavedQueryTarget';
import { SAVED_QUERY_DESCRIPTION_MAX, SAVED_QUERY_ERROR, SAVED_QUERY_LANGUAGE, SAVED_QUERY_NAME_MAX } from '../constants';
import { targetIconOf, targetLabelOf } from '../targets/targetSources';

interface SaveQueryModalProps {
  draft: QueryDraft & { target: QueryTargetItem };
  connection: Connection;
  /** The saved query the editor content came from: it can be updated instead of saving a copy. */
  loaded: SavedQuery | null;
  onClose: () => void;
  onSaved: (query: SavedQuery) => void;
}

const INPUT =
  'w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-500';

export function SaveQueryModal({ draft, connection, loaded, onClose, onSaved }: SaveQueryModalProps) {
  const { showToast, showApiError } = useToast();

  const [mode, setMode] = useState<SaveMode>(loaded ? 'update' : 'new');
  const [name, setName] = useState(loaded?.name ?? '');
  const [description, setDescription] = useState(loaded?.description ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const target: SavedQueryTarget = { itemType: draft.target.type, itemId: draft.target.id, itemName: draft.target.name };
  const updating = mode === 'update' && loaded !== null;

  const chooseMode = (next: SaveMode) => {
    setMode(next);
    setNameError(null);
    // saving a copy under the same name would be rejected as a duplicate: start from a different one
    if (loaded && next === 'new' && name === loaded.name) setName(`${loaded.name} (copy)`);
    if (loaded && next === 'update' && name === `${loaded.name} (copy)`) setName(loaded.name);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) return setNameError('Give the query a name.');
    if (trimmed.length > SAVED_QUERY_NAME_MAX) return setNameError(`Name must be at most ${SAVED_QUERY_NAME_MAX} characters.`);
    if (description.length > SAVED_QUERY_DESCRIPTION_MAX)
      return setFormError(`Description must be at most ${SAVED_QUERY_DESCRIPTION_MAX} characters.`);

    setBusy(true);
    setNameError(null);
    setFormError(null);

    try {
      const saved =
        updating && loaded
          ? await savedQueriesApi.update(loaded.id, {
              name: trimmed,
              description: description.trim(),
              target,
              sql: draft.sql,
              ...(draft.maxRows === null ? { unlimitedRows: true } : { maxRows: draft.maxRows }),
            })
          : await savedQueriesApi.create({
              name: trimmed,
              description: description.trim() || null,
              connectionId: connection.id,
              target,
              language: SAVED_QUERY_LANGUAGE,
              sql: draft.sql,
              maxRows: draft.maxRows,
            });

      showToast(updating ? `Updated saved query “${saved.name}”` : `Saved query “${saved.name}”`, 'success');
      onSaved(saved);
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === SAVED_QUERY_ERROR.duplicated)
        setNameError('A saved query with this name already exists for this connection.');
      else if (err instanceof ApiError && err.status === 400) setFormError(err.message);
      else showApiError(err, 'Could not save the query');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal maxWidth="max-w-lg">
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">{updating ? 'Update Saved Query' : 'Save SQL Query'}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Saved for connection <strong className="text-slate-700">{connection.name}</strong>
            </p>
          </div>
          <ModalCloseButton onClick={busy ? () => undefined : onClose} />
        </div>

        <div className="space-y-4 text-xs">
          {loaded && (
            <div className="grid grid-cols-2 gap-3">
              <RadioCard
                name="saveMode"
                value="update"
                selected={mode === 'update'}
                onSelect={() => chooseMode('update')}
                title="Update existing"
                description={`Overwrite “${loaded.name}” with the current SQL and settings.`}
              />
              <RadioCard
                name="saveMode"
                value="new"
                selected={mode === 'new'}
                onSelect={() => chooseMode('new')}
                title="Save as new"
                description="Keep the original and store this as another query."
              />
            </div>
          )}

          <div>
            <label htmlFor="saveQueryName" className="block font-semibold text-slate-700 mb-1">
              Query Name
            </label>
            <input
              id="saveQueryName"
              autoFocus
              type="text"
              value={name}
              maxLength={SAVED_QUERY_NAME_MAX}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              placeholder="e.g. Active customers"
              aria-invalid={nameError !== null}
              className={`${INPUT} ${nameError ? 'border-rose-400' : 'border-slate-300'}`}
            />
            {nameError && <p className="text-[11px] text-rose-600 mt-1">{nameError}</p>}
          </div>

          <div>
            <label htmlFor="saveQueryDescription" className="block font-semibold text-slate-700 mb-1">
              Description <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="saveQueryDescription"
              rows={2}
              value={description}
              maxLength={SAVED_QUERY_DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              className={`${INPUT} border-slate-300 resize-none`}
            />
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center space-x-2 min-w-0">
                <i className={`fa-solid ${targetIconOf(target.itemType)} text-indigo-600`} />
                <span className="font-bold text-slate-800 truncate">{target.itemName}</span>
                <span className="text-[10px] text-slate-500 shrink-0">{targetLabelOf(target.itemType)}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                Max rows: {draft.maxRows === null ? 'Unlimited' : draft.maxRows.toLocaleString()}
              </span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed text-emerald-400 bg-slate-900 rounded-lg p-2.5 max-h-32 overflow-auto whitespace-pre-wrap">
              {draft.sql}
            </pre>
          </div>

          <p className="text-[11px] text-slate-500">
            The SQL is stored as written and is included when you export your configuration. Avoid literals you do not want to share.
          </p>

          {formError && (
            <p className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <i className="fa-solid fa-circle-xmark mr-1.5" />
              {formError}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5"
          >
            <i className={`${busy ? 'fa-solid fa-spinner fa-spin' : 'fa-regular fa-bookmark'} text-[10px]`} />
            <span>{busy ? 'Saving…' : updating ? 'Update Query' : 'Save Query'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
