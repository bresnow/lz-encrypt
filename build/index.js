import { lzObject } from 'lz-object';
import lzString from 'lz-string';
import { checkIfThis } from './check.js';
import pair from './pair.js';
import Gun from 'gun';
export async function encrypt(object, encryptionkey, compressionOptions) {
    const compressionType = compressionOptions?.encoding ?? 'utf16';
    let compress;
    if (typeof object === 'string') {
        const encrypted = await Gun.SEA.encrypt(object, encryptionkey);
        switch (compressionType) {
            case 'utf16':
                compress = lzString.compressToUTF16;
                break;
            // case 'uint8array':
            //   compress = lzString.compressToUint8Array
            //   break
            case 'base64':
                compress = lzString.compressToBase64;
                break;
            case 'uri':
                compress = lzString.compressToEncodedURIComponent;
                break;
            default:
                new Error('Unknown compression type');
                compress = lzString.compressToUTF16;
                break;
        }
        const compressed = compress(encrypted);
        return compressed;
    }
    let obj = {};
    if (object && checkIfThis.isObject(object)) {
        const entries = Object.entries(object);
        for (let i = 0; i < entries.length; i += 1) {
            const [objectKey, objectValue] = entries[i];
            if ((encryptionkey && checkIfThis.isString(objectValue)) ||
                checkIfThis.isBoolean(objectValue) ||
                checkIfThis.isNumber(objectValue)) {
                try {
                    const encrypted = await Gun.SEA.encrypt(objectValue, encryptionkey);
                    Object.assign(obj, { [objectKey]: encrypted });
                }
                catch (error) {
                    throw new Error(error);
                }
            }
            if (encryptionkey && checkIfThis.isObject(objectValue)) {
                await encrypt(objectValue, encryptionkey);
            }
        }
        // console.log(JSON.stringify(lzObject.compress(obj, { output: 'uint8array'}), null, 2))
        obj = lzObject.compress(obj, { output: compressionOptions?.encoding ?? 'utf16' });
        return obj;
    }
}
export async function decrypt(object, encryptionkey, compressionOptions) {
    if (!object) {
        new Error('cannot decrypt and decompress object as it is undefined');
        // throw new Error('cannot decrypt and decompress object as it is undefined');
    }
    const decompressionType = compressionOptions?.encoding ?? 'utf16';
    if (typeof object === 'string') {
        let decomp;
        let decrypted;
        switch (decompressionType) {
            case 'utf16':
                decomp = lzString.decompressFromUTF16(object);
                decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey);
                break;
            // case 'uint8array':
            //   decomp = lzString.decompressFromUint8Array(object)  as any as string
            //   decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey)
            case 'base64':
                decomp = lzString.decompressFromBase64(object);
                decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey);
                break;
            case 'uri':
                decomp = lzString.decompressFromEncodedURIComponent(object);
                decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey);
                break;
            default:
                new Error('Unknown compression type');
                decomp = lzString.decompressFromUTF16(object);
                decrypted = decomp && Gun.SEA.decrypt(decomp, encryptionkey);
                break;
        }
        return decrypted;
    }
    object = lzObject.decompress(object, { output: compressionOptions?.encoding ?? 'utf16' });
    const obj = {};
    if (checkIfThis.isObject(object)) {
        const entries = Object.entries(object);
        for (let i = 0; i < entries.length; i += 1) {
            const [objectKey, objectValue] = entries[i];
            if (encryptionkey && checkIfThis.isString(objectValue)) {
                const decrypted = await Gun.SEA.decrypt(objectValue, encryptionkey);
                Object.assign(obj, { [objectKey]: decrypted });
            }
            if (encryptionkey && checkIfThis.isObject(objectValue)) {
                await decrypt(objectValue, encryptionkey);
            }
        }
    }
    return obj;
}
export { pair };
// const test = { test: 'njsanj1', test1: 'ajbsdkjasbda2', test11: 'dkjasbdksj3', test111: 'sadahsbdkshda', testyyyy: 'TESTERRRRR' },
//   enc = { epriv: 'khjksbkdjbsajkbdljkasblfsbdajkfbsdkjfbasdklfbasljdbfskdjb' }
// console.info(`encrypting test object`)
// let encrypted = await encrypt(test, enc)
// info(JSON.stringify(encrypted, null, 2))
// console.info(`decrypting test object`)
// let decrypted = await decrypt(encrypted, enc)
// info(JSON.stringify(decrypted, null, 2))
