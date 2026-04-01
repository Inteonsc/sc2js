import { MPQArchive } from "../reader/mpq.js";
import { loadProtocol } from "../reader/protocolLoader.js";
import {
	decodeReplayHeader,
	decodeReplayDetails,
	decodeReplayTrackerEvents,
	decodeReplayGameEvents,
	decodeReplayMessageEvents,
	decodeReplayInitData,
	decodeReplayAttributesEvents,
} from "../reader/protocolDecoder.js";
import {
	getPlayers,
	getDate,
	getGameSpeed,
	getGameVersion,
	isAIGame,
	getMapName,
	getGamemode,
	getRealDuration,
	getWinner,
} from "./ReplayUtils.js";

export class SC2Replay {
	#mpq;
	#protocol;
	#cache = {};

	constructor(path) {
		this.path = path;
		this.#mpq = new MPQArchive(path, true);
		const header = decodeReplayHeader(
			this.#mpq.UserDataHeader.user_data_content,
			loadProtocol(95299) // base protocol for header
		);
		this.#protocol = loadProtocol(header.m_version.m_baseBuild);
	}

	getListFiles() {
		return this.#mpq.files;
	}

	getHeader() {
		if (this.#cache.header !== undefined) return this.#cache.header;

		this.#cache.header = decodeReplayHeader(
			this.#mpq.UserDataHeader.user_data_content,
			this.#protocol
		);

		return this.#cache.header;
	}

	getDetails() {
		if (this.#cache.details !== undefined) return this.#cache.details;
		try {
			this.#cache.details = decodeReplayDetails(
				this.#mpq.readFile("replay.details"),
				this.#protocol
			);
		} catch {
			this.#cache.details = null;
		}
		return this.#cache.details;
	}

	getInitData() {
		if (this.#cache.initData !== undefined) return this.#cache.initData;
		try {
			this.#cache.initData = decodeReplayInitData(
				this.#mpq.readFile("replay.initData"),
				this.#protocol
			);
		} catch {
			this.#cache.initData = null;
		}
		return this.#cache.initData;
	}

	getMetadata() {
		if (this.#cache.metadata !== undefined) return this.#cache.metadata;
		try {
			this.#cache.metadata = JSON.parse(
				this.#mpq.readFile("replay.gamemetadata.json").toString("utf-8")
			);
		} catch (e) {
			this.#cache.metadata = null;
		}
		return this.#cache.metadata;
	}

	getAttributeEvents() {
		if (this.#cache.attributes !== undefined) return this.#cache.attributes;
		try {
			this.#cache.attributes = decodeReplayAttributesEvents(
				this.#mpq.readFile("replay.attributes.events")
			);
		} catch {
			this.#cache.attributes = null;
		}
		return this.#cache.attributes;
	}

	// generators — not cached since they stream
	getTrackerEvents() {
		try {
			return decodeReplayTrackerEvents(
				this.#mpq.readFile("replay.tracker.events"),
				this.#protocol
			);
		} catch {
			return [][Symbol.iterator]();
		}
	}

	getGameEvents() {
		try {
			return decodeReplayGameEvents(this.#mpq.readFile("replay.game.events"), this.#protocol);
		} catch {
			return [][Symbol.iterator]();
		}
	}

	getMessageEvents() {
		try {
			return decodeReplayMessageEvents(
				this.#mpq.readFile("replay.message.events"),
				this.#protocol
			);
		} catch {
			return [][Symbol.iterator]();
		}
	}

	getBasicInfo() {
		if (this.#cache.basicInfo) {
			return this.#cache.basicInfo;
		}
		const details = this.getDetails();
		if (!details) {
			this.#cache.basicInfo = null;
			return null;
		}
		const metadata = this.getMetadata();
		const header = this.getHeader();
		const attributes = this.getAttributeEvents();
		const players = getPlayers(details, metadata);
		const gameSpeed = getGameSpeed(attributes, details);
		this.#cache.basicInfo = {
			map: getMapName(metadata, details),
			date: getDate(details),
			version: getGameVersion(metadata, header),
			players: players,
			winner: getWinner(metadata),
			gameSpeed: gameSpeed,
			duration: getRealDuration(header.m_elapsedGameLoops, gameSpeed),
			isAIGame: isAIGame(players),
			gamemode: getGamemode(attributes),
			teams: getTeams(players),
			path: this.path,
		};
		return this.#cache.basicInfo;
	}
	getFullInfo() {
		return {
			basicInfo: this.getBasicInfo(),
			header: this.getHeader(),
			metadata: this.getMetadata(),
			details: this.getDetails(),
			initData: this.getInitData(),
			attributes: this.getAttributeEvents(),
		};
	}
}
