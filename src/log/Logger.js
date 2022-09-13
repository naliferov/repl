import {EOL} from "os";

export default class Logger {

    constructor(fs) {
        this.fs = fs;
        this.prefix = '';
    }

    setPrefix(prefix) {
        this.prefix = prefix;
    }

    setHandler(handler) { this.handler = handler; }

    async enableLoggingToFile(logFile) {
        this.file = await this.fs.openFile(logFile, 'a');
        await this.fs.writeFile(this.file, EOL)
    }
    async disableLoggingToFile() { await this.fs.closeFile(this.file); }

    async log(msg, object) {
        const logMsg = this.prefix + msg;
        object ? console.log(logMsg, object) : console.log(logMsg);
        if (this.file) {
            await this.fs.writeFile(this.file, (object ? `${logMsg} ${JSON.stringify(object)}` : logMsg) + EOL);
        }
    }

    async info(msg, object = null) { await this.log(msg, object); }
    async warning(msg, object = null) { await this.log(msg, object); }
    async error(msg, object = null) { await this.log(msg, object); }
}