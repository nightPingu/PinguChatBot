import path from "path";
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { AccessToken } from "../core/types/generic";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var jsonPath = path.join(__dirname, "..", 'data', 'tokens.json');
type Listner = (token:AccessToken) => void;
type IToken = {
    _listners: Set<Listner>
    _notifyListeners: (newTokenData:AccessToken) => void
    getToken: () =>  Promise<AccessToken>
    setToken: (newTokenData:AccessToken) => Promise<void>
    addListner: (cb:Listner) => void
    removeListner: (cb:Listner) => void
}

export const Token: IToken = {
    _listners: new Set(),
    _notifyListeners: (token:AccessToken) => {Token._listners.forEach(listner => listner(token))},
    addListner: (cb:Listner) => Token._listners.add(cb),
    removeListner: (cb:Listner) => Token._listners.delete(cb),
    getToken: (): Promise<AccessToken> => fs.readFile(jsonPath, {encoding: 'utf-8'}).then(s => JSON.parse(s)),
    setToken: (newTokenData:AccessToken): Promise<void> => {
        fs.writeFile(jsonPath, JSON.stringify(newTokenData, null, 4), {encoding: 'utf-8'})
        Token._notifyListeners(newTokenData);
        return Promise.resolve();
    }
}