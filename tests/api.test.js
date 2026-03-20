import { expect, test, describe } from 'vitest'
import { SC2Replay } from '../src/api/SC2Replay'




describe("Replay loads Basic Info", () => {
    const replay = new SC2Replay("tests/fixtures/testreplay.SC2Replay");
    const teamReplay = new SC2Replay("tests/fixtures/teamgametestreplay.SC2Replay");
    const info = replay.getBasicInfo();
    const teamInfo = teamReplay.getBasicInfo();
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
    test("AI game is true", () => {
        expect(info.isAIGame).toBe(true)
    })
    test("Gamemode correct for both team and 1v1", () => {
        expect(info.gamemode.gamemode).toBe("Priv");
        expect(info.gamemode.teamFormat).toBe("1v1");
        expect(teamInfo.gamemode.teamFormat).toBe("4v4");
    })
    test("", () => {
        
    })
    test("", () => {
        
    })
});