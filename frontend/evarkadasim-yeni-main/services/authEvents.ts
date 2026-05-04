// Basit event bus — 401 gelince tüm dinleyicileri (sadece _layout) haberdar eder.
// React context veya Redux olmadan global auth state değişikliğini iletmenin
// en az bağımlılıklı yolu budur.
type Listener = () => void;
const listeners = new Set<Listener>();

export const authEvents = {
  onUnauthorized: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn); // cleanup için unsubscribe fonksiyonu döner
  },
  emitUnauthorized: () => listeners.forEach(fn => fn()),
};
