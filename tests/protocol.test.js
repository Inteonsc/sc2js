import { describe, test, expect } from "vitest";
import AttributeCodes from "../src/reader/attributes.js";
import { getAvailableBuilds, findNearestBuild, loadProtocol } from "../src/reader/protocolLoader";  
import { unitTag, unitTagIndex, unitTagRecycle, decodeReplayDetails, decodeReplayTrackerEvents, decodeReplayHeader, 
    decodeReplayGameEvents, decodeReplayMessageEvents, decodeReplayInitData, decodeReplayAttributesEvents } from '../src/reader/protocolDecoder.js';
import { MPQArchive } from '../src/reader/mpq.js';

const mpq = new MPQArchive('tests/fixtures/testreplay.SC2Replay', false);
const protocol = loadProtocol(95299);

    

describe("Protocol Loader", () => {
    test("getAvailableBuilds returns sorted list", () => {
        const builds = getAvailableBuilds();
        expect(builds).toBeDefined();
        expect(builds).toEqual([...builds].sort((a,b) => a-b));
    })

    test("findNearestBuild Returns correct build", () => {
        const buildNumber = findNearestBuild(55505);
        expect(buildNumber).toBe(55505);
    })

    test("findNearestBuild finds closest build", () => {
        const buildNumber = findNearestBuild(55900);
        expect(buildNumber).toBe(55505);
    })

    test("findNearestBuild throws when build is too old", () => {
        expect(() => findNearestBuild(10000)).toThrow();
    })
    test("loadprotocol returns valid protocol", () => {
        const protocol = loadProtocol(55505);
        expect(protocol).toBeDefined();
        expect(protocol.typeinfos).toBeDefined();
        expect(protocol.game_event_types).toBeDefined();
        expect(protocol.replay_initdata_typeid).toBe(73);
        expect(protocol.message_eventid_typeid).toBe(1)
        const [typeid, name] = protocol.message_event_types[0];
        expect(typeid).toBe(190);
        expect(name).toBe("NNet.Game.SChatMessage");


    })
    test("loadprotocol caches correctly", () => {
        const first = loadProtocol(95299);
        const second = loadProtocol(95299);
        expect(first).toBe(second);
    })
});



describe("Protocol Decoder", () => {
    describe("unitTag", () => {
		test("packs index and recycle into a single integer", () => {
			expect(unitTag(1, 0)).toBe(1 << 18);
		});

		test("packs zero values", () => {
			expect(unitTag(0, 0)).toBe(0);
		});

		test("packs index and non-zero recycle", () => {
			expect(unitTag(1, 1)).toBe((1 << 18) + 1);
		});
	});

	describe("unitTagIndex", () => {
		test("extracts index from unit tag", () => {
			expect(unitTagIndex(unitTag(5, 3))).toBe(5);
		});

		test("extracts index of zero", () => {
			expect(unitTagIndex(unitTag(0, 3))).toBe(0);
		});
	});

	describe("unitTagRecycle", () => {
		test("extracts recycle from unit tag", () => {
			expect(unitTagRecycle(unitTag(5, 3))).toBe(3);
		});

		test("extracts recycle of zero", () => {
			expect(unitTagRecycle(unitTag(5, 0))).toBe(0);
		});
	});

	describe("unitTag roundtrip", () => {
		test("index and recycle survive pack/unpack", () => {
			const index = 42;
			const recycle = 7;
			const tag = unitTag(index, recycle);
			expect(unitTagIndex(tag)).toBe(index);
			expect(unitTagRecycle(tag)).toBe(recycle);
		});
	});

	describe("decodeReplayDetails", () => {
		test("returns expected map name", () => {
			const bytes = mpq.readFile("replay.details");
			const details = decodeReplayDetails(bytes, protocol);
			expect(details.m_title.toString("utf-8")).toBe("10000 Feet LE");
		});

		test("returns player list", () => {
			const bytes = mpq.readFile("replay.details");
			const details = decodeReplayDetails(bytes, protocol);
			expect(details.m_playerList).toBeDefined();
			expect(details.m_playerList.length).toBeGreaterThan(0);
		});
	});

	describe("decodeReplayTrackerEvents", () => {
		test("yields events", () => {
			const bytes = mpq.readFile("replay.tracker.events");
			const events = [...decodeReplayTrackerEvents(bytes, protocol)];
			expect(events.length).toBeGreaterThan(0);
		});

		test("first event has required fields", () => {
			const bytes = mpq.readFile("replay.tracker.events");
			const events = [...decodeReplayTrackerEvents(bytes, protocol)];
			expect(events[0]._event).toBeDefined();
			expect(events[0]._gameloop).toBeDefined();
		});

		test("first event is SPlayerSetupEvent", () => {
			const bytes = mpq.readFile("replay.tracker.events");
			const events = [...decodeReplayTrackerEvents(bytes, protocol)];
			expect(events[0]._event).toBe(
				"NNet.Replay.Tracker.SPlayerSetupEvent",
			);
		});
	});
    //TODO replay header might be stored in user data header instead
	describe("decodeReplayHeader", () => {
		test("returns build number", () => {
			const bytes = mpq.UserDataHeader.user_data_content;
			const header = decodeReplayHeader(bytes, protocol);
			expect(header.m_version.m_baseBuild).toBeDefined();
            console.log(JSON.stringify(header,null,2));
		});
	});

	describe("decodeReplayGameEvents", () => {
		test("yields events", () => {
			const bytes = mpq.readFile("replay.game.events");
			const events = [...decodeReplayGameEvents(bytes, protocol)];
			expect(events.length).toBeGreaterThan(0);
		});

		test("events have gameloop and userid", () => {
			const bytes = mpq.readFile("replay.game.events");
			const events = [...decodeReplayGameEvents(bytes, protocol)];
			expect(events[0]._gameloop).toBeDefined();
			expect(events[0]._userid).toBeDefined();
		});
	});

	describe("decodeReplayMessageEvents", () => {
		test("yields events", () => {
			const bytes = mpq.readFile("replay.message.events");
			const events = [...decodeReplayMessageEvents(bytes, protocol)];
			expect(Array.isArray(events)).toBe(true);
		});
	});

	describe("decodeReplayInitData", () => {
		test("returns init data", () => {
			const bytes = mpq.readFile("replay.initData");
			const initData = decodeReplayInitData(bytes, protocol);
			expect(initData).toBeDefined();
		});
	});

	describe("decodeReplayAttributesEvents", () => {
		test("returns attributes object", () => {
			const bytes = mpq.readFile("replay.attributes.events");
			const attributes = decodeReplayAttributesEvents(bytes);
			expect(attributes).toBeDefined();
			expect(attributes.scopes).toBeDefined();
            console.log(Object.keys(attributes.scopes));
            expect(attributes.scopes["16"][AttributeCodes.GAME_SPEED][0].value.toString("utf-8")).toBe("Fasr");
            
		});
	});

})