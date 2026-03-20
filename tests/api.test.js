import { expect, test, describe } from 'vitest'
import { SC2Replay } from '../src/api/SC2Replay'




describe("Replay loads Basic Info", () => {
    const replay = new SC2Replay("tests/fixtures/testreplay.SC2Replay")
    const info = replay.getBasicInfo();
    test("Map name is correct", () =>{
        expect(info.map).toBe("10000 Feet LE")
    });
    test("Player's are correct", () => {
        expect(info.players[0].m_name.toString("utf-8")).toBe("Lilipadd");
        expect(info.players[0].m_race.toString("utf-8")).toBe("Zerg");
        
    });
});