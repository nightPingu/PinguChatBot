

# PinguChatBot

Plugin based chatbot for Twitch IRC api, made with Typescript.
https://dev.twitch.tv/docs/irc

    **NEVER SHARE SENSITIVE INFORMATION WITH OTHERS**
    These are to be considerd sensitive `CLIENT_SECRET`, `contents of data/tokens.json`, `contents of .env`


<br>
##### TODO:
- [ ] *Feature*: Send irc message
- [X] Change path were data is written to. Output data should not exsist inside src folder. 
- [X] Encrypt accsess_token and refresh_token when written to disk. 
- [ ] If public interest, add lib build and publish to npm.
- [ ] If public interest, add unit tests.
- [ ] Low pri: Redo types, meta/generated types are nice but work poor as documentation   


<br>

### Core Types for Plugins
Plugins are run in sequential order, they have a shared statefull object `IrcConnectionPluginData` passed so they can share state if needed.


<details closed>
<summary>Type: IRC message types</summary>

```` ts
/**
 * https://dev.twitch.tv/docs/irc#supported-irc-messages
 */
type IrcMessageType = "CLEARCHAT" | "CLEARMSG" | "GLOBALUSERSTATE" | "NOTICE" |
 "PRIVMSG" | "ROOMSTATE" | "USERNOTICE" | "USERSTATE" | "WHISPER" | "PART" | "PING" | "RECONNECT"
````

</details>

<details closed>
<summary>Type: IRC Generi message</summary>

```` ts
// Parsed map like object used for Generic handlers.
type IrcMap<T extends Record<string, string> = Record<string, string>> =  {
    /**
     * Raw irc message, usefull for event like messages Twitch sends.
     */
    raw: string
} & T
````

</details>

<details closed>
<summary>Type: IRC <b> PRIVMSG </b> message</summary>

```` ts
/**
 * Standard Chat text message
 * https://dev.twitch.tv/docs/irc/tags#privmsg-tags
 * 
 */
type PRIVMSG = IrcMap<{

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
````

</details>


<details closed>
<summary>Type: Shard state per IRC message for plugins </summary>

```` ts
/**
 * Data passed to each plugin, contains data added by plugins earlier in the sequence.
 * Scoped to each IRC message
 */
interface IrcConnectionPluginData {
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
````

</details>


<details closed>
<summary>Type: <b>Plugin</b>, eventHandler like methods for Twitch IRC message types </summary>

```` ts
type IrcConnectionListnerFunction<T = IrcMap> = (map:T, data?:IrcConnectionPluginData, internals?:{connection:IrcConnection}) => void;

// Genereate type for method names, based on string union IrcMessageType 
type IrcMessageTypeHandlerNames = `on${Capitalize<Lowercase<Exclude<IrcMessageType, 'PRIVMSG'>>>}`
type IrcMessageTypeHandlerMethods = { [key in IrcMessageTypeHandlerNames]?: IrcConnectionListnerFunction; }


type Plugin = IrcMessageTypeHandlerMethods & {
    name: string;
    order?: number;
    onPrivmsg?: IrcConnectionListnerFunction<PRIVMSG>;
    onIrcConnectionClose?: IrcConnectionListnerFunction<number>;
    onIrcConnectionError?: IrcConnectionListnerFunction<Error>;
    onIrcConnectionOpen?: IrcConnectionListnerFunction;
}
````

</details>


<br>

### Minimal Plugin example
```` ts
const LogChatToTerminal: Plugin = {
    name:"LogChatToTerminal",

    order:999,

    // Normal chat message
    onPrivmsg: (map: PRIVMSG, _data: IrcConnectionPluginData, _internals) => {
        console.log(chalk.hex(map.color)(map["display-name"]), ": " + map.PRIVMSG);
    }
}

 // ...code remove from brevity

const irc = new IrcConnection()

irc.addPlugin(LogChatToTerminal)
irc.joinChannel("channelName")


````


## Features

#### Print chat to terminal
Full colord chat in terminal with all possible 16.7 million colors thanks to `Chack`. 

#### Poll

By starting a poll, viewers can vote by sending messages starting with `1` or `2`.
Must be broadcaster or mod to run the commands

###### Commands
- Start
  - `!pollstart any text here is name`, is case insensitive 
- End   
  - `!pollend` 

<details closed>
<summary> Poll results are stored as JSON</summary>


``` json
{
    "name": "!pollstart",
    "startedBy": "mod1_username",
    "pollStartedAt": 1661107005726,
    "endedBy": "mod2_username",
    "pollEndedAt": 1661107025070,
    "markdown": [
        "|                    1 |                     2 |",
        "|----------------------|-----------------------|",
        "|            username1 |             username3 | ",
        "|            username2 |                       | ",
        "|             total: 2 |              total: 1 |"
    ],
    "votes": {
        "1": [
            "username1",
            "username2"
        ],
        "2": [
            "username3"
        ]
    },
    "hasVotedRegister": [
        "username1",
        "username2",
        "username3"
    ]
}
```

</details>

<br\>

## Instructions

Download or clone repo.

1. Visit Twitch Dev console to get CLIENT_ID and CLIENT_SECRET
https://dev.twitch.tv/docs/authentication/register-app

1. Set up `.env`.
    - Set/update  CLIENT_ID, CLIENT_SECRET, REDIRECT_URI and BOT_USERNAME


2. Run project - `npm run dev:run channelName`
     - Example: npm run dev:run twitchgaming
3. Follow instructions as shown in terminal. 



### Docs

https://dev.twitch.tv/docs/irc/send-receive-messages

https://dev.twitch.tv/docs/irc#keepalive-messages







## Other

#### ESM

Project uses ESM.
This requires some changes
- Imports may require a suffix of `.js`.
- `__dirname` now requires some logic. Please view the below code.

```` ts

// replacement for direct useage of __dirname, in ESM projects.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
````