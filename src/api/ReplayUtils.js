import AttributeCodes from "../reader/attributes.js";
//functions to get basic info from a replay

export function getPlayers(details, metadata){
    const players = [];
    for(let i = 0; i < details.m_playerList.length; i++){
        const parsed = parsePlayerName(details.m_playerList[i].m_name)
        players.push({
            details: details.m_playerList[i],
            metadata: metadata.Players[i],
            name: parsed.name,
            clan: parsed.clan
        });
    }
    return players;
}
function parsePlayerName(rawName) {
    const str = Buffer.isBuffer(rawName) ? rawName.toString('utf-8') : rawName;
    const clanMatch = str.match(/&lt;(.+?)&gt;|<(.+?)>/);
    const clan = clanMatch ? (clanMatch[1] || clanMatch[2]) : null;
    const name = str
        .replace(/&lt;.*?&gt;/g, '')
        .replace(/<.*?>/g, '')
        .replace(/<sp\/>/g, '')
        .trim();
    return { name, clan };
}

//player id is 1 and 2 but players is 0 and 1, seems to line up though with higherplayer counts
// TODO fix team games or "undecided"
export function getWinner(metadata){
    return metadata.Players[0].Result == "Win" ? 0 : 1
}
export function getMapName(metadata){
    return metadata.Title;
}
export function getGameVersion(metadata){
    return metadata.GameVersion;
}
export function getDate(details){
    const windowsTime = BigInt(details.m_timeUTC);
    const unixMs = Number(windowsTime /10000n -11644473600000n);
    return new Date(unixMs);

}
export function getGameSpeed(attributes){
    return attributes.scopes["16"][AttributeCodes.GAME_SPEED][0].value;
}

const GAME_SPEED_FACTOR = {
    "Slor": 0.6,
    "Slow": 0.8,
    "Norm": 1.0,
    "Fast": 1.2,
    "Fasr": 1.4
};

export function getRealDuration(elapsedGameLoops, gameSpeed){
    const normalSeconds = elapsedGameLoops / 16;
    return Math.floor(normalSeconds /GAME_SPEED_FACTOR[gameSpeed]);
}

export function getGamemode(attributes){
    const gamemodeInfo = {
        gamemode: attributes.scopes[16][AttributeCodes.GAME_MODE][0].value,
        teamFormat: attributes.scopes[16][AttributeCodes.PARTIES_PREMADE][0].value
    }
    return gamemodeInfo;

}

export function isAIGame(players){
    for(const player of players){
        if(player.details.m_control === 3){
            return true;
        }
    }
    return false;
}
