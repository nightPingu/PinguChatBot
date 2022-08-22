import WebSocket from "ws";
import { getIrcMessageType, IrcToPrivMsgMap } from "./messageParser.js";
import { controllablePromise, titleCase } from "../../utils/util.js";
import { AccessToken, FunctionProps } from "../types/generic.js";
import { PingPongPlugin } from "./plugins/pingPong.plugins.js";
import { InternalCodes, Plugin } from "./plugin.js";
import { ReconnectPlugin } from "./plugins/reconnect.plugin.js";

const log = console.log;

export class IrcConnection {


    // should be private, but for easy debugging otherplaces they are none private
    _ws:WebSocket
    _plugins:Plugin[] = [
        PingPongPlugin,
        ReconnectPlugin
    ]
    _confirmConnected: ReturnType<typeof setTimeout>;
    _token:AccessToken
    _usernameForToken:string

    private async callPlugins<T extends FunctionProps<Plugin>>(handlerName:T, data: Parameters<Plugin[T]>[0]) {
        const context = {breakSequence:false};
        let foundMatch = false;
        for(var cb of this._plugins) {
            if(context.breakSequence) break;
            const fn = cb[handlerName];
            if(typeof fn === 'function') {
                foundMatch = true;
                // types only works when calling method, internaly `data` is a union of all possible types.
                await fn(data as any, context, {connection:this})
            }
        }
        return foundMatch;
    }

    reconnect() {
        if(this._token && this._usernameForToken) {
            return this.connect(this._token, this._usernameForToken);
        } else {
            console.error("missing token or username, cannot reconnect.");
        }
        return Promise.reject();
    }
    connect(token:AccessToken, usernameForToken:string): Promise<IrcConnection> {
        this._token = token; this._usernameForToken = usernameForToken;
        const p = controllablePromise<IrcConnection>();
        if(this._ws) {
            this._ws.close(InternalCodes.MANUAL_DISCONNECT);
        }
        const ws = this._ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443', {
            perMessageDeflate: false
        });
          
        ws.on('close', (close) => {
            console.log('Connect close: ' + close.toString());
            this.callPlugins("onIrcConnectionClose", close)
            clearInterval(this._confirmConnected)
            p.error(close)
        });

        // ping is never called, Twitch sends thir pings to the 'message'
        ws.on('ping', (ping) =>  this.callPlugins("onPing", {raw:ping.toString()}));
        ws.on('error', (error) => this.callPlugins("onIrcConnectionError", error));

        ws.on('open', (open) => {
            ws.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands');
            ws.send(`PASS oauth:${token.accessToken}`);
            ws.send(`NICK ${usernameForToken}`);

            // adding a delay to ensure Twitch gets our auth before we send more commands. 
            // Should idealy be handled by the message handler
            this._confirmConnected = setTimeout(() => {
                this.callPlugins("onIrcConnectionOpen", open)
                p.resolve(this)
            }, 400)
        });

        ws.on('message', (data) => {
            const ircMessage = data.toString();
            const type = getIrcMessageType(ircMessage)
            const map = IrcToPrivMsgMap(ircMessage);

            if(type) {
                const methodName = "on"+ titleCase(type) as FunctionProps<Plugin>;
                const methodFound = this.callPlugins(methodName, map)
                if(!methodFound) {
                    log("No handler for", type, methodName)
                }
            } else {
                log(type, ircMessage)
            }
        })

        return p.promise
    }

    joinChannel(channelName:string) {
        this._ws.send(`JOIN #${channelName}`);
    }
    addPlugin( plugin: Plugin ) {
        this._plugins.push(plugin)
        this._plugins.sort((p1,p2) => (p1.order ?? 500) - (p2.order ?? 500));
    }
    removePlugin( plugin: Plugin  ) {
        const index = this._plugins.indexOf(plugin);
        if (index > -1) { 
            this._plugins.splice(index, 1);
        }
    }
}


