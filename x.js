import NetworkNodesModel from "./src/io/db/model/NetworkNodesModel.js";

const main = async () => {
    if (typeof window !== 'undefined') { await browser(); return; }

    const {parseCliArgs} = await import("./src/F.js");
    const Logger = (await import("./src/log/Logger.js")).default;
    const FS = (await import("./src/io/fs/FS.js")).default;
    const MongoManager = (await import("./src/io/db/MongoManager.js")).default;

    const fs = new FS;
    const path = await import("node:path");
    const cliArgs = parseCliArgs(process.argv);
    const logger = new Logger(fs);
    const cwd = process.cwd();
    const conf = await fs.readJSONIfNotExistsCreate('conf/conf.json');
    const mongoManager = new MongoManager;
    mongoManager.createMongoClient(conf.mongo, logger);

    const x = (a1, a2, a3) => {
        if (a1 === 'logger') return logger;
        if (a1 === 'stateDir') return path.resolve(cwd + '/../state');
        else if (a1 === 'fs') return fs;
        else if (a1 === 'conf') return conf;
    }

    if (cliArgs.cmd === 'runner') {
        await runRunnerService(cliArgs, {appDir: cwd, ctxDir: cwd, logger, x});
        return;
    }
    if (cliArgs.cmd === 'addNetworkNode') {
        await mongoManager.connect();
        const networkNodes = new NetworkNodesModel(mongoManager);
        await networkNodes.insertOne({ip: '127.0.0.1', 'port': 8090});
        await logger.info('Inserted.');
        return;
    }
    await runMainService(cliArgs, {appDir: cwd, ctxDir: cwd, logger, mongoManager, x});
}

const updateService = async (cliArgs, deps) => {
    //listen for hook, then git pull
    //npm install
    //run new instance
    //stop old instance
}
const runMainService = async (cliArgs, deps) => {
    const HttpMsgHandler = (await import("./src/io/http/HttpMsgHandler.js")).default;
    const express = (await import("express")).default;
    const bodyParser = (await import("body-parser")).default;
    const cookieParser = (await import("cookie-parser")).default;
    const http = (await import("node:http"));

    const {logger, appDir, mongoManager, x} = deps;
    await mongoManager.connect();
    await logger.info('Success connection to mongo.');
    const handler = new HttpMsgHandler(logger, appDir, mongoManager, x);

    const log = async (rq, rs, nx) => { logger.info(rq.method + ' ' + rq.path); nx(); }
    const api = async (rq, rs, nx) => {
        if (rq.path === 'conf/conf.json' || rq.path === '/conf/conf.json') { rs.status(403).end(); return; }

        const host = rq.headers.host ? rq.headers.host.split('.') : '';
        const isLocalhostSubdomain = host[1] && host[1].startsWith('localhost:');
        if (isLocalhostSubdomain || host.length > 2) {
            const subdomain = host[0];
            if (subdomain.length > 1 && subdomain.length < 25) { //check for spaces and special chars
                //const servicesModel = (new ServicesModel(mongoManager)).findOne({name: subdomain});
            }

            //try to find proxy service
        }

        const methodPath = `${rq.method}:${rq.path}`;
        await handler.run(rq, rs, nx, methodPath);
        nx();
    }
    let e = express();
    e.use(bodyParser.json({limit: '25mb'}), cookieParser(), express.static(appDir), log, api);
    const s = http.createServer({}, e);
    const p = cliArgs.port || 8080;
    s.listen(p, (err) => logger.info(`Server listening on port ${p}`));
};
const runRunnerService = async (cliArgs, deps) => {
    const express = (await import("express")).default;
    const bodyParser = (await import("body-parser")).default;
    const http = (await import("node:http"));
    const {uuid, unixTsNow} = (await import("./src/F.js"));
    const {logger, x} = deps;
    const osx = new (await import("./src/exec/Osx.js")).default(logger);

    const parseDate = (str) => {const [d, t] = str.split(' '); return Math.floor(Date.parse(d + ' ' + t) / 1000 );};
    const getContainers = async () => await osx.ex(`docker ps -a --no-trunc --format='{{.ID}}||{{ .CreatedAt }}||{{.Status}}'`);

    if (cliArgs.clearContainers) {
        logger.info('Containers cleaning is activated.');
        setInterval(async () => {
            const {stdout, stderr} = await getContainers();
            if (stderr) { logger.error('docker ps failed: ' + stderr); return; }

            const containers = stdout.trim().split('\n');
            for (let i = 0; i < containers.length; i++) {
                if (!containers[i]) continue;
                const [id, createdAt, status] = containers[i].split('||');
                const createdAtUnixTS = parseDate(createdAt);
                if ((unixTsNow() - createdAtUnixTS) > 60 * 5) {
                    const {stderr} = await osx.ex(`docker rm -f ${id}`);                if (stderr) {logger.error(stderr)} logger.info('rm container', {id, createdAt});
                }
            }
        }, 15000);
    }

    const log = async (rq, rs, nx) => { logger.info(rq.method + ' ' + rq.path); nx(); }
    const api = async (rq, rs, nx) => {
        if (rq.path === 'conf/conf.json' || rq.path === '/conf/conf.json') { rs.status(403).end(); return; }
        if (rq.path === '/start') {
            const {js} = rq.body; if (!js) { rs.send({err: 'js is empty.'}); return; }
            const fName = uuid() + '.js';
            try {
                await (x('fs')).writeFile(fName, js);
                const {stdout, stderr, err} = await osx.ex(`docker run -d -v "$PWD"/${fName}:/app/${fName} -w /app -p 0:80 node node ${fName}`);
                if (stderr) {rs.send({stderr}); return; }

                const containerId = stdout.trim();
                const r = await osx.ex(`docker inspect --format='{{ (index (index .NetworkSettings.Ports "80/tcp") 0).HostPort }}' ${containerId}`);
                if (r.stderr) { rs.send({stderr}); return; }
                rs.send({stdout, stderr, err, containerId, port: Number(r.stdout.trim())}); return;
            } catch (e) {
                logger.error('run user script error', e);
                rs.send({err: e.toString()});
            } finally {
                setTimeout(() => x('fs').rm(fName), 5000);
            }
        } else if (rq.path === '/stop') {
            const {containersIds} = rq.body;
            if (!Array.isArray(containersIds)) { rs.send({err: 'containersIds is empty or invalid.'}); return; }

            const {stdout, stderr, err} = await osx.ex(`docker rm -f ${containersIds.join(' ')}`);
            rs.send({stdout, stderr, err});
        } else if (rq.path === '/searchContainers') {
            const procsByContainerId = rq.body.procsByContainerId;

            const {stdout, stderr} = await getContainers();
            if (stderr) {
                logger.error('docker ps failed: ' + stderr); rs.send({stderr}); return;
            }
            const containers = stdout.trim().split('\n');
            const l = [];

            for (let i = 0; i < containers.length; i++) {
                if (!containers[i]) continue;
                const [id] = containers[i].split('||');
                if (!procsByContainerId[id]) continue;
                l.push(procsByContainerId[id]);
            }

            rs.send(l);
        }
        nx();
    }
    const e = express();
    e.use(bodyParser.json({limit: '25mb'}), log, api);
    const s = http.createServer({}, e);
    const p = cliArgs.port || 8080;
    s.listen(p, (err) => logger.info(`Server listening on port ${p}`));
}

const browser = async () => {
    const Browser = (await import("./src/BrowserLogic.js")).default;
    (new Browser()).run();
};

main();
