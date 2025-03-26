import { SongDocument } from "./SongDocument";
export declare class Box {
    private readonly _text;
    private readonly _label;
    readonly container: HTMLElement;
    private _renderedIndex;
    private _renderedLabelColor;
    private _renderedBackgroundColor;
    constructor(channel: number, color: string);
    setWidth(width: number): void;
    setHeight(height: number): void;
    setIndex(index: number, selected: boolean, dim: boolean, color: string, isNoise: boolean, isMod: boolean): void;
}
export declare class ChannelRow {
    private readonly _doc;
    readonly index: number;
    static patternHeight: number;
    private _renderedBarWidth;
    private _renderedBarHeight;
    private _boxes;
    readonly container: HTMLElement;
    constructor(_doc: SongDocument, index: number);
    render(): void;
}
