// MPQArchive class, can extract files from MPQ archives. Based on the MPQ format used by Blizzard games.


//read header. First 4 bytes are magic number. A = standard, B = user data first and then actual header at mpq_header_offset
//this should give us the location of the hash table and block table.



// MPQ uses hashed file names, so we need to use the hash of the file name to find it in the archive. 
// The hash is a 32-bit integer, and is calculated using a specific algorithm that Blizzard uses. 
// We can use a precomputed hash table to speed up the process of finding files in the archive.


//read hash table. the hash table is used to find files in the archive. it contains the hash of the file name.

//read block table. the block table contains the offset and size of each file in the archive. it also contains a flag that indicates if the file is compressed or not.

//both hash and block table are encrypted using a simple XOR encryption, so we need to decrypt them before we can use them.

//every MPQ file uses an encryption table with the same seed. 1280 pseudo-random 32-bit integers are generated using the seed, and stored in an array.
//these are then sorted into groups of 256. 5th group onwards is for file decrpytion, first 4 groups are used for hash and block table decryption.


//consts
const ENCRYPTION_TABLE_SEED = 0x00100001;
const HASH_SEED_1 = 0x7FED7FED;
const SEED_2 = 0xEEEEEEEE; //used for hash and decryption


//bitflags for block table entries
MPQ_FILE_IMPLODE        = 0x00000100
MPQ_FILE_COMPRESS       = 0x00000200
MPQ_FILE_ENCRYPTED      = 0x00010000
MPQ_FILE_FIX_KEY        = 0x00020000
MPQ_FILE_SINGLE_UNIT    = 0x01000000
MPQ_FILE_DELETE_MARKER  = 0x02000000
MPQ_FILE_SECTOR_CRC     = 0x04000000
MPQ_FILE_EXISTS         = 0x80000000



class MPQArchive {
    constructor(filename, ) {
    }
}