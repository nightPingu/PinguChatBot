/**
 * Server for reciving http requests and redirects from Twitch.
 * 
 * Only used for aquireing token, is shut down afterwords. 
 */


import Fastify from 'fastify'
import { fetchPost } from '../utils/fetch.js';
import { Token } from '../data/token-storage.js';
import { controllablePromise } from '../utils/util.js';
import { AccessToken } from './types/generic.js';


const p = controllablePromise<AccessToken>()
let isRunning = false;
const fastify = Fastify({
  logger: true
})

let debugMode = false;
const log = (...args) =>  debugMode && console.log(...args)

type AuthorizationCodeGrantFlowResponse = {
    code:  string
    scope: string
    state?: string
}
function isAuthorizationCodeGrantFlow(queryParams:any): queryParams is AuthorizationCodeGrantFlowResponse {
    return queryParams && queryParams.code && queryParams.scope
}
fastify.get('/', async function (request, reply) {

    if(isAuthorizationCodeGrantFlow(request.query)) {
        const res:any = await fetchPost('https://id.twitch.tv/oauth2/token', {
            client_id:      process.env.CLIENT_ID,
            client_secret:  process.env.CLIENT_SECRET,
            code:           request.query.code,
            grant_type:     "authorization_code",
            redirect_uri:   process.env.REDIRECT_URI
        }).then(res => res.json())

        const token = {
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            obtainmentTimestamp: Date.now(),
            scope: res.scope,
        }

        Token.setToken(token);
        p.resolve(token)
    }
    
    reply.code(200).send();
})

function start(port:number = 3000) {
    if(isRunning) return
    isRunning = true;
    return fastify.listen({ port }, function (err, address) {
        if (err) {
            console.error(err)
            fastify.log.error(err)
            process.exit(1)
        }
    // Server is now listening on ${address}
    })
}

export const Server = {
    fastify,
    start,
    onTokenRefresh: p.promise,
    debug: (b:boolean) => debugMode = b
}
