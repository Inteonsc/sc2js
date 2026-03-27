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

import { readFileSync } from "fs";
import zlib from "zlib";
import compressjs from "compressjs";

//consts
const ENCRYPTION_TABLE_SEED = 0x00100001;
const HASH_SEED_1 = 0x7fed7fed;
const SEED_2 = 0xeeeeeeee; //used for hash and decryption
const MAGIC_A = "MPQ\x1a";
const MAGIC_B = "MPQ\x1b";

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
	TABLE: 3,
};
export class MPQArchive {
	constructor(replayFileName, listFiles) {
		this.filename = replayFileName;
		this.file = readFileSync(replayFileName);
		this.encryptionTable = this.prepareEncryptionTable();
		this.header = this.readHeader();
		this.hashTable = this.readHashTable();
		this.blockTable = this.readBlockTable();
		if (listFiles ?? false) {
			this.files = this.readFile("(listfile)").toString("utf-8");
		}
	}

	readHeader() {
		let magic = this.file.subarray(0, 4).toString("ascii");
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

	readHashTable() {
		let tableOffset = this.header.hash_table_offset + this.headerOffset;
		let tableEntries = this.header.hash_table_entries;
		let key = this.#hash("(hash table)", HashType.TABLE);
		let encryptedData = this.file.subarray(tableOffset, tableOffset + tableEntries * 16);
		let decryptedData = this.#decrypt(encryptedData, key);
		let hashTable = [];
		for (let i = 0; i < tableEntries; i++) {
			hashTable.push({
				hash_a: decryptedData.readUInt32LE(i * 16),
				hash_b: decryptedData.readUInt32LE(i * 16 + 4),
				locale: decryptedData.readUInt16LE(i * 16 + 8),
				platform: decryptedData.readUInt16LE(i * 16 + 10),
				block_table_index: decryptedData.readUInt16LE(i * 16 + 12),
			});
		}
		return hashTable;
	}

	readBlockTable() {
		let tableOffset = this.header.block_table_offset + this.headerOffset;
		let tableEntries = this.header.block_table_entries;
		let key = this.#hash("(block table)", HashType.TABLE);
		let encryptedData = this.file.subarray(tableOffset, tableOffset + tableEntries * 16);
		let decryptedData = this.#decrypt(encryptedData, key);
		let blockTable = [];
		for (let i = 0; i < tableEntries; i++) {
			blockTable.push({
				offset: decryptedData.readUInt32LE(i * 16),
				compressed_size: decryptedData.readUInt32LE(i * 16 + 4),
				real_size: decryptedData.readUInt32LE(i * 16 + 8),
				flags: decryptedData.readUInt32LE(i * 16 + 12),
			});
		}
		return blockTable;
	}

	getHashTableEntry(filename) {
		let hash_a = this.#hash(filename, HashType.HASH_A);
		let hash_b = this.#hash(filename, HashType.HASH_B);
		for (let entry of this.hashTable) {
			if (entry.hash_a === hash_a && entry.hash_b === hash_b) {
				return entry;
			}
		}
		throw new Error(`File not found in MPQ: ${filename}`);
	}

	readFile(filename) {
		let hashEntry = this.getHashTableEntry(filename);
		let blockEntry = this.blockTable[hashEntry.block_table_index];

		if ((blockEntry.flags & MPQ_FILE_EXISTS) !== 0) {
			//read the file
			if ((blockEntry.flags & MPQ_FILE_DELETE_MARKER) !== 0) {
				throw new Error(`File Deleted: ${filename}`);
			}
			if ((blockEntry.flags & MPQ_FILE_ENCRYPTED) !== 0) {
				throw new Error(`File is encrypted and cannot be read: ${filename}`);
			}
			// read the block
			if (blockEntry.compressed_size === 0) {
				{
					return Buffer.alloc(0);
				}
			}
			let actualOffset = blockEntry.offset + this.headerOffset;
			let fileData = this.file.subarray(
				actualOffset,
				actualOffset + blockEntry.compressed_size
			);

			if ((blockEntry.flags & MPQ_FILE_SINGLE_UNIT) !== 0) {
				if ((blockEntry.flags & MPQ_FILE_COMPRESS) !== 0) {
					// Single unit files only need to be decompressed, but
					// Compression only happens when at least one byte is gained.
					if (blockEntry.real_size > blockEntry.compressed_size) {
						fileData = this.#decompress(fileData);
					}
				}
			} else {
				//multi unit files are divided into sectors, each of which may be compressed.
				//first sector tells us the offsets of each sector.

				let sectorSize = 512 << this.header.sector_size_shift;
				let sectors = Math.floor(blockEntry.real_size / sectorSize) + 1;
				const sectorOffsets = [];
				//If the CRC flag is set then sector 2 is the CRC checksums. We ignore this.
				let crc = false;
				if ((blockEntry.flags & MPQ_FILE_SECTOR_CRC) !== 0) {
					crc = true;
				}
				//start of the block shows where the sectors are offset to.
				for (let i = 0; i < sectors + 1; i++) {
					sectorOffsets.push(fileData.readUInt32LE(i * 4));
				}

				let sectorBytesLeft = blockEntry.real_size;
				let result = [];
				for (let i = 0; i < sectorOffsets.length - (crc ? 2 : 1); i++) {
					let sector = fileData.subarray(sectorOffsets[i], sectorOffsets[i + 1]);
					const expectedSize = Math.min(sectorSize, sectorBytesLeft);
					if (
						(blockEntry.flags & MPQ_FILE_COMPRESS) !== 0 &&
						sector.length < expectedSize
					) {
						sector = this.#decompress(sector);
					}
					result.push(sector);
					sectorBytesLeft -= sector.length;
				}
				fileData = Buffer.concat(result);
			}

			return fileData;
		} else {
			throw new Error(
				`File is flagged as not existing, data is probably corrupted: ${filename}`
			);
		}
	}

	extract() {
		if (!this.files) throw new Error("cannot extract without Listfile");
		if (this.files === "") throw new Error("Listfile Empty");
		const files = this.files.split("\r\n");
		const result = {};
		for (const file of files) {
			if (file !== "") {
				result[file] = this.readFile(file);
			}
		}
		return result;
	}

	prepareEncryptionTable() {
		let encryptionTable = {};
		let seed = ENCRYPTION_TABLE_SEED;
		for (let i = 0; i < 256; i++) {
			let index = i;
			for (let j = 0; j < 5; j++) {
				seed = (seed * 125 + 3) % 0x2aaaab;
				let temp1 = (seed & 0xffff) << 16;
				seed = (seed * 125 + 3) % 0x2aaaab;
				let temp2 = seed & 0xffff;
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
		for (const char of hashString) {
			const charCode = char.charCodeAt(0);
			const value = this.encryptionTable[(hashType << 8) + charCode];
			seed1 = (value ^ (seed1 + seed2)) >>> 0;
			seed2 = (charCode + seed1 + seed2 + (seed2 << 5) + 3) >>> 0;
		}
		return seed1;
	}
	//decrypts data using the stream cipher with the given key
	//Uses >>> 0 to convert to unsigned 32 bit integers and means we dont need the 0xffffffff mask in the algorithm
	#decrypt(data, key) {
		let seed1 = key;
		let seed2 = SEED_2;
		let decrypted = Buffer.alloc(data.length);

		for (let i = 0; i < data.length / 4; i += 1) {
			seed2 = (seed2 + this.encryptionTable[0x400 + (seed1 & 0xff)]) >>> 0;
			let value = data.readUInt32LE(i * 4);
			value = (value ^ (seed1 + seed2)) >>> 0;

			seed1 = (((~seed1 << 0x15) + 0x11111111) | (seed1 >>> 0x0b)) >>> 0;
			seed2 = (value + seed2 + (seed2 << 5) + 3) >>> 0;
			decrypted.writeUInt32LE(value, i * 4);
		}
		return decrypted;
	}

	#readMPQHeader() {
		return {
			magic: this.file.subarray(this.headerOffset, this.headerOffset + 4).toString("ascii"),
			header_size: this.file.readUInt32LE(this.headerOffset + 4),
			archive_size: this.file.readUInt32LE(this.headerOffset + 8),
			format_version: this.file.readUInt16LE(this.headerOffset + 12),
			sector_size_shift: this.file.readUInt16LE(this.headerOffset + 14),
			hash_table_offset: this.file.readUInt32LE(this.headerOffset + 16),
			block_table_offset: this.file.readUInt32LE(this.headerOffset + 20),
			hash_table_entries: this.file.readUInt32LE(this.headerOffset + 24),
			block_table_entries: this.file.readUInt32LE(this.headerOffset + 28),
		};
	}

	#readUserDataHeader() {
		this.UserDataHeader = {
			user_data_size: this.file.readUInt32LE(4),
			mpq_header_offset: this.file.readUInt32LE(8),
			user_data_header_size: this.file.readUInt32LE(12),
			user_data_content: this.file.subarray(16, 16 + this.file.readUInt32LE(12)),
		};
	}
	//compressed sectors have a 1 byte header indicating the compression type, followed by the compressed data.
	//mpyq has an option to force decompression but i cant find any documentation that shows that uncompressed data can have a compression type header
	//so i presume this would result in false flags in non sc2replays (because all sc2 replays have compression)
	#decompress(data) {
		const compressionType = data[0];
		const compressedData = data.subarray(1);

		if (compressionType === 0x02) {
			//zlib compression
			return zlib.inflateSync(compressedData);
		} else if (compressionType === 0x10) {
			//bzip2 compression
			return Buffer.from(compressjs.Bzip2.decompressFile(compressedData));
		}
	}
}
