import { SongDocument } from "./SongDocument";
export declare class EnvelopeEditor {
    private _doc;
    readonly container: HTMLElement;
    private readonly _rows;
    private readonly _targetSelects;
    private readonly _envelopeSelects;
    private readonly _deleteButtons;
    private _renderedEnvelopeCount;
    private _renderedEqFilterCount;
    private _renderedNoteFilterCount;
    private _renderedInstrumentType;
    private _renderedEffects;
    constructor(_doc: SongDocument);
    private _onChange;
    private _onClick;
    private _makeOption;
    private _updateTargetOptionVisibility;
    render(): void;
}
