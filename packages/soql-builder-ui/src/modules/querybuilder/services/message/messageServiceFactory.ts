import { hasVscode } from "../globals";
import { VscodeMessageService } from "./vscodeMessageService";
import { StandaloneMessageService } from "./standaloneMessageService";

export class MessageServiceFactory {
    public static create() {
        if (hasVscode()) {
            return new VscodeMessageService();
        } 
        return new StandaloneMessageService();
    }
}