import * as crypto from 'node:crypto';
import UsersModel from "../db/model/UsersModel.js";
import ProcsModel from "../db/model/ProcsModel.js";
import {Tail} from "tail";
import bcrypt from "bcrypt";
import HttpClient from "./HttpClient.js";
import NetworkNodesModel from "../db/model/NetworkNodesModel.js";
import ServicesModel from "../db/model/ServicesModel.js";
import {ObjectId} from "mongodb";
import {keyBy} from "../../F.js";

const COOKIE_KEY = 'rockabilly';

export default class HttpMsgHandler {

    constructor(logger, appDir, mongoManager, x) {
        this.fs = x('fs');
        this.logger = logger;
        this.appDir = appDir;
        this.usersModel = new UsersModel(mongoManager);
        this.servicesModel = new ServicesModel(mongoManager);
        this.procsModel = new ProcsModel(mongoManager);
        this.networksNodesModel = new NetworkNodesModel(mongoManager);
        this.x = x;
        //todo create runner service client here
    }

    async authenticate(rq) {
        const authKey = this.getAuthKey(rq);
        if (!authKey) return false;
        return await this.usersModel.getByAuthKey(authKey);
    }
    authorize(res, authKey) {
        res.cookie(COOKIE_KEY, authKey, { maxAge: (60 * 60 * 24) * (30 * 1000), httpOnly: true, secure: true, sameSite: 'Strict'});
    }
    getAuthKey(req) { return req.cookies[COOKIE_KEY]; }
    getNodesFileForUser(user) { return this.x('stateDir') + '/' + user._id.toString() + '.json'; }

    async verifyRecaptcha(token) {
        const resp = await (new HttpClient()).post('https://www.google.com/recaptcha/api/siteverify', {
            secret: this.x('conf').recaptcha_secret,
            response: token,
        }, {'Content-Type': 'application/x-www-form-urlencoded'});
        return resp.data;
    }

