import { InternalCodes, Plugin } from "../plugin";

const enum ConnectionStatus {
    'connected' = 'connected',
    'connecting' = 'connecting',
    'invalid_auth' = 'invalid_auth',
    'max_reconnect_attempts_reached' = 'max_reconnect_attempts_reached',
    'connection_closed' = 'connection_closed'
}


const state:{
    status: undefined | ConnectionStatus
    shouldAttemptRecconect:boolean
    retryAttemptsMade: 0|1|2|3|4|5|6|7|8
    reconnectId: ReturnType<typeof setTimeout>
} = {
    status: undefined,
    shouldAttemptRecconect: true,
    retryAttemptsMade: 0,
    reconnectId: undefined
};


export const ReconnectPlugin: Plugin = {
    name:"ReconnectPlugin",
    order: -999,
    
    onIrcConnectionClose: async (code, data, internals) => {
        
        state.status = ConnectionStatus.connection_closed;
        if(code === InternalCodes.MANUAL_DISCONNECT) return;

        if (state.shouldAttemptRecconect && state.retryAttemptsMade < 8 && state.reconnectId == undefined) {
            console.info("Attempting reconnect", state);

            const delay = (state.retryAttemptsMade * 2) * 1000;
            state.reconnectId = setTimeout(async () => {
                state.retryAttemptsMade++
                state.status = ConnectionStatus.connecting
                await internals.connection.reconnect();
                state.reconnectId = undefined
                }, 
                delay
            )
        } 
        else if(state.retryAttemptsMade >= 8 ) {
            state.shouldAttemptRecconect = false;
            state.status = ConnectionStatus.max_reconnect_attempts_reached;
            console.error("Max reconnect attempts have been made.");
        } 
        else {
            console.log("No attempt at reconenct being made", state);
        }

    },
    onIrcConnectionError: (err, data, internals) => {
        console.log(err);
        
    },
    onIrcConnectionOpen: (ping, data, internals) => {
        state.status = ConnectionStatus.connected;

    },

    /**
     * Activated if Twitch wants us to reconnect, for various reasons.
     * https://dev.twitch.tv/docs/irc/commands#reconnect
     */
    onReconnect: (ping, data, internals) => {
        state.status = ConnectionStatus.connecting;
        state.shouldAttemptRecconect = false;
        // close connection and prevent reconnection from running
        internals.connection._ws.close(InternalCodes.MANUAL_DISCONNECT);
        internals.connection.reconnect().then( _ => {
            const newWS = internals.connection._ws
            if(newWS.readyState === newWS.OPEN) {
                state.shouldAttemptRecconect = true;
                state.status = ConnectionStatus.connected;
            }

        });



    },
    onNotice: (map, data, internals) => {
        const raw = map.raw;
        if(raw.indexOf("Login authentication failed") > -1) {
            console.error('TWITCH: Login authentication failed');
            
            state.status = ConnectionStatus.invalid_auth;
            state.shouldAttemptRecconect = false;
        }
    },


}