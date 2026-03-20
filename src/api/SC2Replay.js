import { MPQArchive } from '../reader/mpq.js';
import { loadProtocol } from '../reader/protocolLoader.js';
import { 
    decodeReplayHeader, decodeReplayDetails, decodeReplayTrackerEvents,
    decodeReplayGameEvents, decodeReplayMessageEvents, decodeReplayInitData,
    decodeReplayAttributesEvents} 
from '../reader/protocolDecoder.js';
import { 
    getPlayers, getDate, getGameSpeed, getGameVersion,
    getMapName, getPlayersMetaData, getRealDuration, getWinner} 
from './ReplayUtils.js';

//TODO add string conversion for fields (cant just convert the entire file like we did with metadata)
export class SC2Replay {
    #mpq;
    #protocol;
    #cache = {};

    constructor(path) {
        this.#mpq = new MPQArchive(path);
        const header = decodeReplayHeader(
            this.#mpq.UserDataHeader.user_data_content,
            loadProtocol(95299) // base protocol for header
        );
        this.#protocol = loadProtocol(header.m_version.m_baseBuild);
    }

    getHeader() {
        if (this.#cache.header) return this.#cache.header;
        this.#cache.header = decodeReplayHeader(
            this.#mpq.UserDataHeader.user_data_content,
            this.#protocol
        );
        return this.#cache.header;
    }

    getDetails() {
        if (this.#cache.details) return this.#cache.details;
        this.#cache.details = decodeReplayDetails(
            this.#mpq.readFile('replay.details'),
            this.#protocol
        );
        return this.#cache.details;
    }

    getInitData() {
        if (this.#cache.initData) return this.#cache.initData;
        this.#cache.initData = decodeReplayInitData(
            this.#mpq.readFile('replay.initData'),
            this.#protocol
        );
        return this.#cache.initData;
    }

    getMetadata() {
        if (this.#cache.metadata) return this.#cache.metadata;
        this.#cache.metadata = JSON.parse(
            this.#mpq.readFile('replay.gamemetadata.json').toString('utf-8')
        );
        return this.#cache.metadata;
    }

    getAttributeEvents() {
        if (this.#cache.attributes) return this.#cache.attributes;
        this.#cache.attributes = decodeReplayAttributesEvents(
            this.#mpq.readFile('replay.attributes.events')
        );
        return this.#cache.attributes;
    }

    // generators — not cached since they stream
    getTrackerEvents() {
        return decodeReplayTrackerEvents(
            this.#mpq.readFile('replay.tracker.events'),
            this.#protocol
        );
    }

    getGameEvents() {
        return decodeReplayGameEvents(
            this.#mpq.readFile('replay.game.events'),
            this.#protocol
        );
    }

    getMessageEvents() {
        return decodeReplayMessageEvents(
            this.#mpq.readFile('replay.message.events'),
            this.#protocol
        );
    }
    
    getBasicInfo() {
        if(this.#cache.basicInfo){ return this.#cache.basicInfo;}
        const details = this.getDetails();
        const metadata = this.getMetadata();
        const header = this.getHeader();
        const attributes = this.getAttributeEvents();
        this.#cache.basicInfo = {
            map: getMapName(metadata),
            date: getDate(details),
            version: getGameVersion(metadata),
            players: getPlayers(details, metadata),
            winner: getWinner(metadata),
            gameSpeed: getGameSpeed(attributes),
            duration: getRealDuration(header.m_elapsedGameLoops, getGameSpeed(attributes)),
        };
        return this.#cache.basicInfo;
    }
}