    async run(req, rs, nx, methodPath) {
        const htmlFile = await this.fs.readFile(this.appDir + '/src/browser/index.html');
        const html = () => rs.send(htmlFile);
        const m = {
            'GET:/': async() => rs.send(htmlFile),
            'GET:/sign/in': html, 'GET:/sign/up': html,
            'POST:/sign/in': async () => {
                let {email, password, recaptchaToken} = req.body;
                email = email.trim(); password = password.trim();
                if (!email) { rs.send({err: 'Email is missing.'}); return; }
                if (!password) { rs.send({err: 'Password is missing.'}); return; }
                if (!recaptchaToken) { rs.send({err: 'Recaptcha token is missing.'}); return; }

                let result = await this.verifyRecaptcha(recaptchaToken);
                if (!result.success) {
                    this.logger.error('Recaptcha failed:', {result});
                    rs.send({err: result});
                    return;
                }

                const user = await this.usersModel.getByEmail(email);
                if (!user) { rs.send({err: 'Email or password is incorrect.'}); return; }
                result = await bcrypt.compare(password, user.hash);
                if (!result) { rs.send({err: 'Email or password is incorrect.'}); return; }

                this.authorize(rs, user.authKey); rs.send({});
            },
            'POST:/sign/up': async () => {
                let {email, password, recaptchaToken} = req.body;

                if (!email) { rs.send({err: 'Email is missing.'}); return; }
                email = email.trim();
                if (email.length > 20) { rs.send({err: 'Email length limit is 20 symbols.'}); return; }
                if (!password) { rs.send({err: 'Password is missing.'}); return; }
                password = password.trim();
                if (password.length > 20) { rs.send({err: 'Password length limit is 20 symbols.'}); return; }
                if (!recaptchaToken) { rs.send({err: 'Recaptcha token is missing.'}); return; }

                const result = await this.verifyRecaptcha(recaptchaToken);
                if (!result.success) {
                    this.logger.error('Recaptcha failed:', {result});
                    rs.send({err: result});
                    return;
                }

                const authKey = crypto.randomBytes(32).toString('hex');
                try {
                    const hash = await bcrypt.hash(password, 10);
                    await this.usersModel.insertOne({email, hash, authKey});
                } catch (err) {
                    rs.send({err: err.message});
                    return;
                }
                this.authorize(rs, authKey); rs.send({});
            },
            'GET:/service': async () => {
                const groupsIds = req.query.groupsIds ? req.query.groupsIds.trim() : '';
                if (!groupsIds) { rs.send({err: 'groupsIds is empty.'}); return; }
                const c = await this.servicesModel.findByGroupsIds(groupsIds.split(','));
                rs.send({services: await c.toArray()});
            },
            'POST:/service': async () => {
                const {groupId, name} = req.body;
                if (name.length > 20) { rs.send({err: 'name length limit is 20 symbols.'}); return; }
                const service = await this.servicesModel.findOne({groupId});
                if (!service) {
                    rs.send({r: await this.servicesModel.insertOne({name, groupId})});
                    return;
                }
                rs.send({r: await this.servicesModel.updateOne({groupId}, {$set: {name}})});
            },
            'DELETE:/service': async () => rs.send({r: await this.servicesModel.deleteOneBy('groupId', req.body.groupId)}),
            'POST:/proc/start': async () => {
                const {groupId, js} = req.body;
                if (!groupId || !js) { rs.send({err: 'name or js is empty.'}); return; }
                if (groupId.length > 40) {rs.send({err: 'groupId is too long'}); return;}

                try {
                    const networkNode = await (await this.networksNodesModel.getRandomDoc()).next();
                    if (!networkNode) { rs.send({err: 'networkNode not found.'}); return; }

                    const host = networkNode.ip + (networkNode.port ? ':' + networkNode.port : '');
                    const {data} = await (new HttpClient()).post(`http://${host}/start`, {js}, {}, {timeout: 8000});
                    if (data.err || data.stderr) { rs.send({'errorFromService': data}); return; }

                    const proc = {userId: req.authUser._id, groupId, networkNodeId: networkNode._id, port: data.port,
                                  containerId: data.containerId};
                    await this.procsModel.insertOne(proc);
                    rs.send({data});
                } catch (e) {
                    this.logger.error('scriptProcess run', e);
                    let err = e.toString();
                    if (e.cause) err += JSON.stringify(e.cause);
                    rs.send({err});
                }
            },
            'POST:/proc/stop': async () => {
                const procsIds = Array.isArray(req.body.procsIds) ? req.body.procsIds.map(id => new ObjectId(id)) : [];
                const procsByNetworkNodeId = new Map;

                if (!procsIds.length) { rs.send({err: 'procsIds is empty.'}); return; }
                const procs = await (await this.procsModel.find({'_id': {'$in': procsIds } })).toArray();
                if (!procs.length) { rs.send({err: 'procs not found.'}); return; }
                procs.forEach(proc => {
                    const a = procsByNetworkNodeId.get(proc.networkNodeId) ?? [];
                    a.push(proc);
                    procsByNetworkNodeId.set(proc.networkNodeId, a);
                });
                if (!procsByNetworkNodeId.size) { rs.send({err: 'procsByNetworkNodeId is empty.'}); return; }

                const networkNodesById = {};
                (await this.networksNodesModel.findByIds(Array.from(procsByNetworkNodeId.keys()))).forEach(networkNode => {
                    networkNodesById[networkNode._id.toString()] = networkNode;
                });

                let deletedProcsIds = [];

                for (let [networkNodeId, procsByNetNode] of procsByNetworkNodeId) {

                    const netNode = networkNodesById[networkNodeId.toString()];
                    if (!netNode) { this.logger.error(`networkNode [${networkNodeId}] not found`); continue; }
                    const containersIds = procsByNetNode.map(proc => proc.containerId);
                    const host = netNode.ip + (netNode.port ? ':' + netNode.port : '');
                    const {data} = await (new HttpClient()).post(`http://${host}/stop`, {containersIds});
                    if (data.stderr) {
                        this.logger.error(`Request to http://${host}/stop >> ${data.stderr}`);
                        continue;
                    }
                    await this.procsModel.deleteManyBy('containerId', containersIds);
                    procsByNetNode.map(proc => deletedProcsIds.push(proc._id));
                }

                rs.send({deletedProcsIds});
            },
            'GET:/proc/log': async () => {
                const name = req.query.name;
                if (!name) { rs.send({err: 'name is empty.'}); return; }
                if (name.includes('..') || name.includes('/') || name.includes("\\")) { rs.send({err: 'name is invalid.'}); return; }

                rs.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache'
                });

                try {
                    const tail = new Tail(processManager.getLogFilename(name), {fromBeginning: true});
                    tail.on('line', (line) => rs.write(`data: ${line}\n\n`));
                    tail.on('error', (error) => {
                        this.logger.info('ERROR: ', error)
                        tail.unwatch();
                        rs.write(`data: Log tail error + ${e.toString()}\n\n`);
                    });
                    req.on('close', () => {
                        tail.unwatch();
                        this.logger.info('close SSE');
                    });
                } catch (e) {
                    this.logger.info('catch', e);
                    rs.write(`data: ${e.toString()}\n\n`);
                }
            },
            'GET:/proc/list': async () => {
                //todo add index user_id
                //todo add uniq index in mongo for field containerId
                //todo add date field for cleaning purpose

                let procs = await this.procsModel.find({userId: req.authUser._id});
                let procsByContainerId = keyBy(procs, 'containerId');

                const {data} = await (new HttpClient()).post(this.x('conf').runnerServiceUrl + '/searchContainers', {procsByContainerId});
                if (data.err || data.stderr) { rs.send({data}); return; }

                for (let i = 0; i < data.length; i++) delete procsByContainerId[ data[i].containerId ];

                await this.procsModel.deleteManyBy('containerId', Object.keys(procsByContainerId));

                rs.send(data);
            },
            'GET:/nodes': async () => {
                const nodesFile = this.getNodesFileForUser(req.authUser);
                if (!this.fs.exists(nodesFile)) { rs.send({}); return; }
                rs.send(await this.fs.readFile(nodesFile));
            },

            'POST:/nodes': async () => {
                if (!req.body.nodes) { rs.send({err: 'nodes is empty.'}); return; }
                await this.fs.writeFile(this.getNodesFileForUser(req.authUser), JSON.stringify(req.body.nodes));
                rs.send({});
            },
        };

        if (!m[methodPath]) {
            nx();
            return;
        }

        const authRequired = {
            'GET:/': 1,
            'GET:/service': 1,
            'POST:/service': 1,
            'DELETE:/service': 1,
            'POST:/proc/start': 1,
            'POST:/proc/stop': 1,
            'GET:/proc/log': 1,
            'GET:/proc/list': 1,
            'GET:/nodes': 1,
            'POST:/nodes': 1,
        }
        if (authRequired[methodPath]) {
            const user = await this.authenticate(req);
            if (!user) {
                if (methodPath === 'GET:/') rs.redirect('/sign/in');
                else rs.status(403).end();
                return;
            }
            req.authUser = user;
        }
        await m[methodPath]();
        nx();
    }
}