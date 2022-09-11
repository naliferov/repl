export default class LocalState {

    constructor() {
        const openedTabsJSON = localStorage.getItem('openedTabs');
        this.openedTabs = openedTabsJSON ? JSON.parse(openedTabsJSON) : {};

        const markedJSON = localStorage.getItem('marked');
        this.marked = markedJSON ? JSON.parse(markedJSON) : {};
    }

    openTab(nodeId) {
        this.openedTabs[nodeId] = {};
        localStorage.setItem('openedTabs', JSON.stringify(this.openedTabs));
    }

    getOpenedTabs() {
        const openedScriptsJSON = localStorage.getItem('openedTabs');
        return openedScriptsJSON ? JSON.parse(openedScriptsJSON) : {};
    }

    closeTab(nodeId) {
        delete this.openedTabs[nodeId];
        localStorage.setItem('openedTabs', JSON.stringify(this.openedTabs));
    }

    setActiveTabId(tabId) { localStorage.setItem('activeTabId', tabId); }
    getActiveTabId() { return localStorage.getItem('activeTabId'); }

    setLogPanelFlag(flag) { flag ? localStorage.setItem('logPanelFlag', '1') : localStorage.removeItem('logPanelFlag') }
    getLogPanelFlag(flag) { return localStorage.getItem('logPanelFlag') }

    setMarkedASTNodeId(nodeId, astNodeId) {
        this.marked[nodeId] = astNodeId;
        localStorage.setItem('marked', JSON.stringify(this.marked));
    }
    getMarkedASTNodeId(nodeId) { return this.marked[nodeId]; }
    getLogPanelHeight() { return localStorage.getItem('logPanelHeight'); }
    setLogPanelHeight(y) { localStorage.setItem('logPanelHeight', y); }
}