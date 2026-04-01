import AttributeCodes from "../reader/attributes.js";
//functions to get basic info from a replay

export function getAttribute(attributes, attrid) {
	if (!attributes?.scopes) return null;
	for (const s of Object.values(attributes.scopes)) {
		const val = s[attrid]?.[0]?.value;
		if (val != null) return val;
	}
	return null;
}
export function getPlayers(details, metadata) {
	const players = [];
	for (let i = 0; i < details.m_playerList.length; i++) {
		const parsed = parsePlayerName(details?.m_playerList[i]?.m_name) ?? null;
		players.push({
			details: details?.m_playerList[i] ?? null,
			metadata: metadata?.Players?.[i] ?? null,
			name: parsed?.name ?? null,
			clan: parsed?.clan ?? null,
		});
	}
	return players;
}
function parsePlayerName(rawName) {
	if (rawName == null) return { name: null, clan: null };
	const str = Buffer.isBuffer(rawName) ? rawName.toString("utf-8") : rawName;
	const clanMatch = str.match(/&lt;(.+?)&gt;|<(.+?)>/);
	const clan = clanMatch ? clanMatch[1] || clanMatch[2] : null;
	const name = str
		.replace(/&lt;.*?&gt;/g, "")
		.replace(/<.*?>/g, "")
		.replace(/<sp\/>/g, "")
		.trim();
	return { name, clan };
}

//player id is 1 and 2 but players is 0 and 1, seems to line up though with higherplayer counts
// TODO fix team games or "undecided"
export function getWinner(metadata) {
	if (!metadata) return "Unknown Result";
	const winnerIndex = metadata.Players.findIndex((p) => p.Result === "Win");
	return winnerIndex !== -1 ? winnerIndex : "Unknown Result";
}
export function getMapName(metadata, details) {
	if (metadata?.Title) return metadata.Title;
	const title = details.m_title;
	return Buffer.isBuffer(title) ? title.toString("utf-8") : (title ?? "Unknown");
}
export function getGameVersion(metadata, header) {
	if (metadata?.GameVersion) return metadata.GameVersion;
	const v = header.m_version;
	return `${v.m_major}.${v.m_minor}.${v.m_revision}.${v.m_build}`;
}
export function getDate(details) {
	const windowsTime = BigInt(details.m_timeUTC);
	const unixMs = Number(windowsTime / 10000n - 11644473600000n);
	return new Date(unixMs);
}

export function getGameSpeed(attributes, details) {
	const fromAttributes = getAttribute(attributes, AttributeCodes.GAME_SPEED);
	if (fromAttributes !== null) return fromAttributes;

	// fallback: some offline/custom replays store speed as a number in details
	const SPEED_BY_INDEX = ["Slor", "Slow", "Norm", "Fast", "Fasr"];
	return SPEED_BY_INDEX[details?.m_gameSpeed] ?? "Unknown";
}

const GAME_SPEED_FACTOR = {
	Slor: 0.6,
	Slow: 0.8,
	Norm: 1.0,
	Fast: 1.2,
	Fasr: 1.4,
	Unknown: 1.4, //if we dont know just do faster since all ladder games are faster.
};

export function getRealDuration(elapsedGameLoops, gameSpeed) {
	const normalSeconds = elapsedGameLoops / 16;
	return Math.floor(normalSeconds / GAME_SPEED_FACTOR[gameSpeed]);
}

export function getGamemode(attributes) {
	const gamemodeInfo = {
		gamemode: getAttribute(attributes, AttributeCodes.GAME_MODE) ?? "Unknown",
		teamFormat: getAttribute(attributes, AttributeCodes.PARTIES_PREMADE) ?? "Unknown",
	};
	return gamemodeInfo;
}

export function isAIGame(players) {
	return players.some((p) => p.details?.m_control === 3);
}
export function getTeams(players) {
	const teams = {};
	players.forEach((player) => {
		const teamId = player.details.m_teamId;
		if (!teams[teamId]) teams[teamId] = [];
		teams[teamId].push(player);
	});
	return Object.values(teams);
}
