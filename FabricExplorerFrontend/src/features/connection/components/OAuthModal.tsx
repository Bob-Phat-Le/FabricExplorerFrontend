import { useRef, useState } from 'react';
import * as connectionsApi from '@/lib/api/connections.api';
import { BUSY_CLASS, useBusy } from '@/hooks/useBusy';
import { useToast } from '@/providers/ToastProvider';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import type { Connection, ConnectionPayload } from '@/types/connection';
import { TOKEN_PATH_RE, tokenEndpointOf } from '../utils';

interface Props {
  isEdit: boolean;
  conn: Connection | null;
  onClose: () => void;
  onSaved: (saved: Connection | undefined, isEdit: boolean) => Promise<void>;
}

type FieldName = | 'name' | 'workspaceId' | 'endpoint' | 'clientId' | 'clientSecret';

type FieldErrors = Partial<Record<FieldName, string>>;

const INPUT =
  'w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none';

const BUTTONS = ['btnOauthTest', 'btnOauthSave'];

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALIDATION_DELAY = 1200;

function Field({ label, required, error, showError, children, }: { label: string; required?: boolean; error?: string; showError: boolean; children: React.ReactNode; }) {
  return (
    <div className="relative space-y-1.5">
      <label className="block font-semibold text-slate-800">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      {showError && error && (
        <div className="absolute left-0 bottom-full z-50 mb-1 max-w-full rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-600 shadow-sm">
          {error}
        </div>
      )}

      {children}

      {!showError && error && (
        <span
          className="absolute -left-5 bottom-3 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white"
          title={error}
        >
          !
        </span>
      )}
    </div>
  );
}

