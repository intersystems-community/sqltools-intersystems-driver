import * as httpModule from "http";
import * as httpsModule from "https";
import { QueryBuilder, NSDatabase, IBaseQueries } from "@sqltools/types";

export class IRISDirect {
  https?: boolean;
  host: string;
  port: number;
  pathPrefix?: string;
  namespace: string;
  username?: string;
  password?: string;
}

export interface IQueries extends IBaseQueries  {
  fetchTableSchemas?: QueryBuilder<NSDatabase.IDatabase, NSDatabase.ISchema>;
  fetchViewSchemas?: QueryBuilder<NSDatabase.IDatabase, NSDatabase.ISchema>;
  fetchFunctionSchemas?: QueryBuilder<NSDatabase.IDatabase, NSDatabase.ISchema>;
  
  fetchViews: QueryBuilder<NSDatabase.ISchema, NSDatabase.ITable>;

  searchEverything: QueryBuilder<{ search: string, limit?: number }, NSDatabase.ITable>;
}

export default class IRISdb {

  private config: IRISDirect;
  private resultSetRowLimit: number;
  private rejectUnauthorized: boolean;
  private cookies: string[] = [];
  private _apiVersion = 1;

  public get apiVersion() {
    return this._apiVersion;
  }

  public constructor(config: IRISDirect, resultSetRowLimit: number, rejectUnauthorized: boolean = true) {
    this.config = config;
    this.config.namespace = this.config.namespace.toUpperCase();
    this.resultSetRowLimit = resultSetRowLimit;
    this.rejectUnauthorized = rejectUnauthorized;
  }

  public updateCookies(newCookies: string[]): void {
    const cookies = this.cookies;
    newCookies.forEach(cookie => {
      const [cookieName] = cookie.split("=");
      const index = cookies.findIndex(el => el.startsWith(cookieName));
      if (index >= 0) {
        cookies[index] = cookie;
      } else {
        cookies.push(cookie);
      }
    });
    this.cookies = cookies;
  }

  public async request(
    minVersion: number,
    method: string,
    path?: string,
    body?: any,
    params?: any,
    headers?: any
  ): Promise<any> {
    const { https, host, port, pathPrefix, username, password } = this.config;
    if (minVersion > this._apiVersion) {
      return Promise.reject(`${path} not supported by API version ${this._apiVersion}`);
    }
    if (minVersion && minVersion > 0) {
      path = `v${this._apiVersion}/${path}`;
    }

    headers = {
      ...headers,
      Accept: "application/json",
    };
    const buildParams = (): string => {
      if (!params) {
        return "";
      }
      const result = [];
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (typeof value === "boolean") {
          result.push(`${key}=${value ? "1" : "0"}`);
        } else if (value && value !== "") {
          result.push(`${key}=${value}`);
        }
      });
      return result.length ? "?" + result.join("&") : "";
    };
    method = method.toUpperCase();
    if (["PUT", "POST"].includes(method) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    headers["Cache-Control"] = "no-cache";

    const agent = new (https ? httpsModule : httpModule).Agent({
      keepAlive: true,
      maxSockets: 10,
      rejectUnauthorized: this.rejectUnauthorized,
    });
    path = encodeURI(`${pathPrefix || ""}/api/atelier/${path || ""}${buildParams()}`);

    const cookies = this.cookies;
    let auth;
    if (cookies.length || method === "HEAD") {
      auth = Promise.resolve(cookies);
    } else if (!cookies.length) {
      auth = this.request(0, "HEAD");
    }

    return auth.then(cookie => {
      return new Promise<{ headers: httpModule.IncomingHttpHeaders; body: any }>((resolve, reject) => {
        const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
        const cookieStr = Array.isArray(cookie) ? cookie.join("; ") : String(cookie);
        const reqHeaders: Record<string, string> = {
          ...headers,
          Authorization: `Basic ${basicAuth}`,
          Cookie: cookieStr,
        };
        const bodyStr = ["PUT", "POST"].includes(method) && body != null
          ? JSON.stringify(body)
          : null;
        if (bodyStr) {
          reqHeaders["Content-Length"] = String(Buffer.byteLength(bodyStr));
        }
        const protocol = https ? httpsModule : httpModule;
        const req = protocol.request(
          { agent, headers: reqHeaders, hostname: host, method, path, port },
          (res) => {
            const chunks: Buffer[] = [];
            res.on("data", (chunk: Buffer) => chunks.push(chunk));
            res.on("end", () => {
              const rawBody = Buffer.concat(chunks).toString("utf8");
              let parsedBody: any;
              try {
                parsedBody = JSON.parse(rawBody);
              } catch {
                parsedBody = rawBody;
              }
              if (res.statusCode && res.statusCode >= 400) {
                const err: any = new Error(`${res.statusCode} - ${rawBody}`);
                err.statusCode = res.statusCode;
                err.error = parsedBody;
                reject(err);
              } else {
                resolve({ headers: res.headers, body: parsedBody });
              }
            });
            res.on("error", reject);
          }
        );
        req.on("error", reject);
        if (bodyStr) {
          req.write(bodyStr);
        }
        req.end();
      })
        .then(response => {
          this.updateCookies(response.headers["set-cookie"] || []);
          return response;
        })
        .then(response => {
          if (method === "HEAD") {
            return this.cookies;
          }
          const data = response.body;
          /// deconde encoded content
          if (data.result && data.result.enc && data.result.content) {
            data.result.enc = false;
            data.result.content = Buffer.from(data.result.content.join(""), "base64");
          }
          if (data.console) {
            // outputConsole(data.console);
          }
          if (data.result.status && data.result.status !== "") {
            // outputChannel.appendLine(data.result.status);
            throw new Error(data.result.status);
          }
          if (data.status.summary) {
            throw new Error(data.status.summary);
          } else if (data.result.status) {
            throw new Error(data.result.status);
          } else {
            return data;
          }
        })
        .catch(error => {
          console.log('Error', error);
          throw error;
        });
    });
  }

  public async open() {
    const { namespace } = this.config;
    return this.request(0, "GET").then(info => {
      if (info && info.result && info.result.content && info.result.content.api > 0) {
        const data = info.result.content;
        if (!data.namespaces.includes(namespace)) {
          throw {
            code: "WrongNamespace",
            message: `This server does not have specified namespace '${namespace}'.\n
            You must select one of the following: ${data.namespaces.join(", ")}.`,
          };
        }
        this._apiVersion = data.api;
        return info;
      }
    });
  }

  public async close() {
  }

  public async query(query: string, parameters: string[]): Promise<any> {
    console.log('SQL: ' + query);
    return this.request(1, "POST", `${this.config.namespace}/action/query`, {
      parameters,
      query,
    }, this._apiVersion >= 6 ? { positional: true , max: this.resultSetRowLimit > 0 ? this.resultSetRowLimit : undefined } : {}).then(data => data.result)
  }


  
}