import * as httpModule from "http";
import * as httpsModule from "https";
import requestPromise from "request-promise";
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
  private cookies: string[] = [];
  private apiVersion = 1;

  public constructor(config: IRISDirect) {
    this.config = config;
    this.config.namespace = this.config.namespace.toUpperCase();
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
    if (minVersion > this.apiVersion) {
      return Promise.reject(`${path} not supported by API version ${this.apiVersion}`);
    }
    if (minVersion && minVersion > 0) {
      path = `v${this.apiVersion}/${path}`;
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

    const proto = https ? "https" : "http";
    const agent = new (https ? httpsModule : httpModule).Agent({
      keepAlive: true,
      maxSockets: 10,
      rejectUnauthorized: https,
    });
    path = encodeURI(`${pathPrefix || ""}/api/atelier/${path || ""}${buildParams()}`);

    const cookies = this.cookies;
    let auth;
    if (cookies.length || method === "HEAD") {
      auth = Promise.resolve(cookies);
    } else if (!cookies.length) {
      auth = this.request(0, "HEAD");
    }

    return auth.then(cookie => 
        requestPromise({
          agent,
          auth: { user: username, pass: password, sendImmediately: true },
          body: ["PUT", "POST"].includes(method) ? body : null,
          headers: {
            ...headers,
            Cookie: cookie,
          },
          json: true,
          method,
          resolveWithFullResponse: true,
          simple: true,
          uri: `${proto}://${host}:${port}${path}`,
        })
          // .catch(error => error.error)
          .then(response => {
            this.updateCookies(response.headers["set-cookie"])
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
          })
      );
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
        this.apiVersion = data.api;
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
    }).then(data => data.result.content)
  }


  
}