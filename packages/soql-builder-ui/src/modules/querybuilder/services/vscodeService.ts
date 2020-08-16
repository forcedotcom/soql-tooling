import { WindowService } from './windowService';

// declare function acquireVsCodeApi();
export class VscodeService {
    private vscode;
    public message;
    public windowService;
    constructor() {
        this.windowService = new WindowService();
        // @ts-ignore
        this.vscode = this.windowService.vscode;
        this.message = this.windowService.message;
        // eslint-disable-next-line no-debugger
        debugger;
    }
    public sendMessage(message: string) {
        if (this.vscode) {
            this.vscode.postMessage({
                type: 'add',
                message,
            });
        } else {
            console.error('no vscode');
        }
    }
    public getState() {
        let state = {};
        if (this.vscode) {
            state = this.vscode.getState();
            console.log('getState(): ', state);
            try {
                state = JSON.parse(state.toString());
            } catch(e) {
                console.error('could not parse state');
            }
        } else {
            console.error('no vscode');
        }
        return state;
    }

    public setState(state: string) {
        if (this.vscode) {
            this.vscode.setState(state);
        } else {
            console.log('cannot access vscode api');
        }
    }
}