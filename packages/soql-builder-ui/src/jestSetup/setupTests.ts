export class VsCodeApi {
    public state;
    public message;
    getState() {
        return this.state;
    }
    setState(state: string) {
        this.state=state;
    }
    postMessage(message: string) {
        this.message = message;
    }
}
export const vscodeInstance = new VsCodeApi();
export function acquireVsCodeApi() {
    return vscodeInstance;
}
// @ts-ignore
global.acquireVsCodeApi = acquireVsCodeApi;