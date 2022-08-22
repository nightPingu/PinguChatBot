export type stringNumber = `${number}`;
export type stringBool = '0' | '1';

export type lowercase =  "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
export type uppercase = Uppercase<lowercase>;


export type Falsy = false | 0 | '' | null | undefined;

/**
 * Get keys from T where value type is Function
 */
export type FunctionProps<T> = ({ [P in keyof T]: T[P] extends Function ? P : never })[keyof T];


// Stolen from twurple
export interface AccessToken {
    /**
     * The access token which is necessary for every request to the Twitch API.
     */
    accessToken: string;
    /**
     * The refresh token which is necessary to refresh the access token once it expires.
     */
    refreshToken: string | null;
    /**
     * The scope the access token is valid for, i.e. what the token enables you to do.
     */
    scope: string[];

    /**
     * The date when the token was obtained, in epoch milliseconds.
     * We populate this field when we recive the token/response.
     */
    obtainmentTimestamp: number;
}
