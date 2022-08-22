import dotenv from "dotenv"

import { Server } from "./core/server.js";
import { Token } from "./data/token-storage.js";
import { IrcConnection } from "./core/IRC/ircConnection.js";
import { LogChatToTerminal } from "./core/IRC/plugins/logChatToTerminal.plugin.js";
import { PollChatPlugin } from "./core/IRC/plugins/pollChat.plugin.js";
import chalk from "chalk";
import { fetchPostForm } from "./utils/fetch.js";
import { RefreshTokenResponse, RefreshTokenResponseError, RefreshTokenResponseResult } from "./core/types/twitch.js";
import { isType } from "./utils/util.js";
import { printInBox } from "./utils/log.js";


dotenv.config()
const log = console.log;


function createLink() {
	return `https://id.twitch.tv/oauth2/authorize
			?response_type=code
			&client_id=${process.env.CLIENT_ID}
			&redirect_uri=${process.env.REDIRECT_URI}
			&scope=chat%3Aread+chat%3Aedit
			`.replace(/\s/g, "")
}




const args = process.argv.slice(2);

(async function() {

	// --------------------------------------------
	// -- Load or promt user to aquire token  -----
	// --------------------------------------------

	let tokenData = await Token.getToken();
	// tokenData = undefined;

	if(tokenData?.refreshToken?.length > 5) {
		// Refresh token attempt
		const res:  RefreshTokenResponse = await fetchPostForm("https://id.twitch.tv/oauth2/token", {
			client_id: process.env.CLIENT_ID,
			client_secret: process.env.CLIENT_SECRET,
			grant_type: "refresh_token",
			refresh_token: encodeURIComponent(tokenData.refreshToken),
		}).then(res => res.json());

		if(isType<RefreshTokenResponseResult>(res, t => !!t.refresh_token))  {
			tokenData = {
				accessToken: res.access_token,
				refreshToken: res.refresh_token,
				obtainmentTimestamp: Date.now(),
				scope: res.scope,
			};
			await Token.setToken(tokenData);
			log("Token refreshed");
			
 		} else if (isType<RefreshTokenResponseError>(res, t => !!t.error)) {
			log("Refreshing Token error", res);
		}

	} else {
		log("Token is missing or invalid, please follow the link given to aquire new token");
		const server = Server;
		server.start(3000);
		printInBox(
			{text:"****** Link for new token ******", pos:'center', transform:chalk.yellow},
			{text:createLink(), transform: chalk.underline},
			{text:"****** Link for new token ******", pos:'center', transform:chalk.yellow}
		)
		// Wait on user to visit link and get token.
		tokenData = await server.onTokenRefresh
		setTimeout(() => {
			server.fastify.close();
		}, 5 * 1000) // Allow fastify to complete any logging
	}




	// --------------------------------------------
	// -- Setting up IRC connection and Plugins ---
	// --------------------------------------------
	const irc = new IrcConnection()
	// Username must belong to same user access_token was aquired with.
	await irc.connect(tokenData, process.env.BOT_USERNAME)

	irc.addPlugin(LogChatToTerminal)
	irc.addPlugin(PollChatPlugin)



	// --------------------------------------------
	// -- Connecting to Channel -------------------
	// --------------------------------------------

	if(!args[0]) {
		log("Please pass argument for the chennel you want to visit, Example: `npm run dev:run channelName` ")
	}
	const channelName = args[0] ?? process.env.DEFAULT_CHANNEL_TO_JOIN ?? "twitchgaming"
	log("Connecting to "+ (!!args[0] ? ' selected channel' : ' default channel'), channelName)
	irc.joinChannel(channelName)
	log("Connected");



})().catch(console.error);



