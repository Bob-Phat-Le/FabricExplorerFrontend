import { cn } from '@/lib/cn';
import { pageWindow } from '../utils';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  count: number;
  onChange: (page: number) => void;
}

const BASE = 'min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg border transition-colors';

function PageButton({
  children,
  onClick,
  disabled = false,
  current = false,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  current?: boolean;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={!disabled && !current ? onClick : undefined}
      className={cn(
        BASE,
        current ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

const Icon = ({ name }: { name: string }) => <i className={`fa-solid ${name} text-[10px]`} />;

export function Pagination({ page, pageSize, total, totalPages, count, onChange }: PaginationProps) {
  const pages = Math.max(1, totalPages);
  const from = count ? (page - 1) * pageSize + 1 : 0;
  const to = count ? from + count - 1 : 0;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100',
        total === 0 && 'hidden',
      )}
    >
      <span className="text-[11px] text-slate-400">{`Showing ${from}–${to} of ${total} · Page ${page} / ${pages}`}</span>
      <div className="flex items-center space-x-1">
        <PageButton title="First page" disabled={page <= 1} onClick={() => onChange(1)}>
          <Icon name="fa-angles-left" />
        </PageButton>
        <PageButton title="Previous page" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <Icon name="fa-chevron-left" />
        </PageButton>
        {pageWindow(page, pages).map((p) => (
          <PageButton key={p} title={`Page ${p}`} current={p === page} onClick={() => onChange(p)}>
            {p}
          </PageButton>
        ))}
        <PageButton title="Next page" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          <Icon name="fa-chevron-right" />
        </PageButton>
        <PageButton title="Last page" disabled={page >= pages} onClick={() => onChange(pages)}>
          <Icon name="fa-angles-right" />
        </PageButton>
      </div>
    </div>
  );
}
