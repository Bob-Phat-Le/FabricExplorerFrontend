import { useEffect, type RefObject } from 'react';

/** Gọi `handler` khi người dùng bấm ra ngoài phần tử `ref` (chỉ lắng nghe khi `enabled`). */
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [ref, handler, enabled]);
}
