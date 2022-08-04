import { ISEAPair } from 'gun';
import pair from './pair.js';
export declare function encrypt(object: any, encryptionkey: ISEAPair | {
    epriv: string;
}, compressionOptions?: Partial<{
    compress: boolean;
    encoding: 'utf16' | 'uint8array' | 'base64' | 'uri';
}>): Promise<string | Record<string, any> | undefined>;
export declare function decrypt(object: any, encryptionkey: ISEAPair | {
    epriv: string;
}, compressionOptions?: Partial<{
    compress: boolean;
    encoding: 'utf16' | 'uint8array' | 'base64' | 'uri';
}>): Promise<any>;
export { pair };
