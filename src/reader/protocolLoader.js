import{ readFileSync, readdirSync} from 'fs';
import {join, dirname} from 'path'
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROTOCOLS_DIR = join(__dirname, '../protocols');

const cache = new Map();
let availableBuilds = null;
//exported for testing
export function getAvailableBuilds() {
    if(availableBuilds) {return availableBuilds;}
    availableBuilds = readdirSync(PROTOCOLS_DIR).filter(f => f.match(/^protocol\d+\.json$/)).map(f => parseInt(f.match(/\d+/)[0])).sort((a, b) => a - b);
    return availableBuilds;
}
export function findNearestBuild(buildNumber) {
    const builds = getAvailableBuilds();
    let nearest = null;
    for(const build of builds){
        if(build <= buildNumber){
            nearest = build;
        }else { break; }
    }
    if(nearest === null) { throw new Error(`No Protocol found for build ${buildNumber}`)}
    return nearest;
}
//main function
export function loadProtocol(buildNumber) {
    const nearest = findNearestBuild(buildNumber);
    if (cache.has(nearest)) { return cache.get(nearest)}
    const filePath = join(PROTOCOLS_DIR, `protocol${nearest}.json`);
    const protocol = JSON.parse(readFileSync(filePath, "utf-8"))
    cache.set(nearest, protocol);
    return protocol;
    
}

