import Gun, { IGunInstance, IGunInstanceRoot, IGunUserInstance, ISEAPair } from 'gun';
import 'gun/lib/path.js';
import chokidar from 'chokidar';
import { glob, chalk } from 'zx';
import { read, exists } from './utils';
import os from 'os';
declare module 'gun/types' {
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

/**
 * Scope watches the files in a directory and stores them in rad. No separate .ignore files as it uses the .gitignore file already in your current directory.
 * @param {string[]}what Glob pattern to watch
 * @param {callback(event, path, stats):void}callback Callback function to fire when a file or directory is added, changed, or removed
 * A fork of the HUB library... https://gun.eco/docs/hub.js#options
 * TODO: Broadcast files via relay server
 * TODO: ChainLocker
 */
const { username } = os.userInfo();
Gun.chain.scope = async function (what, callback, { verbose, alias }) {
	const _gun = this;
	verbose = verbose ?? true;
	alias = alias ?? username;
	const matches = await glob(what, { gitignore: true });

	try {
		const scope = chokidar.watch(matches, { persistent: true });
		const log = console.log;
		scope.on('all', (event, path) => {
			const fileOpts = { path, matches, event };
			if (callback) {
				callback(path, event, matches);
				if (verbose) {
					log(chalk.green(`scope callback fired : ${event} ${path}`));
				}
			}
		});
		scope
			.on('add', async function (path) {
				if (!exists(path)) {
					verbose && log(chalk.red(`File ${path} does not exist`));
					return;
				}
				const nodepath = path.includes('/') ? path.split('/').map((x) => x.trim()) : [path];
				const name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0];
				nodepath.pop() && nodepath.pop();
				if (nodepath && name) {
					_gun
						.get(alias)
						.path(nodepath)
						.put({ [name]: await read(path) });
					verbose && log(chalk.green(`File ${path} has been added`));
				} else {
					log(chalk.red(`Error adding file ${path}`));
					return;
				}
			})
			.on('change', async function (path) {
				if (!exists(path)) {
					verbose && log(chalk.red(`File ${path} does not exist`));
					return;
				}
				const nodepath = path.includes('/') ? path.split('/').map((x) => x.trim()) : [path.trim()];
				const name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0];
				nodepath.pop() && nodepath.pop();
				if (nodepath && name) {
					_gun
						.get(alias)
						.path(nodepath)
						.put({ [name]: await read(path) });
					verbose &&
						_gun
							.get(alias)
							.path(nodepath)
							.once((d) => {
								log('PATH\n' + chalk.green(d._['#']));
							});
					verbose && log(chalk.green(`File ${path} has been changed`));
				} else {
					log(chalk.red(`Error onChange for ${path}`));
					return;
				}
			})
			.on('unlink', async function (path) {
				if (!exists(path)) {
					verbose && log(chalk.red(`File ${path} does not exist`));
					return;
				}
				const nodepath = path.includes('/') ? path.split('/').map((x) => x.trim()) : [path];
				const name = nodepath.length > 1 ? nodepath.at(nodepath.length - 1) : nodepath[0];
				nodepath.pop() && nodepath.pop();
				if (nodepath && name) {
					_gun
						.get(alias)
						.path([...nodepath, name])
						.put(null as any);
					verbose && log(chalk.green(`File ${path} has been removed`));
				} else {
					log(chalk.red(`Error deleting file ${path}`));
					return;
				}
			});
		if (verbose) {
			scope
				?.on('addDir', (path) => log(chalk.magenta(`Directory ${path} has been added`)))
				.on('unlinkDir', (path) => log(chalk.magenta(`Directory ${path} has been removed`)))
				.on('error', (error) => log(chalk.magenta(`Watcher error: ${error}`)))
				.on('ready', () => log(chalk.magenta('Initial scan complete. Ready for changes')));
		}
	} catch (err) {
		console.log(
			chalk.red(
				'If you want to use the scope feature, you must install `chokidar` by typing `npm i chokidar` in your terminal.'
			)
		);
	}
};
