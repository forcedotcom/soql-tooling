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
global.acquireVsCodeApi = acquireVsCodeApi;
