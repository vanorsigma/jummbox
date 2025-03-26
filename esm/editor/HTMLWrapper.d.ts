import { Change } from "./Change";
import { SongDocument } from "./SongDocument";
export declare class InputBox {
    readonly input: HTMLInputElement;
    private readonly _doc;
    private readonly _getChange;
    private _change;
    private _value;
    private _oldValue;
    constructor(input: HTMLInputElement, _doc: SongDocument, _getChange: (oldValue: string, newValue: string) => Change);
    updateValue(value: string): void;
    private _whenInput;
    private _whenChange;
}
export declare class Slider {
    readonly input: HTMLInputElement;
    private readonly _doc;
    private readonly _getChange;
    private _change;
    private _value;
    private _oldValue;
    container: HTMLSpanElement;
    constructor(input: HTMLInputElement, _doc: SongDocument, _getChange: ((oldValue: number, newValue: number) => Change) | null, midTick: boolean);
    updateValue(value: number): void;
    private _whenInput;
    getValueBeforeProspectiveChange(): number;
    private _whenChange;
}
