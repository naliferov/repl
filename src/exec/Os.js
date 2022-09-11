import {spawn, exec} from 'node:child_process';

export default class Os {

    cmd;
    args;
    process;

    constructor(cmd, args= [], cwd = '', logger, fs) {
        this.cmd = cmd;
        this.args = args;
        this.cwd = cwd;
        this.logger = logger;
        this.fs = fs;
    }

    async run(detached = false, shell = false, childCallback = null) {

        const proc = spawn(this.cmd, this.args, {cwd: this.cwd, shell, detached});
        if (childCallback) await childCallback(proc);
        this.process = proc;

        proc.stdout.on('data', (data) => {
            this.logger.info('[stdout] >');
            this.logger.info(data.toString().trim())
        });
        proc.stderr.on('data', (data) => {
            this.logger.info('[stderr] >');
            this.logger.error(data.toString().trim())
        });
        proc.on('error', (err) => this.logger.info(err));
        proc.on('close', (code) => this.logger.info('Process close:', {code}));
    }

    async exec() {
        const c = this.cmd;
        const a = this.args;
        return new Promise(function (resolve, reject) {
            exec(c + ' ' + a.join(' '), (err, stdout, stderr) => {
                resolve({err, stdout, stderr})
            });
        })
    }
}