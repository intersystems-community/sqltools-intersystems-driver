import * as vscode from 'vscode';
import { IExtension, IExtensionPlugin, IDriverExtensionApi } from '@sqltools/types';
import { ExtensionContext } from 'vscode';
import { DRIVER_ALIASES } from './constants';
const { publisher, name } = require('../package.json');
// import { workspace } from 'vscode';
// import { Uri } from 'vscode';
// import path from 'path';
import * as serverManager from "@intersystems-community/intersystems-servermanager";

const smExtensionId = "intersystems-community.servermanager";
let serverManagerApi: serverManager.ServerManagerAPI;

/** Map of the intersystems.server connection specs we have resolved via the API to that extension */
const resolvedConnSpecs = new Map<string, serverManager.IServerSpec>();

const driverName = 'InterSystems IRIS Driver';

export async function activate(extContext: ExtensionContext): Promise<IDriverExtensionApi> {
  const sqltools = vscode.extensions.getExtension<IExtension>('mtxr.sqltools');
  if (!sqltools) {
    throw new Error('SQLTools not installed');
  }
  await sqltools.activate();

  const api = sqltools.exports;

  const extensionId = `${publisher}.${name}`;
  const plugin: IExtensionPlugin = {
    extensionId,
    name: `${driverName} Plugin`,
    type: 'driver',
    async register(extension) {
      // register ext part here
      extension.resourcesMap().set(`driver/${DRIVER_ALIASES[0].value}/icons`, {
        active: extContext.asAbsolutePath('icons/active.png'),
        default: extContext.asAbsolutePath('icons/default.png'),
        inactive: extContext.asAbsolutePath('icons/inactive.png'),
      });
      DRIVER_ALIASES.forEach(({ value }) => {
        extension.resourcesMap().set(`driver/${value}/extension-id`, extensionId);
        extension.resourcesMap().set(`driver/${value}/connection-schema`, extContext.asAbsolutePath('connection.schema.json'));
        extension.resourcesMap().set(`driver/${value}/ui-schema`, extContext.asAbsolutePath('ui.schema.json'));
      });
      await extension.client.sendRequest("ls/RegisterPlugin", {
        path: extContext.asAbsolutePath("dist/ls/plugin.js"),
      });
    }
  };
  api.registerPlugin(plugin);
  return {
    driverName,
    parseBeforeSaveConnection: ({ connInfo }) => {
      /**
       * This hook is called before saving the connection using the assistant
       * so you can do any transformations before saving it
       */
      if (connInfo.connectionMethod === 'Server Definition') {
        // Transform to a connectString property
        connInfo.connectString = `${connInfo.serverName}:${connInfo.namespace}`;
        connInfo.serverName = undefined;
        connInfo.namespace = undefined;
        // Remove properties carried over from 'Server and Port' type connection
        connInfo.server = undefined;
        connInfo.port = undefined;
        connInfo.pathPrefix = undefined;
        connInfo.https = undefined;
        connInfo.askForPassword = undefined;
        connInfo.username = undefined;
        connInfo.password = undefined;

      }
      return connInfo;
    },
    parseBeforeEditConnection: ({ connInfo }) => {
      /**
       * This hook is called before editing the connection using the assistant
       * so you can do any transformations before editing it.
       * EG: absolute file path transformation, string manipulation etc
       * Below is the exmaple for SQLite, where we use relative path to save,
       * but we transform to asolute before editing
       */
      if (connInfo.connectionMethod === 'Server Definition') {
        const connParts = connInfo.connectString.split(':');
        connInfo.serverName = connParts[0];
        connInfo.namespace = connParts[1];
      }
      return connInfo;
    },
    resolveConnection: async ({ connInfo }) => {
      /**
       * This hook is called after a connection definition has been fetched
       * from settings and is about to be used to connect.
       */
      if (connInfo.connectionMethod === 'Server Definition') {
        const connParts = connInfo.connectString.split(':');
        const serverName = connParts[0];
        const namespace = connParts[1];
        let connSpec = resolvedConnSpecs.get(serverName)
        if (!connSpec) {

          if (!serverManagerApi) {
            
            // Get api for servermanager extension
            const smExt = vscode.extensions.getExtension(smExtensionId);
            if (!smExt) {
              throw new Error("Server Manager extension not found");
            }
            if (!smExt.isActive) await smExt.activate();
            serverManagerApi = smExt.exports;
          }
          connSpec = await serverManagerApi.getServerSpec(serverName);
          if (!connSpec) {
            throw new Error(`Failed to fetch definition of server '${serverName}'`)
          }
          const isUnauthenticated = (username?: string): boolean => {
            return username && (username == "" || username.toLowerCase() == "unknownuser");
          }
          const resolvePassword = async (serverSpec): Promise<void> => {
            if (
              // Connection isn't unauthenticated
              (!isUnauthenticated(serverSpec.username)) &&
              // A password is missing
              typeof serverSpec.password == "undefined"
            ) {
              const scopes = [serverSpec.name, serverSpec.username || ""];
              
              // Handle Server Manager extension version < 3.8.0
              const account = serverManagerApi.getAccount ? serverManagerApi.getAccount(serverSpec) : undefined;
              
              let session = await vscode.authentication.getSession(serverManager.AUTHENTICATION_PROVIDER, scopes, {
                silent: true,
                account,
              });
              if (!session) {
                session = await vscode.authentication.getSession(serverManager.AUTHENTICATION_PROVIDER, scopes, {
                  createIfNone: true,
                  account,
                });
              }
              if (session) {
                // If original spec lacked username use the one obtained by the authprovider
                serverSpec.username = serverSpec.username || session.scopes[1];
                serverSpec.password = session.accessToken;
              }
            }
          }
          
          await resolvePassword(connSpec);
          resolvedConnSpecs.set(serverName, connSpec);
        }
        const resultSetRowLimit = vscode.workspace.getConfiguration('sqltools-intersystems-driver').get('resultSetRowLimit');
        connInfo = { ...connInfo,
          https: connSpec.webServer.scheme === 'https',
          server: connSpec.webServer.host,
          port: connSpec.webServer.port,
          pathPrefix: connSpec.webServer.pathPrefix || '',
          username: connSpec.username,
          password: connSpec.password,
          namespace,
          resultSetRowLimit,
          }
      }
      return connInfo;
    },
    driverAliases: DRIVER_ALIASES,
  }
}

export function deactivate() {}
