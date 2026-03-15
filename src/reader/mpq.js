/**
 * MPQ Archive Reader
 * 
 * Based on mpyq by Aku Kotkavuo
 * Copyright (c) 2010-2019 Aku Kotkavuo. All rights reserved.
 * https://github.com/eagleflo/mpyq
 * 
 * References:
 * http://www.zezula.net/en/mpq/mpqformat.html
 * https://web.archive.org/web/20120222093346/http://wiki.devklog.net/index.php?title=The_MoPaQ_Archive_Format
 * 
 * ─────────────────────────────────────────
 * MPQ File Structure
 * ─────────────────────────────────────────
 * magic number (4 bytes)
 * user data header (optional, only if magic is MPQ\x1b)
 * header
 * hash table
 * block table
 * file data
 * 
 * Magic Number
 *   MPQ\x1a = standard header at offset 0
 *   MPQ\x1b = user data header precedes the actual header
 * 
 * User Data Header (MPQ\x1b only)
 *   user_data_size      (4 bytes) - total allocated space for user data
 *   mpq_header_offset   (4 bytes) - offset to the real MPQ header
 *   user_data_header_size (4 bytes) - size of the user data content
 *   user data content   (user_data_header_size bytes)
 *   For SC2 replays, this content contains the replay header.
 * 
 * Header
 *   Contains the offset and entry count of both the hash and block tables,
 *   the format version, and the sector size shift.
 * 
 * Hash Table
 *   Used to look up files by name. Each entry contains hash_a, hash_b,
 *   locale/platform, and a block table index. Files are found by hashing
 *   the filename twice and scanning for a matching entry.
 * 
 * Block Table
 *   Contains the offset, compressed size, real size, and flags for each
 *   file. Flags indicate whether a file is compressed, encrypted, or
 *   stored as a single unit vs multiple sectors.
 * 
 * File Data
 *   Raw file contents. Location and size of each file is found via the
 *   hash and block tables.
 * 
 * ─────────────────────────────────────────
 * Encryption
 * ─────────────────────────────────────────
 * All MPQ archives share the same encryption table — 1280 pseudo-random
 * 32-bit integers generated from a fixed seed, arranged in 5 groups of 256.
 * 
 *   Groups 0-3   used by the hash function for filename lookup and
 *                generating decryption keys for the tables
 *   Group 4      used in the stream cipher when decrypting the tables
 * 
 * The hash and block tables are encrypted using a stream cipher based on
 * XOR. The decryption key for each table is derived by hashing the string
 * "(hash table)" or "(block table)" — these are fixed strings baked into
 * the MPQ format spec by Blizzard.
 */

import { readFileSync } from 'fs'

//consts
const ENCRYPTION_TABLE_SEED = 0x00100001;
const HASH_SEED_1 = 0x7fed7fed;
const SEED_2 = 0xeeeeeeee; //used for hash and decryption
const MAGIC_A = 'MPQ\x1a';
const MAGIC_B = 'MPQ\x1b';

//bitflags for block table entries
const MPQ_FILE_IMPLODE = 0x00000100;
const MPQ_FILE_COMPRESS = 0x00000200;
const MPQ_FILE_ENCRYPTED = 0x00010000;
const MPQ_FILE_FIX_KEY = 0x00020000;
const MPQ_FILE_SINGLE_UNIT = 0x01000000;
const MPQ_FILE_DELETE_MARKER = 0x02000000;
const MPQ_FILE_SECTOR_CRC = 0x04000000;
const MPQ_FILE_EXISTS = 0x80000000;

const HashType = {
    TABLE_OFFSET: 0,
    HASH_A: 1,
    HASH_B: 2,
    TABLE: 3
}
export class MPQArchive {
	constructor(filename, listfiles) {
		this.filename = filename;
		this.file = readFileSync(filename);
		this.encryptionTable = this.prepareEncryptionTable();
		this.header = this.readHeader();



	}

	readHeader() {
		let magic = this.file.subarray(0, 4).toString('ascii');
		if (magic === MAGIC_A) {
			this.headerOffset = 0;
			return this.#readMPQHeader();
		} else if (magic === MAGIC_B) {
			this.#readUserDataHeader();
			this.headerOffset = this.UserDataHeader.mpq_header_offset;
			return this.#readMPQHeader();
		} else {
			throw new Error("Invalid MPQ file: unrecognized magic number");
		}
	}

	readTable(table_type) {
		if (table_type === "hash") {
		} else if (table_type === "block") {
		} else {
			throw new Error("Invalid table type");
		}
	}

	readFile(filename) {}

	getHashTableEntry(filename) {}

	extract() {}

	prepareEncryptionTable() {
		let encryptionTable = {};
		let seed = ENCRYPTION_TABLE_SEED;
		for (let i = 0; i < 256; i++) {
			let index = i;
			for (let j = 0; j < 5; j++) {
				seed = (seed * 125 + 3) % 0x2aaaab;
				let temp1 = (seed & 0xffff) << 16;
                seed = (seed * 125 + 3) % 0x2aaaab;
                let temp2 = (seed & 0xffff);
                encryptionTable[index] = (temp1 | temp2) >>> 0; //unsigned right shift to convert to uint32
                index += 256;
			}
		}
        return encryptionTable;
	}
	#hash(hashString, hashType) {
		hashString = hashString.toUpperCase();
		let seed1 = HASH_SEED_1;
		let seed2 = SEED_2;
		for(const char of hashString){
			const charCode = char.charCodeAt(0);
			const value = this.encryptionTable[(hashType << 8) + charCode];
			seed1 = (value ^ (seed1 + seed2)) >>> 0;
			seed2 = (charCode + seed1 + seed2 + (seed2 << 5) + 3) >>> 0;
		}
		return seed1;
	}

	#decrypt(data, key) {}

	#readMPQHeader() {
		return {
			magic: this.file.subarray(this.headerOffset, this.headerOffset + 4).toString('ascii'),
			header_size: this.file.readUInt32LE(this.headerOffset + 4),
			archive_size: this.file.readUInt32LE(this.headerOffset + 8),
			format_version: this.file.readUInt16LE(this.headerOffset + 12),
			sector_size_shift: this.file.readUInt16LE(this.headerOffset + 14),
			hash_table_offset: this.file.readUInt32LE(this.headerOffset + 16),
			block_table_offset: this.file.readUInt32LE(this.headerOffset + 20),
			hash_table_entries: this.file.readUInt32LE(this.headerOffset + 24),
			block_table_entries: this.file.readUInt32LE(this.headerOffset + 28)
		}
	}

	#readUserDataHeader() {
		this.UserDataHeader = {
			user_data_size: this.file.readUInt32LE(4),
			mpq_header_offset: this.file.readUInt32LE(8),
			user_data_header_size: this.file.readUInt32LE(12),
			user_data_content: this.file.subarray(16, 16 + this.file.readUInt32LE(12))
		}
	}
}
