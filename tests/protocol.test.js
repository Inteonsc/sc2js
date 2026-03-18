import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { getAvailableBuilds, findNearestBuild, loadProtocol } from "../src/reader/protocolLoader";  
    const protocol = JSON.parse(
        readFileSync("./vendor/s2protocol/json/protocol95299.json", "utf8"),
    );

    const tracker = protocol.modules[0].decls
        .find((d) => d.fullname === "NNet.Replay")
        .decls.find((d) => d.fullname === "NNet.Replay.Tracker");

    describe("protocol definitions", () => {
        test("loads successfully", () => {
            expect(protocol.modules).toBeDefined();
        });

        test("has tracker events", () => {
            expect(tracker).toBeDefined();
            expect(tracker.decls.length).toBe(15);
        });

        test("SUnitBornEvent has expected fields", () => {
            const unitBorn = tracker.decls.find((d) => d.name === "SUnitBornEvent");
            const fields = unitBorn.type_info.fields.filter(
                (f) => f.type === "MemberStructField",
            );

            const tags = Object.fromEntries(
                fields.map((f) => [f.tag.value, f.name]),
            );

            expect(tags["0"]).toBe("m_unitTagIndex");
            expect(tags["2"]).toBe("m_unitTypeName");
            expect(tags["3"]).toBe("m_controlPlayerId");
            expect(tags["5"]).toBe("m_x");
            expect(tags["6"]).toBe("m_y");
        });
    });

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
