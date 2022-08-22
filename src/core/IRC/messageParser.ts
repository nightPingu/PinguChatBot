import { IrcMap, IrcMessageType } from "./types";





export const regEx_IrcMessageToMap = new RegExp("((?<=\;|@)(.*?)(?=;)|(?<=\PRIVMSG.*:)(.*?)(?=$))", 'gm');
export function IrcToPrivMsgMap<T extends IrcMap = IrcMap>(ircMessage:string): T {
	if(!ircMessage || ircMessage.length < 3) return {} as T;
	
	const arr = ircMessage.match(regEx_IrcMessageToMap)
	if(arr && arr.length > 0) {

		const l = arr.length-1;
		const map = Object.fromEntries(
			arr.map((e, i) => i == l ? ["PRIVMSG", e] : e.split("=") )
		)
		map.raw = ircMessage;
		return map;
	}
	return {raw:ircMessage} as T;
}

 

/**
 *   Looks for the first word after frist occurance of `tmi.twitch.tv`
 * Example:
 *  - @room-id=12345678;target-user-id=87654321;tmi-sent-ts=1642715756806 :tmi.twitch.tv CLEARCHAT #dallas :ronni -> CLEARCHAT
 *  - :tmi.twitch.tv HOSTTARGET #abc :xyz 10 -> HOSTTARGET
 *  - :tmi.twitch.tv NOTICE #bar :The message from foo is now deleted. -> NOTICE
 *  - PING :tmi.twitch.tv -> null // This one requries special handeling
 * */ 
export const regEx_getIrcMessageType = /(?<=tmi\.twitch\.tv\s)[a-zA-Z]+/;
export function getIrcMessageType(ircMessage:string): IrcMessageType | undefined {
    if(!ircMessage || ircMessage.length < 3) return undefined
	const types = ircMessage.match(regEx_getIrcMessageType) as (IrcMessageType[] | null)
	// Some simpler types require direct lookup
	if(!types) {
		if(ircMessage.startsWith("PING")) {
			return 'PING'
		}
	}
	return types && types.length > 0 ? types[0] : undefined;
	
}