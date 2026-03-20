import { expect, test, describe } from 'vitest'
import { SC2Replay } from '../src/api/SC2Replay'




describe("Replay loads Basic Info", () => {
    const replay = new SC2Replay("tests/fixtures/testreplay.SC2Replay")
    const info = replay.getBasicInfo();
    test("Map name is correct", () =>{
        expect(info.map).toBe("10000 Feet LE")
    });
    test("Player's are correct", () => {
        expect(info.players[0].name).toBe("Lilipadd");
        expect(info.players[0].details.m_race.toString("utf-8")).toBe("Zerg");
        expect(info.players[0].clan).toBe("VFish");
        
    });
    test("Duration is Correct", () => {
        expect(info.duration).toBe(261);
    });
    test("Version is correct", () => {
        expect(info.version).toContain("5.0.15");
    })
    test("Winner is correct", () => {
        expect(info.winner).toBe(0);
    })
    test("", () => {
        
    })
    test("", () => {
        
    })
    test("", () => {
        
    })
    test("", () => {
        
    })
});