import { performance } from "perf_hooks";
import { SC2Replay } from "../src/api/SC2Replay.js";
import { writeFileSync } from "fs";
const start = performance.now();
const replayinfo = [];
for (let i = 0; i < 3000; i++) {
	const replay = new SC2Replay("tests/fixtures/testreplay.SC2Replay");
	replayinfo.push(replay.getBasicInfo());
}
const end = performance.now();
console.log(process.memoryUsage());
console.log(`3000 replays in ${end - start}ms`);
console.log(`Average: ${(end - start) / 3000}ms per replay`);

//deepscan test

const newReplay = new SC2Replay("tests/fixtures/testreplay.SC2Replay");

// benchmark tracker events
let t = performance.now();
const trackerEvents = [...newReplay.getTrackerEvents()];
console.log(`Tracker events: ${trackerEvents.length} events in ${performance.now() - t}ms`);

// benchmark game events
t = performance.now();
const gameEvents = [...newReplay.getGameEvents()];
console.log(`Game events: ${gameEvents.length} events in ${performance.now() - t}ms`);

// benchmark message events
t = performance.now();
const messageEvents = [...newReplay.getMessageEvents()];
console.log(`Message events: ${messageEvents.length} events in ${performance.now() - t}ms`);

// memory after loading everything
console.log("Memory:", process.memoryUsage().heapUsed / 1024 / 1024, "MB heap used");

writeFileSync(
	"./util/tracker-events.json",
	JSON.stringify(
		[...newReplay.getTrackerEvents()],
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);

writeFileSync(
	"./util/game-events.json",
	JSON.stringify(
		[...newReplay.getGameEvents()],
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);

writeFileSync(
	"./util/message-events.json",
	JSON.stringify(
		[...newReplay.getMessageEvents()],
		(key, value) => (typeof value === "bigint" ? value.toString() : value),
		2
	)
);

console.log("Written to tracker-events.json, game-events.json, message-events.json");
