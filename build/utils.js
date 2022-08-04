import path from 'path';
import fs from 'fs-extra';
import fg from 'fast-glob';
import { $, cd } from 'zx';
import { join } from 'path';
export function interpretPath(...args) {
    return path.join($.cwd || process.cwd(), ...(args ?? ''));
}
export const readDirectorySync = (directory, allFiles = []) => {
    const files = fs.readdirSync(directory).map((file) => join(directory, file));
    allFiles.push(...files);
    files.forEach((file) => {
        fs.statSync(file).isDirectory() && readDirectorySync(file, allFiles);
    });
    return allFiles;
};
export function exists(path) {
    path = interpretPath(path);
    return fs.existsSync(path);
}
export async function remove(path) {
    path = interpretPath(path);
    return fs.remove(interpretPath(path));
}
export async function read(path, encoding) {
    path = interpretPath(path);
    return fs.readFile(path, encoding ?? 'utf-8');
}
read.sync = function (...args) {
    const path = interpretPath(args);
    return fs.readFileSync(path, 'utf-8');
};
export async function mkdir(...path) {
    const input = interpretPath(...path);
    return fs.mkdir(input);
}
export async function write(path, content) {
    return fs.writeFile(interpretPath(path), content, 'utf-8');
}
write.sync = function (path, content) {
    return fs.writeFileSync(interpretPath(path), content, 'utf-8');
};
async function jsonRead(path) {
    path = interpretPath(path);
    return fs.readJSON(path);
}
jsonRead.sync = function (path) {
    path = interpretPath(path);
    return fs.readJSONSync(path);
};
read.json = jsonRead;
export function glob(args) {
    const input = args.map((path) => interpretPath(path));
    return fg(input, { cwd: interpretPath() });
}
let log = console.log.bind(console);
export { cd, fs, fg, log };
