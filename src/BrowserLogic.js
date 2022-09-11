import V from "./type/V.js";
import IDE from "./browser/IDE.js";
import SignPage from "./browser/module/page/SignPage.js";

export default class Browser {

    globals() {
        // window.x = (a1, a2, a3) => {
        //     if (a1 === 'set') state[a2] = a3;
        //     else if (a1 === 'get') return state[a2];
        //     else if (a1 === 'logger') return logger;
        //     else if (a1 === 'fs') return fs;
        // };
        window.nodesPool = new Map;
        window.outlinerPool = new Map;
        window.astPool = new Map;

        window.eHandlers = {};
        window.e = new Proxy(() => {}, {
            apply(target, thisArg, args) {
                const handler = args[0];
                const data = args[1];
                if (window.eHandlers[handler]) return window.eHandlers[handler](data);
            },
            set(target, k, v) {
                window.eHandlers[k] = v;
                return true;
            }
        });
        e['>'] = (args) => {
            let [v1, v2, index] = args;

            if (!(v1 instanceof V)) v1 = v1.getV();
            if (!(v2 instanceof V)) v2 = v2.getV();

            if (index !== undefined) {
                v2.getDOM().insertBefore(v1.getDOM(), v2.getDOM().children[index]);
                return;
            }
            v2.getDOM().append(v1.getDOM());
        }
        e['>after'] = (args) => {
            const [domA, domB] = args;
            domB.getDOM().after(domA.getDOM())
        }
        e['>before'] = (args) => {
            const [domA, domB] = args;
            domB.getDOM().before(domA.getDOM())
        }
    }

    async run() {
        this.globals();

        const app = new V;
        app.setDOM(document.getElementById('app'));
        const path = document.location.pathname
        const m = {
            '/': () => new IDE().start(app),
            '/sign/in': () => new SignPage().show(app, 'sign_in'),
            '/sign/up': () => new SignPage().show(app, 'sign_up'),
        }
        if (m[path]) m[path]();
    }
}