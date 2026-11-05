// Bir veri değişince açık ekranların kendini yenilemesi için.
export function createChangeSignal() {
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify() {
      listeners.forEach((listener) => listener());
    },
  };
}
