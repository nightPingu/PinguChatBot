import { stringNumber, stringBool } from "../types/generic"



/**
 * https://dev.twitch.tv/docs/irc#supported-irc-messages
 */
export type IrcMessageType = "CLEARCHAT" | "CLEARMSG" | "GLOBALUSERSTATE" | "NOTICE" |
 "PRIVMSG" | "ROOMSTATE" | "USERNOTICE" | "USERSTATE" | "WHISPER" | "PART" | "PING" | "RECONNECT"




 /**
 * See https://dev.twitch.tv/docs/irc/tags#privmsg-tags
 */
export type IrcMap<T extends Record<string, string> = Record<string, string>> =  {
	raw: string
} & T



/**
 * Standard Chat text message
 * https://dev.twitch.tv/docs/irc/tags#privmsg-tags
 * 
 */
export type PRIVMSG = IrcMap<{

	'badge-info': string
	/**
	 * Comma-separated list of chat badges
	 *     admin, bits, broadcaster, moderator, subscriber, staff, turbo
	 * Example:
	 * - 'moderator/1,subscriber/12,partner/1'
	 * - 'subscriber/3000,bits/25000'
	 * - 'subscriber/3006,sub-gifter/50'
	 * - 'subscriber/3006,sub-gifter/1000'
	 * - 'moderator/1,subscriber/3006,bits/100000'
	 */
	badges: string,
	 /**
	  * The amount of Bits the user cheered. Only a Bits cheer message includes this tag. 
	  */
	bits?: stringNumber
	/**
	 *  	An ID that uniquely identifies the message.
	 */
	id: string,
	/**
	 * Is true "1" if the user is a moderator; otherwise, false "0".
	 */
	mod: stringBool,
	// 'client-nonce': string // Docs says to ignore this one. https://dev.twitch.tv/docs/irc/example-parser
	// flags: string // Docs says to ignore this one. https://dev.twitch.tv/docs/irc/example-parser
	emotes: string
	/**
	 * Hex color of the username
	 */
	color: string
	"display-name": string
	'returning-chatter': stringNumber,
	/**
	 * An ID that identifies the chat channel (room).
	 */
	'room-id': stringNumber,
	/**
	 * Is "1" if the user is a subscriber; otherwise, false "0".
	 */
	subscriber: stringNumber,
	/**
	 * UNIX timestamp.
	 */
	'tmi-sent-ts': stringNumber,
	turbo: stringBool,

	'user-id': stringNumber,
	PRIVMSG: string,
	"user-type"?:  'admin' | 'global_mod' | 'staff'
}>
