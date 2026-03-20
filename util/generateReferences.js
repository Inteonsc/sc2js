import { writeFileSync } from 'fs';
import { SC2Replay } from '../src/api/SC2Replay.js';

const replay = new SC2Replay('tests/fixtures/testreplay.SC2Replay');

const reference = {
    header: replay.getHeader(),
    details: replay.getDetails(),
    initData: replay.getInitData(),
    metadata: replay.getMetadata(),
    attributes: replay.getAttributeEvents(),
    firstTrackerEvent: [...replay.getTrackerEvents()][0],
    firstGameEvent: [...replay.getGameEvents()][0],
    firstMessageEvent: [...replay.getMessageEvents()][0],
};

writeFileSync('reference.json', JSON.stringify(reference, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));

const teamreplay = new SC2Replay('tests/fixtures/teamgametestreplay.SC2Replay');

const teamreference = {
    header: teamreplay.getHeader(),
    details: teamreplay.getDetails(),
    initData: teamreplay.getInitData(),
    metadata: teamreplay.getMetadata(),
    attributes: teamreplay.getAttributeEvents(),
    firstTrackerEvent: [...teamreplay.getTrackerEvents()][0],
    firstGameEvent: [...teamreplay.getGameEvents()][0],
    firstMessageEvent: [...teamreplay.getMessageEvents()][0],
};

writeFileSync('teamreference.json', JSON.stringify(teamreference, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
