import { ISEAPair } from 'gun';
export interface IPair {
    (pwd: any, salt: string | any[]): Promise<ISEAPair>;
}
export default function Pair(pwd?: any, salt?: string | any[]): ReturnType<IPair>;
