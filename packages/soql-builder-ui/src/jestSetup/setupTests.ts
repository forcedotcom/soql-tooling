// Polyfill for jest 29 compatibility
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.global = globalThis;

// Mock localStorage for jest environment
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index: number) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

const localStorageInstance = new LocalStorageMock();

// Use Object.defineProperty to ensure localStorage is always available
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageInstance,
  writable: true,
  configurable: true
});

Object.defineProperty(global, 'localStorage', {
  value: localStorageInstance,
  writable: true,
  configurable: true
});

// Also set it on window if window exists
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageInstance,
    writable: true,
    configurable: true
  });
}

export class VsCodeApi {
  public state: string;
  public message: string;
  public getState(): string {
    return this.state;
  }
  public setState(state: string): void {
    this.state = state;
  }
  public postMessage(message: string): void {
    this.message = message;
  }
}
export const vscodeInstance = new VsCodeApi();
export function acquireVsCodeApi(): VsCodeApi {
  return vscodeInstance;
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.acquireVsCodeApi = acquireVsCodeApi;
