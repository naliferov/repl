import V from "../type/V.js";
import Nodes from "./module/outliner/Nodes.js";
import LocalState from "./Localstate.js";
import TabManager from "./module/editor/astEditor/tabs/TabManager.js";
import Input from "./Input.js";
import AstToJs from "./module/editor/astEditor/transform/AstToJs.js";
import HttpClient from "../io/http/HttpClient.js";
import ModuleImports from "./module/editor/astEditor/nodes/module/ModuleImports.js";
import ModuleCallableCondition from "./module/editor/astEditor/nodes/module/ModuleCallableCondition.js";
import ModuleBody from "./module/editor/astEditor/nodes/module/ModuleBody.js";
import Callable from "./module/editor/astEditor/nodes/conditionAndBody/call/callable/Callable.js";
import Call from "./module/editor/astEditor/nodes/conditionAndBody/call/call/Call.js";
import CallConditionPart from "./module/editor/astEditor/nodes/conditionAndBody/call/call/CallConditionPart.js";
import AstEditor from "./module/editor/astEditor/control/AstEditor.js";
import Btn from "../type/Btn.js";
import ConsolePanel from "./module/editor/astEditor/ConsolePanel.js";

export default class IDE {

    async start(app) {

        const localState = new LocalState;
        const input = new Input(window);
        const http = new HttpClient;

        //later move this to loop some king of loop manager
        e['loopServiceUrl'] = () => 'http://localhost:8099';

        const pageIDE = new V({class: ['pageIDE']});
        e('>', [pageIDE, app]);

        this.createPopup(pageIDE);

        const consolePanel = new ConsolePanel(input, localState);
        e('>', [consolePanel.getV(), pageIDE]);
        consolePanel.listenConsoleEvents();

        const sideBar = new V({class: 'sidebar'});
        e('>', [sideBar, pageIDE]);

        const sideBarBtnsBar = new V({class: 'btnsBar'});
        e('>', [sideBarBtnsBar, sideBar]);
        const addNodeBtn = new V({class: ['btn'], txt: '+'});
        e('>', [addNodeBtn, sideBarBtnsBar]);

        const logout = new Btn('logout');
        e('>', [logout, sideBarBtnsBar]);
        //logout.on('click', () => e('ASTNextVersion'));

        const nodes = new Nodes;
        await nodes.init();
        e('>', [nodes.getV(), sideBar]);

        const mainContainer = new V({class: 'mainContainer'});
        e('>', [mainContainer, pageIDE]);

        const btnsBar = new V({class: 'btnsBar'});
        e('>', [btnsBar, mainContainer]);

        const run = new V({class: 'btn', txt: 'run'});
        e('>', [run, btnsBar]);
        run.on('click', () => {
            //http.post('/console', {groupId: node.get('id'), js});

            const activeTab = tabManager.getActiveTab();
            if (!activeTab) return;
            const js = `x('${activeTab.getContextNode().get('id')}')`;
            http.post(window.e('loopServiceUrl') + '/console', {js});
        });
        const consoleBtn = new V({class: 'btn', txt: 'console'});
        e('>', [consoleBtn, btnsBar]);
        consoleBtn.on('click', () => {
            consolePanel.switchVisibility();
        });

        // const prev = new V({class: 'btn', txt: 'versionPrev'});
        // e('>', [prev, btnsBar]);
        // prev.on('click', () => e('ASTPrevVersion'));
        //
        // const next = new Btn('versionNext');
        // e('>', [next, btnsBar]);
        // next.on('click', () => e('ASTNextVersion'));

        // let procsListIsActive = false;
        // const procsList = new ProcsList(this.popup, nodes);
        // const procsListBtn = new Btn('process list');
        // e('>', [procsListBtn, btnsBar]);
        // procsListBtn.on('click', async () => {
        //     if (procsListIsActive) { e('popupClose'); return; }
        //     e('popupOpen');
        // });

        consolePanel.switchVisibility();

        //const consoleBtn = new Btn('console');
        //e('>', [logout, btnsBar]);
        //logout.on('click', () => e('ASTNextVersion'));



        const tabManager = new TabManager(nodes, localState);
        e('>', [tabManager.getV(), mainContainer]);


        e['openNode'] = async ({node}) => tabManager.openTab(node);
        e['nodesEditorMod'] = () => {
            input.onKeyDown(async (e) => await nodes.handleKeyDown(e));
            input.onKeyUp(async (e) => await nodes.handleKeyUp(e));
            input.onDblClick(async (e) => await nodes.handleDblClick(e));
        };
        e['nodeEditorMod'] = () => {
            input.onKeyDown(async (e) => await tabManager.onKeyDown(e));
            input.onClick(async (e) => await tabManager.onClick(e));
        }
        e['disableGlobalInputHandlers'] = () => input.disableHandlers();

        e['astNodeEditModStart'] = () => e('disableGlobalInputHandlers');
        e['astNodeEditModStop'] = () => e('nodeEditorMod');
        e['popupOpen'] = async () => {
            await procsList.show();
            await this.showPopup();
            //procsListIsActive = true;
            e('disableGlobalInputHandlers');
        }
        e['popupClose'] = () => {
            this.popup.clear();
            this.hidePopup();
            //procsListIsActive = false;
            e('nodeEditorMod');
        }

        e['ASTPrevVersion'] = () => tabManager.ASTPrevVersion();
        e['ASTNextVersion'] = () => tabManager.ASTNextVersion();

        e['procStart'] = async () => {
            const activeTab = tabManager.getActiveTab();
            if (!activeTab) return;

            const node = activeTab.getContextNode();
            const lastASTVersion = activeTab.getEditor().getLastASTVersion();
            const js = new AstToJs().createJsCode(node, lastASTVersion);

            const {data} = await http.post('/proc/start', {groupId: node.get('id'), js});
            //console.log(data);
        }
        e['procStop'] = async ({procsIds}) => (await http.post('/proc/stop', {procsIds})).data;
        e['markASTNode'] = async ([contextNode, ASTNode]) => {
            const contextNodeId = contextNode.get('id');
            let ASTNodeId = ASTNode.getId();
            if (ASTNode instanceof ModuleImports ||
                ASTNode instanceof ModuleCallableCondition ||
                ASTNode instanceof ModuleBody
            ) {
                ASTNodeId = ASTNode.constructor.name
            }

            localState.setMarkedASTNodeId(contextNodeId, ASTNodeId);

            if (ASTNode instanceof Call) {
                const children = ASTNode.getCondition().getChildren();

                for (let i = 0; i < children.length; i++) {
                    const astNode = window.astPool.get(children[i].id);
                    const childrenOfPart = astNode.getInternal().getChildren();

                    for (let x = 0; x < childrenOfPart.length; x++) {
                        const internalNode = window.astPool.get(childrenOfPart[x].id);
                        if (internalNode instanceof Callable) {
                            internalNode.getBody().highlight();
                        }
                    }
                }
            } else if (ASTNode instanceof CallConditionPart) {

                const children = ASTNode.getInternal().getChildren();
                for (let x = 0; x < children.length; x++) {
                    const internalNode = window.astPool.get(children[x].id);
                    if (internalNode instanceof Callable) {
                        internalNode.getBody().highlight();
                    }
                }
            } else if (ASTNode instanceof Callable) ASTNode.getBody().highlight();
        }

        const s = () => nodes.save();
        e['ASTChange'] = s;
        e['nodeChange'] = s;
        e['logBtnClick'] = async () => logPanel.switchVisibility();

        nodes.getV().on('click', () => e('nodesEditorMod'));
        tabManager.getV().on('click', () => {
            const activeTab = tabManager.getActiveTab(); if (!activeTab) return;
            const editor = activeTab.getEditor();
            if (activeTab && editor instanceof AstEditor && editor.isASTNodeEditorIsActive()) {
                return;
            }
            e('nodeEditorMod');
        });
        e('nodeEditorMod');


        const activeTabId = localState.getActiveTabId();
        const openedFx = localState.getOpenedTabs();

        for (let nodeId in openedFx) {
            const node = await nodes.getNodeById(nodeId);
            if (!node) {
                localState.closeTab(nodeId);
                continue;
            }
            tabManager.openTab(node);
            const tab = tabManager.getTabByContextNode(node);

            const editor = tab.getEditor();
            if (editor instanceof AstEditor) {
                const module = editor.getModuleNode();
                const markedASTNodeId = localState.getMarkedASTNodeId(tab.getContextNodeId());
                if (!markedASTNodeId) continue;

                const ASTNode = {
                    [ModuleImports.name]: module.getImports(),
                    [ModuleCallableCondition.name]: module.getCallableCondition(),
                    [ModuleBody.name]: module.getBody()
                }[markedASTNodeId] ?? window.astPool.get(markedASTNodeId);
                if (ASTNode) {
                    editor.mark(ASTNode);
                }
            }
        }

        const node = window.nodesPool.get(activeTabId);
        if (node) tabManager.focusTab(node);

        //if loop is not loaded, load loop
        //todo console for trigger loop events and functions
    }

    async showPopup() {
        const closeBtn =  new V({class: ['btn'], style: {position: 'absolute', top: 0, right: 0}, txt: 'X'});
        closeBtn.on('click', () => this.popup.hide());
        e('>', [closeBtn, this.popup]);

        const winWidth = window.innerWidth;
        const winHeight = window.innerHeight;
        const width = winWidth * 0.8;
        const height = winHeight * 0.8;

        const left = winWidth / 2 - width / 2;
        const top = winHeight / 2 - height / 2;

        this.popup.setStyles({
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
        });
        this.popup.show();
        return this.popup;
    }
    hidePopup() { this.popup.hide(); }

    createPopup(page) {
        this.popup = new V({class: ['popup', 'hidden'], style: {padding: '2em'}});
        e('>', [this.popup, page]);
    }
}