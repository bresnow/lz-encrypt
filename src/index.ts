import Gun, { GunMessagePut, IGunChain, IGunInstanceRoot, IGunUserInstance, ISEAPair } from 'gun';
import os from 'os';
import lz from './lz-encrypt.js';
import 'gun/lib/path.js';
import 'gun/lib/load.js';
import 'gun/lib/open.js';
import 'gun/lib/then.js';
import lzString from 'lz-string';
import Pair from './pair.js';
export const getCID = async (vaultname: string, keypair: ISEAPair) =>
	lzString.compressToEncodedURIComponent((await Gun.SEA.work(vaultname, keypair)) as string);
const SEA = Gun.SEA;

declare module 'gun/types' {
	interface IGunInstance<TNode> extends IGunUserInstance {
		/**
		 * Create a new vault context.
		 *
		 * Takes the lockername and generates the keys against machine info.
		 * Should require sudo privilages to create a new vault.
		 *
		 */
		vault(
			vaultname: string,
			keys: ISEAPair,
			cb?: CallBack
		): IGunUserInstance<any, any, any, IGunInstanceRoot<any, IGunInstance<any>>>;
		/**
		 * Get a locker instance for a node in the chain.
		 *
		 * @param {string}
		 */
		locker(nodepath: string | string[]): {
			value(cb: CallBack): Promise<void>;
			put(data: any, cb?: CallBack): Promise<void>;
		};
		keys(secret?: string | string[], callback?: CallBack): Promise<ISEAPair>;
	}
	interface IGunChain<TNode> extends IGunInstance {
		scope(
			what: string[],
			callback: ScopeCb | undefined,
			opts: {
				verbose: boolean;
				alias: string;
			}
		): Promise<void>;
	}
}
export declare type ScopeCb = (
	path?: string,
	event?: 'add' | 'addDir' | 'change' | 'unlink' | 'unlinkDir',
	matches?: string[]
) => void;
export declare type CallBack = (...ack: any) => void;
export declare type VaultOpts = {
	keys: ISEAPair;
	encoding?: 'utf16' | 'base64' | 'uint8array' | 'uri';
};

export async function SysUserPair(secret?: string[]) {
	let { username, platform, arch } = getImmutableMachineInfo();
	let salt = secret
		? Object.values({ username, platform, arch }).concat(...secret)
		: Object.values({ username, platform, arch });
	let keys = await Pair({ username, platform, arch }, salt);
	let workedImmutables = await Gun.SEA.work({ username, platform, arch }, keys, null, {
		name: 'SHA-256',
		salt
	});
	return { keys, username, serial: workedImmutables };
}
export function getImmutableMachineInfo() {
	let username = os.userInfo().username,
		// serial = sn.stdout.split(':')[1].trim(),
		platform = os.platform(),
		arch = os.arch();
	return { username, platform, arch };
}

Gun.chain.vault = function (vault, keys, cback) {
	let _gun = this;
	let gun = _gun.user();
	gun = gun.auth(keys, (ack: any) => {
		let err = (ack as any).err;
		if (err) {
			throw new Error(err);
		}
		let lock = gun.get(`chainlocker`);
		lock.once(async function (data: { _: any }) {
			let cID = await getCID(vault, keys);
			if (!data) {
				lock.put({ vault, vault_id: cID });
			}
			if (data) {
				let obj: { vault: any; vault_id: string }, tmp: any;
				tmp = data._;
				delete data._;
				obj = await lz.decrypt(data, keys);
				if (obj.vault && obj.vault_id !== cID) {
					//check POW hashes to make sure they match
					throw new Error(`Err authenticating ${vault}`);
				}
				cback && cback({ _: tmp, chainlocker: obj, gun: ack });
			}
		});
	});

	_gun.locker = (nodepath: string | any[]) => {
		let path: string | any[],
			temp = gun as unknown as IGunChain<any>; // gets tricky with types but doable
		if (typeof nodepath === 'string') {
			path = nodepath.split('/' || '.');
			if (1 === path.length) {
				temp = temp.get(nodepath);
			}
			nodepath = path;
		}
		if (nodepath instanceof Array) {
			if (nodepath.length > 1) {
				var i = 0,
					l = nodepath.length;
				for (i; i < l; i++) {
					temp = temp.get(nodepath[i]);
				}
			} else {
				temp = temp.get(nodepath[0]);
			}
		}
		let node = temp;
		return {
			async put(
				data: string | Record<string, any> | undefined,
				cb2: (arg0: GunMessagePut) => void
			) {
				data = await lz.encrypt(data, keys);
				node.put(data, (ack) => {
					if (cb2) {
						cb2(ack);
					}
				});
			},
			async value(cb: (arg0: { err: string }) => void | PromiseLike<void>) {
				node.once(async (data) => {
					let obj: any, tmp: any;
					if (!data) {
						return cb({ err: 'Record not found' });
					} else {
						tmp = data._;
						delete data._;
						obj = await lz.decrypt(data, keys);
						cb({ _: tmp, ...obj });
					}
				});
			}
		};
	};

	return gun; //return gun user instance
};

Gun.chain.keys = async function (secret, callback) {
	// can add secret string, username and password, or an array of secret strings\
	let keypair: ISEAPair | PromiseLike<ISEAPair>;
	if (secret) {
		let sys = await SysUserPair(typeof secret === 'string' ? [secret] : [...secret]);
		keypair = sys.keys;
	} else {
		keypair = (await SysUserPair()).keys;
	}
	callback && callback(keypair);
	return keypair;
};
