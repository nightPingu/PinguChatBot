


/**
 * https://dev.twitch.tv/docs/authentication/refresh-tokens
 */
export type  RefreshTokenResponse = RefreshTokenResponseResult | RefreshTokenResponseError

export type  RefreshTokenResponseResult ={
    access_token: string
    refresh_token: string
    scope: string[]
    token_type: "bearer"
}
export type  RefreshTokenResponseError = {
    "error": "Bad Request",
    "status": 400,
    "message": "Invalid refresh token"
}