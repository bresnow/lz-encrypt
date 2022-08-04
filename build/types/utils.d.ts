/// <reference types="node" />
import fs from 'fs-extra';
import fg from 'fast-glob';
import { cd } from 'zx';
export declare function interpretPath(...args: string[]): string;
export declare const readDirectorySync: (directory: string, allFiles?: string[]) => string[];
export declare function exists(path: string): boolean;
export declare function remove(path: string): Promise<void>;
export declare function read(path: string, encoding?: BufferEncoding): Promise<string>;
export declare namespace read {
    var sync: (...args: any) => string;
    var json: typeof jsonRead;
}
export declare function mkdir(...path: string[]): Promise<void>;
export declare function write(path: any, content: any): Promise<void>;
export declare namespace write {
    var sync: (path: any, content: string | NodeJS.ArrayBufferView) => void;
}
declare function jsonRead(path: string): Promise<any>;
declare namespace jsonRead {
    var sync: (path: string) => any;
}
export declare function glob(args: string[]): Promise<string[]>;
declare let log: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
export { cd, fs, fg, log };
