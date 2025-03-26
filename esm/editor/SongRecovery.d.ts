export interface RecoveredVersion {
    uid: string;
    time: number;
    name: string;
    work: number;
}
export interface RecoveredSong {
    versions: RecoveredVersion[];
}
export declare function versionToKey(version: RecoveredVersion): string;
export declare function generateUid(): string;
export declare function errorAlert(error: any): void;
export declare class SongRecovery {
    private _saveVersionTimeoutHandle;
    private _song;
    static getAllRecoveredSongs(): RecoveredSong[];
    saveVersion(uid: string, name: string, songData: string): void;
}
