

import path from "path";
import { promises as fs } from 'fs';
import  * as fsSync  from 'fs';
import { fileURLToPath } from 'url';
import { AccessToken } from "../core/types/generic";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DataStorage = {

    /**
     * pathToData is relative to the data folder.
     */
    read: <T = any,>(pathToData:string): Promise<T> => {
        if(!pathToData.endsWith(".json")) {
            pathToData = pathToData+".json"
        }
        return fs.readFile(
            path.join(__dirname, pathToData),
            {encoding: 'utf-8'}
         ).then(s => JSON.parse(s))
    },
    /**
     * pathToData is relative to the data folder.
     * only stringifyable data will be persisted.
     */
    store: async (pathToData:string, body:Record<any,any> | {toJson:() => string}, mkDir?:boolean): Promise<void> => {
        if(!pathToData.endsWith(".json")) {
            pathToData = pathToData+".json"
        }
        if(mkDir) {
            const startOfFilename = pathToData.lastIndexOf("/")
            const folder = pathToData.slice(0, startOfFilename);
            console.log('folder', folder);
            
            const folderExsists = fsSync.existsSync(path.join(__dirname, folder))
            console.log('folderExsists', folderExsists);
            if(!folderExsists) {
                const mkdir = await fs.mkdir(path.join(__dirname, folder), { recursive: true })
                console.log('mkdir', mkdir);

            }

        }
        let json;
        if (typeof body.toJson === 'function') {
            json = body.toJson();
            if(typeof json !== 'string') {
                throw Error("Provided body has toJson method, but did not return string.");
            }
        } else {
            json = JSON.stringify(body, null, 4);
        }

        fs.writeFile(
            path.join(__dirname, pathToData),
            json,
            {encoding: 'utf-8'}
        )
        return;
    }
}