export function OAuthModal({ isEdit, conn, onClose, onSaved }: Props) {
  const { showToast, showApiError } = useToast();
  const { isBusy, withBusy } = useBusy();

  const [name, setName] = useState(conn?.name ?? '');
  const [workspaceId, setWorkspaceId] = useState(conn?.workspaceId ?? '');
  const [endpoint, setEndpoint] = useState(tokenEndpointOf(conn));
  const [clientId, setClientId] = useState(conn?.clientId ?? '');
  const [clientSecret, setClientSecret] = useState('');

  const [errors, setErrors] = useState<FieldErrors>({});
  const [focusedField, setFocusedField] = useState<FieldName | null>(null);

  const timers = useRef<Partial<Record<FieldName, ReturnType<typeof setTimeout>>>>({});

  const busy = isBusy(BUTTONS[0]) || isBusy(BUTTONS[1]);

  function getValue(field: FieldName): string {
    switch (field) {
      case 'name':
        return name;
      case 'workspaceId':
        return workspaceId;
      case 'endpoint':
        return endpoint;
      case 'clientId':
        return clientId;
      case 'clientSecret':
        return clientSecret;
    }
  }

  function validate(field: FieldName, value = getValue(field)): string | null {
    const v = value.trim();

    switch (field) {
      case 'name':
        return v ? null : 'Connection Name is required.';

      case 'workspaceId':
        if (!v) return 'Workspace ID is required.';
        return GUID_RE.test(v) ? null : 'Workspace ID must be a valid GUID.';

      case 'endpoint': {
        if (!v) return 'Token Endpoint is required.';

        try {
          const url = new URL(v);
          const tenantId = url.pathname.match(TOKEN_PATH_RE)?.[1];

          if (!tenantId)
            return 'Token endpoint must look like https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token';

          if (!GUID_RE.test(tenantId))
            return 'Tenant ID in the token endpoint must be a valid GUID.';

          return null;
        } catch {
          return 'Token endpoint must be a valid URL.';
        }
      }

      case 'clientId':
        if (!v) return 'Client ID is required.';
        return GUID_RE.test(v) ? null : 'Client ID must be a valid GUID.';

      case 'clientSecret':
        if (!isEdit && !v) return 'Client Secret is required.';
        return null;
    }
  }

  function clearTimer(field: FieldName) {
    const timer = timers.current[field];

    if (timer) {
      clearTimeout(timer);
      delete timers.current[field];
    }
  }

  function scheduleValidation(field: FieldName, value = getValue(field)) {
    clearTimer(field);

    timers.current[field] = setTimeout(() => {
      setErrors((current) => ({
        ...current,
        [field]: validate(field, value) ?? undefined,
      }));

      delete timers.current[field];
    }, VALIDATION_DELAY);
  }

  function handleFocus(field: FieldName) {
    setFocusedField(field);

    if (errors[field]) {
      return;
    }

    scheduleValidation(field);
  }

  function handleChange(
    field: FieldName,
    value: string,
    setter: (value: string) => void,
  ) {
    setter(value);

    // User is actively typing: hide the current error and restart debounce.
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    scheduleValidation(field, value);
  }

  function handleBlur(field: FieldName) {
    if (focusedField === field) {
      setFocusedField(null);
    }
  }

  function collect(): ConnectionPayload | null {
    const v = {
      name: name.trim(),
      workspaceId: workspaceId.trim(),
      endpoint: endpoint.trim(),
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    };

    const missing: string[] = [];

    if (!v.name) missing.push('Connection Name');
    if (!v.workspaceId) missing.push('Workspace ID');
    if (!v.endpoint) missing.push('Token Endpoint');
    if (!v.clientId) missing.push('Client ID');
    if (!isEdit && !v.clientSecret) missing.push('Client Secret');

    if (missing.length) {
      showToast(`Please fill in: ${missing.join(', ')}`, 'warning');
      return null;
    }

    if (!GUID_RE.test(v.workspaceId)) {
      showToast('Workspace ID must be a valid GUID.', 'warning');
      return null;
    }

    if (!GUID_RE.test(v.clientId)) {
      showToast('Client ID must be a valid GUID.', 'warning');
      return null;
    }

    let tenantId: string | null = null;

    try {
      tenantId = new URL(v.endpoint).pathname.match(TOKEN_PATH_RE)?.[1] ?? null;
    } catch { }

    if (!tenantId) {
      showToast(
        'Token endpoint must look like https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token',
        'warning',
      );
      return null;
    }

    if (!GUID_RE.test(tenantId)) {
      showToast('Tenant ID in the token endpoint must be a valid GUID.', 'warning');
      return null;
    }

    const payload: ConnectionPayload = {
      name: v.name,
      workspaceId: v.workspaceId,
      tenantId,
      tokenEndpoint: v.endpoint,
      clientId: v.clientId,
    };

    if (v.clientSecret) {
      payload.clientSecret = v.clientSecret;
    }

    return payload;
  }

  const runTest = async () => {
    const payload = collect();
    if (!payload) return;

    await withBusy(BUTTONS, async () => {
      try {
        if (isEdit && conn && !payload.clientSecret) {
          await connectionsApi.testSaved(conn.id);
          showToast(
            'Saved credentials verified. Re-enter the client secret to test your edits.',
            'success',
          );
        } else {
          await connectionsApi.test({ ...payload, isProtected: false });
          showToast('OAuth 2.0 & Workspace access verified', 'success');
        }
      } catch (err) {
        showApiError(err, 'Connection test failed');
      }
    });
  };

  const runSave = async () => {
    const payload = collect();
    if (!payload) return;

    await withBusy(BUTTONS, async () => {
      let saved: Connection | undefined;

      try {
        saved =
          isEdit && conn
            ? await connectionsApi.update(conn.id, payload)
            : await connectionsApi.save(payload);
      } catch (err) {
        showApiError(err, 'Could not save connection');
        return;
      }

      await onSaved(saved, isEdit);
    });
  };

  return (
    <Modal maxWidth="max-w-4xl">
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shrink-0 border border-indigo-100">
            <i className="fa-brands fa-microsoft" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Microsoft Entra ID
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure an OAuth 2.0 connection to Microsoft Fabric.
            </p>
          </div>
        </div>

        <ModalCloseButton onClick={onClose} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4 text-xs">
          <Field
            label="Connection Name"
            required
            error={errors.name}
            showError={focusedField === 'name'}
          >
            <input
              type="text"
              value={name}
              onFocus={() => handleFocus('name')}
              onBlur={() => handleBlur('name')}
              onChange={(e) =>
                handleChange('name', e.target.value, setName)
              }
              className={INPUT}
            />
          </Field>

          <Field
            label="Workspace ID"
            required
            error={errors.workspaceId}
            showError={focusedField === 'workspaceId'}
          >
            <input
              type="text"
              value={workspaceId}
              onFocus={() => handleFocus('workspaceId')}
              onBlur={() => handleBlur('workspaceId')}
              onChange={(e) =>
                handleChange('workspaceId', e.target.value, setWorkspaceId)
              }
              className={`${INPUT} font-mono`}
            />
          </Field>

          <Field
            label="OAuth 2.0 Token Endpoint"
            required
            error={errors.endpoint}
            showError={focusedField === 'endpoint'}
          >
            <input
              type="url"
              value={endpoint}
              onFocus={() => handleFocus('endpoint')}
              onBlur={() => handleBlur('endpoint')}
              onChange={(e) =>
                handleChange('endpoint', e.target.value, setEndpoint)
              }
              className={`${INPUT} font-mono`}
            />
          </Field>

          <Field
            label="Client ID"
            required
            error={errors.clientId}
            showError={focusedField === 'clientId'}
          >
            <input
              type="text"
              value={clientId}
              onFocus={() => handleFocus('clientId')}
              onBlur={() => handleBlur('clientId')}
              onChange={(e) =>
                handleChange('clientId', e.target.value, setClientId)
              }
              className={`${INPUT} font-mono`}
            />
          </Field>

          <Field
            label="Client Secret"
            required={!isEdit}
            error={errors.clientSecret}
            showError={focusedField === 'clientSecret'}
          >
            <input
              type="password"
              autoComplete="new-password"
              value={clientSecret}
              placeholder={
                isEdit ? 'Leave blank to keep the current secret' : ''
              }
              onFocus={() => handleFocus('clientSecret')}
              onBlur={() => handleBlur('clientSecret')}
              onChange={(e) =>
                handleChange(
                  'clientSecret',
                  e.target.value,
                  setClientSecret,
                )
              }
              className={`${INPUT} font-mono`}
            />
          </Field>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs h-fit">
          <h4 className="font-bold text-slate-900 text-xs border-b pb-2">
            Connection Summary
          </h4>

          <dl className="space-y-2 text-[11px]">
            <div>
              <dt className="text-slate-400">Name</dt>
              <dd className="font-bold text-slate-900">
                {name || 'New Connection'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400">Workspace</dt>
              <dd className="font-bold text-slate-800">
                {conn
                  ? conn.workspaceName || conn.workspaceId || '-'
                  : '-'}
              </dd>
            </div>

            <div>
              <dt className="text-slate-400">Authentication</dt>
              <dd className="font-semibold text-slate-800">
                Entra ID · OAuth 2.0
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200"
        >
          Cancel
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={runTest}
            disabled={busy}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 ${
              busy ? BUSY_CLASS : ''
            }`}
          >
            Test Connection
          </button>

          <button
            type="button"
            onClick={runSave}
            disabled={busy}
            className={`px-5 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 ${
              busy ? BUSY_CLASS : ''
            }`}
          >
            Save Connection
          </button>
        </div>
      </div>
    </Modal>
  );
}