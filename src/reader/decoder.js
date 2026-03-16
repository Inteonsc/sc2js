export class BitPackedBuffer{
    constructor(contents, Endian = "big") {
        this.data = contents ?? Buffer.alloc(0);
        this.bytesRead = 0;
        this.nextByte = null;
        this.nextBitsLeft = 0;
        this.bigEndian = Endian === "big";
    }

    finished() {
        return this.bytesRead >= this.data.length && this.nextBitsLeft === 0;
    }

    usedBits() {
        return this.bytesRead * 8 - this.nextBitsLeft;
    }
    
    byteAlign() {
        this.nextBitsLeft = 0;
    }

    readAlignedBytes(numBytes) {
        this.byteAlign();
        const result = Buffer.from(this.data.subarray(this.bytesRead, this.bytesRead + numBytes));
        this.bytesRead += numBytes;
        if(result.length < numBytes) {
            throw new Error('Attempted to read past end of buffer');
        }
        return result;
    }
    //TODO add support for 64 bit reads if needed. only supports 32 bit integers at the moment
    readBits(numBits) {
            let result = 0;
            let bitsRead = 0;
            while(bitsRead < numBits) {
                if(this.nextBitsLeft === 0) {
                    if(this.finished()) {
                        throw new Error('Attempted to read past end of buffer');
                    }
                    this.nextByte = this.data[this.bytesRead];
                    this.bytesRead++;
                    this.nextBitsLeft = 8;
                }
                const bitsToRead = Math.min(numBits - bitsRead, this.nextBitsLeft);
                const copy = (this.nextByte & ((1 << bitsToRead) - 1));
                if(this.bigEndian) {
                    result |= copy << (numBits - bitsRead - bitsToRead);
                }else{
                    result |= copy << bitsRead
                }
                this.nextByte >>= bitsToRead;
                this.nextBitsLeft -= bitsToRead;
                bitsRead += bitsToRead;

            }
            return result;
    }

    readUnalignedBytes(numBytes) {
        const result = Buffer.allocUnsafe(numBytes);
        for(let i = 0; i < numBytes; i++) {
            result[i] = this.readBits(8);
        }
        return result;

    }



}

export class BitPackedDecoder {

}

export class VersionedDecoder {

}