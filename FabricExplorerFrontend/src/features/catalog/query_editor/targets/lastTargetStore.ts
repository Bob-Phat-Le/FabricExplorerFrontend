/** Remembers, per connection, the item last used as the query target (survives navigation, not the tab). */
const key = (connectionId: string) => `fabric-explorer:query-target:${connectionId}`;

export const lastTargetStore = {
  read(connectionId: string): string | null {
    try {
      return window.sessionStorage.getItem(key(connectionId));
    } catch {
      return null;
    }
  },
  write(connectionId: string, itemId: string) {
    try {
      window.sessionStorage.setItem(key(connectionId), itemId);
    } catch {
      /* storage unavailable (private mode / quota): the first item is simply picked next time */
    }
  },
};
