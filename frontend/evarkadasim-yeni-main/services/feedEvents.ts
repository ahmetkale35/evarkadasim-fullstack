type Listener = () => void;
const listeners = new Set<Listener>();

export const feedEvents = {
  onRefreshNeeded: (fn: Listener) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
  emitRefreshNeeded: () => listeners.forEach(fn => fn()),
};
