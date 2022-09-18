const main = async () => {
    if (typeof window !== 'undefined') { await browser(); return; }

    const process = (await import("node:process")).default;
    const {parseCliArgs} = await import("./src/F.js");
    const fs = new (await import("./src/io/fs/FS.js")).default;
    const cliArgs = parseCliArgs(process.argv);
    const Logger = (await import("./src/log/Logger.js")).default;
    const logger = new Logger(fs);
    process.on('unhandledRejection', e => logger.error(`unhandledRejection:`, e.stack));

    const x = new Proxy(() => {}, {
        get(target, prop, receiver) { return y.__std__.nodes.versionData[prop]; },
        apply(target, thisArg, argArray) {

            const node = y.__std__.nodes.versionData[argArray[0]];
            if (!node) { logger.error(`node not found by id [${argArray[0]}]`); return; }

            try {
                logger.info(`exec node [${node.name}]`);

                if (!node.__js__) node.__js__ = eval(node.js);
                return node.__js__();
            } catch (e) {
                logger.error(e.toString(), e.stack);
            }
        }
    });
    const y = {
        __std__: {
            nodes: {},
        },
        __ext__: {
            express: (await import("express")).default,
            bodyParser: (await import("body-parser")).default,
        }
    }
    y.__std__.nodes = {
        versionData: {},
        version: 'nodes.json',
    }
    y.__std__.nodes = JSON.parse(await fs.readFile(y.__std__.nodes.version))

    let saving;
    const triggerDump = () => {

        if (saving) return;
        saving = setTimeout(async () => {
            await logger.info('dumpNodesToDisc...');
            await fs.writeFile(y.__std__.nodes.version, JSON.stringify(y.__std__.nodes));

            clearTimeout(saving);
            saving = null;
        }, 1000);
    }


    const nodes = y.__std__.nodes.versionData;
    for (let i in nodes) { let node = nodes[i]; if (!node.name) logger.error('node name is not defined', node); }

    let connectedRS;
    logger.onMessage((msg, object) => {
        if (!connectedRS) return;
        connectedRS.write(`data:${ JSON.stringify({m: msg, o: object }) } \n\n`);
    });

    const log = async (rq, rs, nx) => { logger.info(rq.method + ' ' + rq.path); nx(); }
    const api = async (rq, rs, nx) => {

        rs.setHeader('Access-Control-Allow-Origin', '*');
        rs.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        if (rq.path === '/getNodes') rs.send(y.__std__.nodes.versionData);
        else if (rq.path === '/console') {

            if (typeof rq.body.js !== 'string') { rs.send({err: 'js is not string'}); return; }
            try {
                eval(`( async() => { ${rq.body.js} } )()`);
                rs.send({});
            } catch (e) {
                logger.error(e.toString(), e.stack);
                rs.send({err: e.toString(), stack: e.stack});
            }

        } else if (rq.path === '/consoleMonitor') {

            rs.writeHead(200, {
                'Content-Type': 'text/event-stream', 'Connection': 'keep-alive', 'Cache-Control': 'no-cache'
            });
            rs.write(`data: connected to console...\n\n`);
            connectedRS = rs;

            rq.on('close', () => {
                connectedRS = null;
                logger.info('SSE closed')
            });

        } else if (rq.path === '/createNode') {

            const node = rq.body.node;
            if (!node) { rs.send({err: 'node is empty'}); return; }
            triggerDump();
            rs.send({});

        } else if (rq.path === '/deleteNode') {

            const nodeId = rq.body.nodeId
            if (!nodeId) { rs.send({err: 'nodeId is empty'}); return; }
            delete y.__std__.nodes.versionData[nodeId];
            rs.send({});
            triggerDump();

        } else if (rq.path === '/setKey') {

            const nodeId = rq.body.nodeId;
            const k = rq.body.k;
            const v = rq.body.v;

            if (!nodeId) { rs.send({err: 'nodeId is empty'}); return; }
            if (!k) { rs.send({err: 'k is empty'}); return; }
            if (!v) { rs.send({err: 'v is empty'}); return; }

            const node = y.__std__.nodes.versionData[nodeId];
            if (!node) { rs.send({err: 'node not found'}); return; }

            node[k] = v;

            if (k === 'js') {
                try {
                    const js = eval(v);
                    if (js) node.__js__ = js;
                }
                catch (e) { logger.error(e.toString(), e.stack); }
            }

            rs.send(node);
            triggerDump();
        }
        nx();
    }
    const e = y.__ext__.express();
    e.use(y.__ext__.bodyParser.json({limit: '25mb'}), log, api);
    const s = (await import("node:http")).createServer({}, e);
    const p = cliArgs.port || 8099;
    s.listen(p, (err) => logger.info(`Server listening on port ${p}`));

    //s.close(() => {  });
}

const browser = async () => {
    //const Browser = (await import("./src/BrowserLogic.js")).default;
    //(new Browser()).run();
};

main();
