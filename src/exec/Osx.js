import {spawn, exec} from 'node:child_process';

export default class Osx {
    constructor(logger) { this.logger = logger; }
    async run(cmd, detached = false, shell = false, childCallback = null) {

        let args = cmd.split(' ');
        let firstArg = args.shift();

        const proc = spawn(cmdSplit[0], this.args, {cwd: this.cwd, shell, detached});
        if (childCallback) await childCallback(proc);

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

    async ex(cmd) {
        return new Promise(function (resolve, reject) {
            exec(cmd, (err, stdout, stderr) => resolve({err, stdout, stderr}));
        });
    }
}