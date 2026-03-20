//functions to get basic info from a replay

export function getPlayers(details){
    return details.m_playerList;
}
//player id is 1 and 2 but players is 0 and 1, seems to line up though with higherplayer counts
// TODO fix team games or "undecided"
export function getWinner(metadata){
    return metadata.Players[0].Result == "Win" ? 1 : 2
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
    console.log(new Date(unixMs));
    return new Date(unixMs);

}
export function getGameSpeed(attributes){}
export function getRealDuration(elapsedGameLoops, gameSpeed){}
// TODO add clan tag, make sure everything is strings
export function getPlayersMetaData(metadata){
    return metadata.Players;
}