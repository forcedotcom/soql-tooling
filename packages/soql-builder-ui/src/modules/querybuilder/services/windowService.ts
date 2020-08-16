import { BehaviorSubject } from 'rxjs';

export function getWindow() {
    return window;
}

export class WindowService {
    // should probably expose an observable instead of a behavior subject
    public message: BehaviorSubject<string>;
    public vscode;
    constructor() {
        this.message = new BehaviorSubject<string>('');
        getWindow().addEventListener('message', (message: MessageEvent) => {
            // eslint-disable-next-line no-debugger
            debugger;
            this.message.next(message.data);
        });
        // @ts-ignore
        this.vscode = getWindow().acquireVsCodeApi ? getWindow().acquireVsCodeApi() : false;
    }
  }

