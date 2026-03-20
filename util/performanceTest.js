import { performance } from 'perf_hooks';
import { SC2Replay } from '../src/api/SC2Replay.js';
const start = performance.now();
const replayinfo = []
for (let i = 0; i < 3000; i++) {
    const replay = new SC2Replay('tests/fixtures/testreplay.SC2Replay');
    replayinfo.push(replay.getBasicInfo());
}
const end = performance.now();
console.log(process.memoryUsage());
console.log(`3000 replays in ${end - start}ms`);
console.log(`Average: ${(end - start) / 3000}ms per replay`);