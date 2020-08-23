import { getWindow, hasVscode, getVscode } from "./globals";
import { getLocalStorage } from './globals';
describe.only('Globals should', () => {
    it('expose window', () => {
        expect(getWindow()).toBeTruthy();
    });
    it('expose localstorage', () => {
        expect(getLocalStorage).toBeTruthy();
    });
    it('expose vscode', () => {
        expect(hasVscode()).toBeTruthy();
    });
});