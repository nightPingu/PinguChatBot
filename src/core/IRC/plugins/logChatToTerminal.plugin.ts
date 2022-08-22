import { Plugin } from "../plugin";
import chalk from 'chalk';
import { PRIVMSG } from "../types";






export const LogChatToTerminal:Plugin = {
    name:"LogChatToTerminal",

    order:999,

    onPrivmsg: (map: PRIVMSG) => {
        console.log(chalk.hex(map.color)(map["display-name"]), ": " + map.PRIVMSG);
    }
}