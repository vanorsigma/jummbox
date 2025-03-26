export declare class Change {
    private _noop;
    protected _didSomething(): void;
    isNoop(): boolean;
    commit(): void;
}
export declare class UndoableChange extends Change {
    private _reversed;
    private _doneForwards;
    constructor(reversed: boolean);
    undo(): void;
    redo(): void;
    protected _isDoneForwards(): boolean;
    protected _doForwards(): void;
    protected _doBackwards(): void;
}
export declare class ChangeGroup extends Change {
    constructor();
    append(change: Change): void;
}
export declare class ChangeSequence extends UndoableChange {
    private _changes;
    private _committed;
    constructor(changes?: UndoableChange[]);
    checkFirst(): UndoableChange | null;
    append(change: UndoableChange): void;
    protected _doForwards(): void;
    protected _doBackwards(): void;
    isCommitted(): boolean;
    commit(): void;
}
