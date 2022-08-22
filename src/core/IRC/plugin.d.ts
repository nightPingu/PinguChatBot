import { IrcMap, IrcMessageType, PRIVMSG } from "./types";
import { IrcConnection } from "./ircConnection";



export const enum InternalCodes {

    MANUAL_DISCONNECT = -500
}

/**
 * Data passed to each plugin, contains data added by plugins earlier in the sequence.
 * Scoped to each IRC message
 */
export interface IrcConnectionPluginData {
    /**
     * When set, plugins lower in order will not be run.
     * Similar to Event.preventDefault()
     */
    breakSequence: boolean;

    /**
     *  Plugins can attach more data for other plugins to consume.
     */
    [key:string]: any
} 

export type IrcConnectionListnerFunction<T = IrcMap> = (map:T, data?:IrcConnectionPluginData, internals?:{connection:IrcConnection}) => void;


// Genereate type for method names, based on string union IrcMessageType 
type IrcMessageTypeHandlerNames = `on${Capitalize<Lowercase<Exclude<IrcMessageType, 'PRIVMSG'>>>}`
type IrcMessageTypeHandlerMethods = { [key in IrcMessageTypeHandlerNames]?: IrcConnectionListnerFunction; }

export type Plugin = IrcMessageTypeHandlerMethods & {
    /**
     * for easier debugging
     */
    name: string;
    /*
     * values below 0 are reserved for internal use.
     * values above 1000 are somewhat garanted to run last.
     * defaults to 500.
     */
    order?: number; 

    // Generic handlers, but with more spesific typeing.
    onPrivmsg?: IrcConnectionListnerFunction<PRIVMSG>;

    // internal handlers
    onIrcConnectionClose?: IrcConnectionListnerFunction<number>;
    onIrcConnectionError?: IrcConnectionListnerFunction<Error>;
    onIrcConnectionOpen?: IrcConnectionListnerFunction;
};