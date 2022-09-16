export default class HttpClient {

    constructor(baseURL = '', headers = {}, options = {}) {

        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
        //if (token) {
        //    headers['Authorization'] = `Bearer ${token}`
        //}
        //this.api = axios.create({baseURL, headers});
    }

    async get(url, params = {}, headers = {}, options = {}) {

        let timeoutId;
        const controller = new AbortController();
        if (options.timeout) timeoutId = setTimeout(() => controller.abort(), options.timeout);

        if (Object.keys(params).length > 0) url += '?' + new URLSearchParams(params);

        const response = await fetch(url, {headers, signal: controller.signal});
        if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }

        return {
            statusCode: response.status,
            data: headers['Content-Type'] = 'application/json' ? await response.json() : await response.txt(),
            headers: response.headers
        }
    }

    async post(url, params = {}, headers = {}, options = {}) {

        let timeoutId;
        const controller = new AbortController();
        if (options.timeout) timeoutId = setTimeout(() => controller.abort(), options.timeout);

        if (this.userAgent && !headers['user-agent']) headers['user-agent'] = this.userAgent;
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: headers['Content-Type'] === 'application/json' ? JSON.stringify(params) : this.strParams(params),
            signal: controller.signal
        });
        if (timeoutId) clearTimeout(timeoutId);

        return {
            statusCode: response.status,
            data: await response.json(),
            headers: response.headers
        }
    }

    async delete(url, params = {}, headers = {}, options = {}) {

        let timeoutId;
        const controller = new AbortController;
        if (options.timeout) timeoutId = setTimeout(() => controller.abort(), options.timeout);

        if (this.userAgent && !headers['user-agent']) headers['user-agent'] = this.userAgent;
        if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';

        const response = await fetch(url, {
            method: 'DELETE',
            headers: headers,
            body: headers['Content-Type'] === 'application/json' ? JSON.stringify(params) : this.strParams(params),
            signal: controller.signal
        });
        if (timeoutId) clearTimeout(timeoutId);

        return {
            statusCode: response.status,
            data: await response.json(),
            headers: response.headers
        }
    }

    strParams(params) {
        let str = '';
        for (let i in params) str = str + i + '=' + params[i] + '&';
        if (str.length > 0) {
            str = str.substring(0, str.length - 1);
            return str;
        }
        return str
    }
}