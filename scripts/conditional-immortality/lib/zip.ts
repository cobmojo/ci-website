import { inflateRawSync } from 'node:zlib'

/**
 * Minimal ZIP reader.
 *
 * A DOCX is a ZIP container. Rather than take a dependency for this, the
 * central directory is read directly. Only stored (method 0) and deflated
 * (method 8) entries occur in a DOCX, and both are handled.
 */

const END_OF_CENTRAL_DIRECTORY = 0x06054b50
const CENTRAL_FILE_HEADER = 0x02014b50

export interface ZipEntry {
  readonly name: string
  readonly data: Buffer
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  // The record is at most 22 bytes plus a comment of up to 65535 bytes.
  const start = Math.max(0, buffer.length - 22 - 0xffff)
  for (let i = buffer.length - 22; i >= start; i -= 1) {
    if (buffer.readUInt32LE(i) === END_OF_CENTRAL_DIRECTORY) return i
  }
  throw new Error('Not a ZIP archive: end of central directory record not found.')
}

export function readZip(buffer: Buffer): Map<string, Buffer> {
  const eocd = findEndOfCentralDirectory(buffer)
  const entryCount = buffer.readUInt16LE(eocd + 10)
  let offset = buffer.readUInt32LE(eocd + 16)

  const entries = new Map<string, Buffer>()

  for (let i = 0; i < entryCount; i += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_FILE_HEADER) {
      throw new Error(`Corrupt central directory at entry ${i}.`)
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localHeaderOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength)

    // Local header: name and extra field lengths differ from the central copy.
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26)
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28)
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength
    const raw = buffer.subarray(dataStart, dataStart + compressedSize)

    if (compressionMethod === 0) {
      entries.set(name, Buffer.from(raw))
    } else if (compressionMethod === 8) {
      entries.set(name, inflateRawSync(raw))
    } else {
      throw new Error(`Unsupported compression method ${compressionMethod} for ${name}.`)
    }

    offset += 46 + nameLength + extraLength + commentLength
  }

  return entries
}
