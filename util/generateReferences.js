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
console.log('Written to reference.json');