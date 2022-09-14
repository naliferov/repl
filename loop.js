const x = new Proxy({}, {
    get(target, prop, receiver) {
        //return y.node; // (1)
    },
});
const y = {
    __std__: {
        nodes: {},
        nodesById: {},
    },
    __ext__: {
        express: (await import("express")).default,
        bodyParser: (await import("body-parser")).default,
    }
}

const main = async () => {
    if (typeof window !== 'undefined') { await browser(); return; }

    const {parseCliArgs} = await import("./src/F.js");
    const Logger = (await import("./src/log/Logger.js")).default;
    const fs = new (await import("./src/io/fs/FS.js")).default;
    const cliArgs = parseCliArgs(process.argv);
    const logger = new Logger(fs);

    y.__std__.nodes = {
        versionData: {},
        version: 'nodes_v_1.json',
    }
    y.__std__.nodes = JSON.parse(await fs.readFile(y.__std__.nodes.version))

    await runLoopService(cliArgs, {fs, logger});
}

const runLoopService = async (cliArgs, deps) => {
    const {fs, logger} = deps;
    const {uuid, unixTs} = (await import("./src/F.js"));

    const nodes = y.__std__.nodes.versionData;

    const iterNodes = (nodesArr, path = '') => {
        for (let i = 0; i < nodesArr.length; i++) {
            let node = nodesArr[i];
            if (!node.name) {
                logger.error('node name is not defined', node);
                continue;
            }
            y.__std__.nodesById[node.id] = node;

            if (node.js) node['__js__'] = eval(node.js);
            if (Array.isArray(node.nodes)) {
                iterNodes(node.nodes, path ? (path + '.' + node.name) : node.name);
            }
        }
    }
    iterNodes(nodes);

    const log = async (rq, rs, nx) => { logger.info(rq.method + ' ' + rq.path); nx(); }
    const api = async (rq, rs, nx) => {

        rs.setHeader('Access-Control-Allow-Origin', '*');
        rs.setHeader('Access-Control-Allow-Headers', "Content-Type, Authorization, X-Requested-With");

        if (rq.path === '/getNodes') rs.send(y.__std__.nodes.versionData);
        else if (rq.path === '/console') {
            if (!rq.body.js) { rs.send({err: 'js is empty'}); return; }
            eval(rq.body); rs.send({});

        } else if (rq.path === '/createNode') {

            const node = rq.body.node;
            if (!node) { rs.send({err: 'node is empty'}); return; }
            const nodeIndex = rq.body.nodeIndex
            if (!nodeIndex) { rs.send({err: 'node is empty'}); return; }

            const parentNodeId = rq.body.parentNodeId;

            if (parentNodeId) {
                const parentNode = y.__std__.nodesById[parentNodeId];
                if (!parentNode) { rs.send({err: 'parentNode not found'}); return; }

                parentNode.nodes.splice(nodeIndex, 0, node);
            } else {
                y.__std__.nodes.versionData.splice(nodeIndex, 0, node);
            }
            y.__std__.nodesById[node.id] = node;

            rs.send({});
            await fs.writeFile(y.__std__.nodes.version, JSON.stringify(y.__std__.nodes));

        } else if (rq.path === '/deleteNode') {

            const nodeId = rq.body.nodeId
            if (!nodeId) { rs.send({err: 'nodeId is empty'}); return; }
            const nodeIndex = rq.body.nodeIndex;
            if (typeof nodeIndex !== 'number') { rs.send({err: 'nodeIndex is empty or invalid'}); return; }

            const parentNodeId = rq.body.parentNodeId;
            if (parentNodeId) {
                const parentNode = y.__std__.nodesById[parentNodeId];
                if (!parentNode) { rs.send({err: 'parentNode not found'}); return; }

                parentNode.nodes.splice(nodeIndex, 1);
            } else {
                y.__std__.nodes.versionData.splice(nodeIndex, 1);
            }

            delete y.__std__.nodesById[nodeId];
            rs.send({});
            await fs.writeFile(y.__std__.nodes.version, JSON.stringify(y.__std__.nodes));

        } else if (rq.path === '/setKey') {

            const nodeId = rq.body.nodeId;
            const k = rq.body.k;
            const v = rq.body.v;

            if (!nodeId) { rs.send({err: 'nodeId is empty'}); return; }
            if (!k) { rs.send({err: 'k is empty'}); return; }
            if (!v) { rs.send({err: 'v is empty'}); return; }

            const node = y.__std__.nodesById[nodeId];
            if (!node) { rs.send({err: 'node not found'}); return; }

            node[k] = v;
            if (k === 'js') node['__js__'] = eval(v);
            rs.send(node);

            await fs.writeFile(y.__std__.nodes.version, JSON.stringify(y.__std__.nodes));
        }
        nx();
    }
    const e = y.__ext__.express();
    e.use(y.__ext__.bodyParser.json({limit: '25mb'}), log, api);
    const s = (await import("node:http")).createServer({}, e);
    const p = cliArgs.port || 8099;
    s.listen(p, (err) => logger.info(`Server listening on port ${p}`));
}


const browser = async () => {
    const Browser = (await import("./src/BrowserLogic.js")).default;
    (new Browser()).run();
};

main();
