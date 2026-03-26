import { writeFileSync } from 'fs';
import { SC2Replay } from '../src/api/SC2Replay.js';
import { MPQArchive } from '../src/reader/mpq.js';

const replay = new SC2Replay('tests/fixtures/testreplay.SC2Replay');
Error.stackTraceLimit = 1000;
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

writeFileSync('./util/reference.json', JSON.stringify(reference, (key, value) => 
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

writeFileSync('./util/teamreference.json', JSON.stringify(teamreference, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
/** 
const noMetadataRef = new SC2Replay("tests/fixtures/NoMetadata.SC2Replay", true);
const noMetaRef = {
    listfiles: noMetadataRef.getListFiles(),
    header: noMetadataRef.getHeader(),
    details: noMetadataRef.getDetails(),
    initData: noMetadataRef.getInitData(),
    metadata: noMetadataRef.getMetadata(),
    attributes: noMetadataRef.getAttributeEvents(),
    //firstTrackerEvent: [...noMetadataRef.getTrackerEvents()][0],
    //firstGameEvent: [...noMetadataRef.getGameEvents()][0],
    //firstMessageEvent: [...noMetadataRef.getMessageEvents()][0],
};

writeFileSync('./util/NoMetadataReference.json', JSON.stringify(noMetaRef, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));

const noMetadataRef2 = new SC2Replay("tests/fixtures/NoMetadata2.SC2Replay");
const noMetaRef2 = {
    listfiles: noMetadataRef2.getListFiles(),
    header: noMetadataRef2.getHeader(),
    details: noMetadataRef2.getDetails(),
    initData: noMetadataRef2.getInitData(),
    metadata: noMetadataRef2.getMetadata(),
    attributes: noMetadataRef2.getAttributeEvents(),
    //firstTrackerEvent: [...noMetadataRef2.getTrackerEvents()][0],
    //firstGameEvent: [...noMetadataRef2.getGameEvents()][0],
    //firstMessageEvent: [...noMetadataRef2.getMessageEvents()][0],
};

writeFileSync('./util/NoMetadataReference2.json', JSON.stringify(noMetaRef2, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));

const campaignRefReplay = new SC2Replay("tests/fixtures/OldCampaignReplay.SC2Replay");
const campaignRef = {
    listfiles: campaignRefReplay.getListFiles(),
    header: campaignRefReplay.getHeader(),
    details: campaignRefReplay.getDetails(),
    initData: campaignRefReplay.getInitData(),
    metadata: campaignRefReplay.getMetadata(),
    attributes: campaignRefReplay.getAttributeEvents(),
    //firstTrackerEvent: [...campaignRefReplay.getTrackerEvents()][0],
    //firstGameEvent: [...campaignRefReplay.getGameEvents()][0],
    //firstMessageEvent: [...campaignRefReplay.getMessageEvents()][0],
};

writeFileSync('./util/OldCampaignReplayReference.json', JSON.stringify(campaignRef, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
*/
const noGameSpeedRef = new SC2Replay("tests/fixtures/NoGameSpeedReplay.SC2Replay");
const gameSpeedRef = {
    listfiles: noGameSpeedRef.getListFiles(),
    header: noGameSpeedRef.getHeader(),
    details: noGameSpeedRef.getDetails(),
    initData: noGameSpeedRef.getInitData(),
    metadata: noGameSpeedRef.getMetadata(),
    attributes: noGameSpeedRef.getAttributeEvents(),
    //  firstTrackerEvent: [...noGameSpeedRef.getTrackerEvents()][0],
    //firstGameEvent: [...noGameSpeedRef.getGameEvents()][0],
    //firstMessageEvent: [...noGameSpeedRef.getMessageEvents()][0],
};

writeFileSync('./util/noGameSpeedReference.json', JSON.stringify(gameSpeedRef, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value, 2));
