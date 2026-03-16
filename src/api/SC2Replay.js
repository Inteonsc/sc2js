import { MPQArchive } from "../reader/mpq";

export class SC2Replay {
    constructor(fileName) {
        this.fileName = fileName;
        this.mpqArchive = MPQArchive.open(fileName);
    }
}