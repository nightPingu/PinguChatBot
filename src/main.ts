import dotenv from "dotenv"

import { Server } from "./core/server.js";
import { Token } from "./utils/token-storage.js";
import { IrcConnection } from "./core/IRC/ircConnection.js";
import { LogChatToTerminal } from "./core/IRC/plugins/logChatToTerminal.plugin.js";
import { PollChatPlugin } from "./core/IRC/plugins/pollChat.plugin.js";
import chalk from "chalk";
import { fetchPostForm } from "./utils/fetch.js";
import { RefreshTokenResponse, RefreshTokenResponseError, RefreshTokenResponseResult } from "./core/types/twitch.js";
import { isType } from "./utils/util.js";


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




(async function() {

	let tokenData = await Token.getToken();
	let tokenOwnerUsername = "";

	if(tokenData?.refreshToken) {
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
		// User must visit link so we can acquired token for user.

		// Use this link to generate new token for chatbot, requries restart after being acquired.
		// Todo: Make it reconnect when we aquaire a new token. Global event for sharing data between services?
		const server = Server;
		server.start(3000);
		log("****** Link for new token ******");
		log(chalk.bgYellow.yellow(createLink()));
		log("****** Link for new token ******");
	}


	log("Opening IrcConnection");


	const irc = new IrcConnection()

	
	// Name must match with user used to get token
	await irc.connect(tokenData, tokenOwnerUsername)

	irc.addPlugin(LogChatToTerminal)
	irc.addPlugin(PollChatPlugin)

	// Connects to channel
	const channelName = ""
	irc.joinChannel(channelName)
	log("Connected");



})().catch(console.error);
