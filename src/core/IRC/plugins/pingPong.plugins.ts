import { Plugin } from "../plugin";





/**
 * Should be the first pluging to run.
 */
export const PingPongPlugin: Plugin = {
    name:"PingPingPlugin",
    order: -1001,
    

    onPing: (ping, data, internals) => {
        if(ping.raw.indexOf("PING") > -1) {
            const msg = ":"+ping.raw.split(":")[1];
            internals.connection._ws.send(`PONG ${msg}`);
            data.breakSequence = true;
        }
    }

}