

// Node has native fetch in latest, but types are missing from @types/node.
// Stealing types from node-fetch.
import * as _fetct from 'node-fetch';
declare const fetch: typeof _fetct.default



export function fetchPost(url:string, body: Record<any,any>) {
    return fetch(url, {
        method:  "post",
        body:    JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
}
// For https://dev.twitch.tv/docs/authentication/refresh-tokens as it requires x-www-form-urlencoded
export function fetchPostForm(url:string, body: Record<string,string>) {

    const formBody = [];
    for (var property in body) {
        const encodedKey = encodeURIComponent(property);
        const encodedValue = encodeURIComponent(body[property]);
        formBody.push(encodedKey + "=" + encodedValue);
    }
    const serialize = formBody.join("&");

    return fetch(url, {
        method:  "post",
        body: serialize,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    })
}
