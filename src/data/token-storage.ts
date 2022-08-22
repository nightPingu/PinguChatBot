import path from "path";
import { promises as fs, existsSync} from 'fs';
import { fileURLToPath } from 'url';
import { AccessToken } from "../core/types/generic";
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const algorithm = 'aes-256-ctr';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFolder = path.join(__dirname, "..", "..", "secrets");
const jsonPath = path.join(outputFolder, 'tokens.json');

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
    getToken: async (): Promise<AccessToken | null> => {
        const folderExsists = existsSync(outputFolder)
        if(!folderExsists) return null;

        const encryptedToken: {encryptedToken:string} = await fs.readFile(jsonPath, {encoding: 'utf-8'})
            .then(s => typeof s == "string" ? JSON.parse(s) : undefined );
        if(!encryptedToken) return null;

        return JSON.parse(decrypt(encryptedToken.encryptedToken));
    },
    setToken: async(newTokenData:AccessToken): Promise<void> => {
        const encryptedToken = encrypt(JSON.stringify(newTokenData)) 


        const folderExsists = existsSync(outputFolder)
        if(!folderExsists) {
            await fs.mkdir(outputFolder, { recursive: true })
        }
    


        await fs.writeFile(jsonPath, JSON.stringify({warning:"Contains sensitive information", encryptedToken}, null, 4), {encoding: 'utf-8'})
        Token._notifyListeners(newTokenData);
        return;
    }
}


// We use CLIENT_SECRET to encrypt/decrpyted the token, this way we can avoid accidental leaks.
const encrypt = (text) => {
    const iv = randomBytes(16);
    // key needs to be 32 chars, if twitch gives out variable length secrets we need to adapt this code
    const key = process.env.CLIENT_SECRET + process.env.CLIENT_SECRET.slice(5, 5+2)
    
    const cipher = createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

const decrypt = (hash) => {
    // key needs to be 32 chars, if twitch gives out variable length secrets we need to adapt this code
    const key = process.env.CLIENT_SECRET + process.env.CLIENT_SECRET.slice(5, 5+2)
    
    const decipher = createDecipheriv(algorithm, key, Buffer.from(hash.iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrpyted.toString();
};