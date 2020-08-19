export function getWindow() {
    return window;
}

export function getLocalStorage() {
    return localStorage;
}

export function hasVscode() {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    return ('undefined' !== typeof acquireVsCodeApi);
}

export function getVscode() {
    if (hasVscode()) {
        // @ts-ignore
        // eslint-disable-next-line no-undef
        return acquireVsCodeApi();
    }
    return false;
}