import { writeFileSync } from "fs";
import { SC2Replay } from "../src/api/SC2Replay.js";

const replay = new SC2Replay("tests/fixtures/testreplay.SC2Replay");

const reference = {
	header: replay.getHeader(),
	details: replay.getDetails(),
	initData: replay.getInitData(),
	metadata: replay.getMetadata(),
	attributes: replay.getAttributeEvents(),
	firstTrackerEvent: [...replay.getTrackerEvents()][0] ?? null,
	firstGameEvent: [...replay.getGameEvents()][0] ?? null,
	firstMessageEvent: [...replay.getMessageEvents()][0] ?? null,
};

writeFileSync(
	"./util/reference.json",
	JSON.stringify(
		reference,
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);

const teamreplay = new SC2Replay("tests/fixtures/teamgametestreplay.SC2Replay");

const teamreference = {
	header: teamreplay.getHeader(),
	details: teamreplay.getDetails(),
	initData: teamreplay.getInitData(),
	metadata: teamreplay.getMetadata(),
	attributes: teamreplay.getAttributeEvents(),
	firstTrackerEvent: [...teamreplay.getTrackerEvents()][0] ?? null,
	firstGameEvent: [...teamreplay.getGameEvents()][0] ?? null,
	firstMessageEvent: [...teamreplay.getMessageEvents()][0] ?? null,
};

writeFileSync(
	"./util/teamreference.json",
	JSON.stringify(
		teamreference,
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);
console.log("nometa1");
const noMetadataRef = new SC2Replay("tests/fixtures/NoMetadata.SC2Replay", true);
const noMetaRef = {
	listfiles: noMetadataRef.getListFiles(),
	header: noMetadataRef.getHeader(),
	details: noMetadataRef.getDetails(),
	initData: noMetadataRef.getInitData(),
	metadata: noMetadataRef.getMetadata(),
	attributes: noMetadataRef.getAttributeEvents(),
	firstTrackerEvent: [...noMetadataRef.getTrackerEvents()][0] ?? null,
	firstGameEvent: [...noMetadataRef.getGameEvents()][0] ?? null,
	firstMessageEvent: [...noMetadataRef.getMessageEvents()][0] ?? null,
};

writeFileSync(
	"./util/NoMetadataReference.json",
	JSON.stringify(
		noMetaRef,
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);
console.log("nometa2");
const noMetadataRef2 = new SC2Replay("tests/fixtures/NoMetadata2.SC2Replay");
const noMetaRef2 = {
	listfiles: noMetadataRef2.getListFiles(),
	header: noMetadataRef2.getHeader(),
	details: noMetadataRef2.getDetails(),
	initData: noMetadataRef2.getInitData(),
	metadata: noMetadataRef2.getMetadata(),
	attributes: noMetadataRef2.getAttributeEvents(),
	firstTrackerEvent: [...noMetadataRef2.getTrackerEvents()][0] ?? null,
	firstGameEvent: [...noMetadataRef2.getGameEvents()][0] ?? null,
	firstMessageEvent: [...noMetadataRef2.getMessageEvents()][0] ?? null,
};

writeFileSync(
	"./util/NoMetadataReference2.json",
	JSON.stringify(
		noMetaRef2,
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);
console.log("campaign");
const campaignRefReplay = new SC2Replay("tests/fixtures/OldCampaignReplay.SC2Replay");
const campaignRef = {
	listfiles: campaignRefReplay.getListFiles(),
	header: campaignRefReplay.getHeader(),
	details: campaignRefReplay.getDetails(),
	initData: campaignRefReplay.getInitData(),
	metadata: campaignRefReplay.getMetadata(),
	attributes: campaignRefReplay.getAttributeEvents(),
	firstTrackerEvent: [...campaignRefReplay.getTrackerEvents()][0] ?? null,
	firstGameEvent: [...campaignRefReplay.getGameEvents()][0] ?? null,
	firstMessageEvent: [...campaignRefReplay.getMessageEvents()][0] ?? null,
};

writeFileSync(
	"./util/OldCampaignReplayReference.json",
	JSON.stringify(
		campaignRef,
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);
console.log("nogamespeed");
const noGameSpeedRef = new SC2Replay("tests/fixtures/NoGameSpeedReplay.SC2Replay");
const gameSpeedRef = {
	listfiles: noGameSpeedRef.getListFiles(),
	header: noGameSpeedRef.getHeader(),
	details: noGameSpeedRef.getDetails(),
	initData: noGameSpeedRef.getInitData(),
	metadata: noGameSpeedRef.getMetadata(),
	attributes: noGameSpeedRef.getAttributeEvents(),
	firstTrackerEvent: [...noGameSpeedRef.getTrackerEvents()][0] ?? null,
	firstGameEvent: [...noGameSpeedRef.getGameEvents()][0] ?? null,
	firstMessageEvent: [...noGameSpeedRef.getMessageEvents()][0] ?? null,
};

writeFileSync(
	"./util/noGameSpeedReference.json",
	JSON.stringify(
		gameSpeedRef,
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);
