import { expect, test, describe } from 'vitest'
import { SC2Replay } from '../src/api/SC2Replay'


const replay = new SC2Replay("tests/fixtures/testreplay.SC2Replay")

describe("Replay loads Basic Info", () => {
    test("Map name is correct", () =>{
        const info = replay.getBasicInfo();
        expect(info.map).toBe("10000 Feet LE")
    });
});