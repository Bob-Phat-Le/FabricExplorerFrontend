import { useRef, useState, type DragEvent } from 'react';
import { cn } from '@/lib/cn';
import type { ConfigurationCapabilities } from '@/types/configuration';
import { formatBytes } from '../../utils';

interface UploadStepProps {
  caps: ConfigurationCapabilities;
  checking: boolean;
  fileName: string | null;
  issues: string[];
  onFile: (file: File) => void;
}

export function UploadStep({ caps, checking, fileName, issues, onFile }: UploadStepProps) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null | undefined) => {
    const file = files?.[0];
    if (file && !checking) onFile(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Choose a configuration file"
        onClick={() => !checking && input.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!checking) input.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
          dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-slate-50',
          checking && 'opacity-60 cursor-wait',
        )}
      >
        <input ref={input} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        <i className={`fa-solid ${checking ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'} text-3xl text-indigo-600`} />
        <p className="text-xs font-bold text-slate-800">
          {checking ? `Checking ${fileName ?? 'file'}…` : 'Drag & drop a Fabric Explorer configuration file here'}
        </p>
        <p className="text-[11px] text-slate-400">or click to browse files on your device</p>
      </div>

      {issues.length > 0 && (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs space-y-1">
          <div className="flex items-center space-x-2 font-bold text-rose-900">
            <i className="fa-solid fa-circle-exclamation text-rose-600" />
            <span>{fileName ? `${fileName} cannot be imported` : 'This file cannot be imported'}</span>
          </div>
          <ul className="list-disc pl-5 text-[11px] space-y-0.5">
            {issues.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-slate-400 text-center">
        JSON only · up to {formatBytes(caps.maxFileSizeBytes)} · format version {caps.supportedFormatVersions.join(', ')} · at most{' '}
        {caps.maxEntriesPerType.toLocaleString()} entries per type
      </p>
    </div>
  );
}
