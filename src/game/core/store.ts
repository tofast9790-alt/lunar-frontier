import { useSyncExternalStore } from "react";

/** Tiny observable store shared by React UI and the Phaser scene (no extra deps). */
export interface Store<T> {
  get: () => T;
  set: (patch: Partial<T> | ((s: T) => Partial<T>)) => void;
  replace: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
  readonly initial: T;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  return {
    initial,
    get: () => state,
    set: (patch) => {
      const p = typeof patch === "function" ? patch(state) : patch;
      state = { ...state, ...p };
      emit();
    },
    replace: (next) => {
      state = next;
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Subscribe a component to a store. Server render always uses the initial snapshot. */
export function useStore<T extends object>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.initial);
}
