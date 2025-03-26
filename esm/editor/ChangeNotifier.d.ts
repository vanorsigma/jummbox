export declare class ChangeNotifier {
    private _watchers;
    private _dirty;
    watch(watcher: () => void): void;
    unwatch(watcher: () => void): void;
    changed(): void;
    notifyWatchers(): void;
}
