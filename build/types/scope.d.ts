import { IGunInstance, ISEAPair } from 'gun';
import 'gun/lib/path.js';
declare module 'gun/types' {
    interface IGunChain<TNode> extends IGunInstance {
        scope(what: string[], callback: ScopeCb | undefined, opts: {
            verbose: boolean;
            alias: string;
        }): Promise<void>;
    }
}
export declare type ScopeCb = (path?: string, event?: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir', matches?: string[]) => void;
export declare type CallBack = (...ack: any) => void;
export declare type VaultOpts = {
    keys: ISEAPair;
    encoding?: 'utf16' | 'base64' | 'uint8array' | 'uri';
};
