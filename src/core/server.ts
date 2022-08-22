import Fastify from 'fastify'
import { fetchPost } from '../utils/fetch.js';
import { Token } from '../utils/token-storage.js';


let isRunning = false;
const fastify = Fastify({
  logger: true
})



type AuthorizationCodeGrantFlowResponse = {
    code:  string
    scope: string
    state?: string
}
function isAuthorizationCodeGrantFlow(queryParams:any): queryParams is AuthorizationCodeGrantFlowResponse {
    return queryParams && queryParams.code && queryParams.scope
}

fastify.get('/', async function (request, reply) {
    console.log("-- START")
    console.log(request.body)
    console.log("......")
    console.log(request.query)
    console.log("-- END")

    if(isAuthorizationCodeGrantFlow(request.query)) {
        const res:any = await fetchPost('https://id.twitch.tv/oauth2/token', {
            client_id:      process.env.CLIENT_ID,
            client_secret:  process.env.CLIENT_SECRET,
            code:           request.query.code,
            grant_type:     "authorization_code",
            redirect_uri:   process.env.REDIRECT_URI
        }).then(res => res.json())
        console.log('res', res);
        Token.setToken({
            accessToken: res.access_token,
            refreshToken: res.refresh_token,
            obtainmentTimestamp: Date.now(),
            scope: res.scope,
        });
        
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
    start
}
