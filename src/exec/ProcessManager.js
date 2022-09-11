import FS from "../io/fs/FS.js";
import Os from "./Os.js";
import psList from "ps-list";

export default class ProcessManager {

    constructor(logger, appDir) {
        this.fs = new FS;
        this.logger = logger;
        this.appDir = appDir;
    }

    async start(js, name) {
        const fScript = `${this.appDir}/proc/script/${name}`;
        const fPid = `${this.appDir}/proc/pid/${name}`;
        const fLog = `${this.appDir}/proc/log/${name}`;

        if (await this.fs.exists(fScript)) {
            this.logger.error(`Process [${name}] already exists.`);
            return;
        }
        await this.fs.writeFile(fLog, `starting script [${name}]...\n\n`);
        await this.fs.writeFile(fScript, js);

        const cmd = new Os('node', [fScript, '>>', fLog, '2>&1'], '', this.logger);
        cmd.run(true, true, async (proc) => {
            await this.fs.writeFile(fPid, String(proc.pid))
        });
    }

    async stop(processName) {
        const pidFile = `${this.appDir}/proc/pid/${processName}`;
        if (!await this.fs.exists(pidFile)) return;

        const pid = parseInt(await this.fs.readFile(pidFile), 10);
        this.logger.info(`Stopping process [${processName}]. ${pid}`);
        for (const p of await psList()) {
            if (p.ppid == pid) {
                await (new Os('kill', [p.pid], '', this.logger)).run();
            }
        }
    }

    async list() {
        const pidsDir = `${this.appDir}/proc/pid`;

        const osProcesses = {};
        for (const p of await psList()) {
            if (!p.cmd.startsWith('node')) continue;
            if (p.cmd.startsWith('node x.js')) continue;
            osProcesses[p.ppid] = p;
        }

        const files = await this.fs.readDir(pidsDir);
        let finalProcessList = [];

        for (let i = 0; i < files.length; i++) {
            const name = files[i];
            const pid = await this.fs.readFile(`${pidsDir}/${name}`);

            if (name === '.gitignore') continue;

            const proc = osProcesses[pid];
            if (!proc) {
                await this.clearProcData(name);
            } else {
                finalProcessList.push({name, pid: proc.pid});
            }
        }

        return finalProcessList;
    }

    getLogFilename(name) { return `${this.appDir}/proc/log/${name}`; }

    async clearProcData(name) {
        const procDir = `${this.appDir}/proc`;
        const pid = `${procDir}/pid/${name}`;
        const script = `${procDir}/script/${name}`;
        const log = `${procDir}/log/${name}`;
        if (await this.fs.exists(pid)) await this.fs.rm(pid);
        if (await this.fs.exists(script)) await this.fs.rm(script);
        if (await this.fs.exists(log)) await this.fs.rm(log);
    }
}