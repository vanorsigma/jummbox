import { Config } from "../synth/SynthConfig";
import { Note, makeNotePin, FilterSettings } from "../synth/synth";
import { ColorConfig } from "./ColorConfig";
import { HTML, SVG } from "imperative-html/dist/esm/elements-strict";
import { ChangeSequence } from "./Change";
import { ChangeVolume, ChangeTempo, ChangePan, ChangeReverb, ChangeDistortion, ChangeOperatorAmplitude, ChangeFeedbackAmplitude, ChangePulseWidth, ChangeDetune, ChangeVibratoDepth, ChangeVibratoSpeed, ChangeVibratoDelay, ChangePanDelay, ChangeChorus, ChangeEQFilterSimplePeak, ChangeNoteFilterSimplePeak, ChangeStringSustain, ChangeEnvelopeSpeed, ChangeSupersawDynamism, ChangeSupersawShape, ChangeSupersawSpread, ChangePitchShift, ChangeChannelBar, ChangeDragSelectedNotes, ChangeEnsurePatternExists, ChangeNoteTruncate, ChangeNoteAdded, ChangePatternSelection, ChangePinTime, ChangeSizeBend, ChangePitchBend, ChangePitchAdded, ChangeArpeggioSpeed, ChangeBitcrusherQuantization, ChangeBitcrusherFreq, ChangeEchoSustain, ChangeEQFilterSimpleCut, ChangeNoteFilterSimpleCut, ChangeFilterMovePoint, ChangeDuplicateSelectedReusedPatterns, ChangeHoldingModRecording } from "./changes";
import { prettyNumber } from "./EditorConfig";
function makeEmptyReplacementElement(node) {
    const clone = node.cloneNode(false);
    node.parentNode.replaceChild(clone, node);
    return clone;
}
class PatternCursor {
    constructor() {
        this.valid = false;
        this.prevNote = null;
        this.curNote = null;
        this.nextNote = null;
        this.pitch = 0;
        this.pitchIndex = -1;
        this.curIndex = 0;
        this.start = 0;
        this.end = 0;
        this.part = 0;
        this.exactPart = 0;
        this.nearPinIndex = 0;
        this.pins = [];
    }
}
export class PatternEditor {
    constructor(_doc, _interactive, _barOffset) {
        this._doc = _doc;
        this._interactive = _interactive;
        this._barOffset = _barOffset;
        this.controlMode = false;
        this.shiftMode = false;
        this._svgNoteBackground = SVG.pattern({ id: "patternEditorNoteBackground" + this._barOffset, x: "0", y: "0", patternUnits: "userSpaceOnUse" });
        this._svgDrumBackground = SVG.pattern({ id: "patternEditorDrumBackground" + this._barOffset, x: "0", y: "0", patternUnits: "userSpaceOnUse" });
        this._svgModBackground = SVG.pattern({ id: "patternEditorModBackground" + this._barOffset, x: "0", y: "0", patternUnits: "userSpaceOnUse" });
        this._svgBackground = SVG.rect({ x: "0", y: "0", "pointer-events": "none", fill: "url(#patternEditorNoteBackground" + this._barOffset + ")" });
        this._svgNoteContainer = SVG.svg();
        this._svgPlayhead = SVG.rect({ x: "0", y: "0", width: "4", fill: ColorConfig.playhead, "pointer-events": "none" });
        this._selectionRect = SVG.rect({ class: "dashed-line dash-move", fill: ColorConfig.boxSelectionFill, stroke: ColorConfig.hoverPreview, "stroke-width": 2, "stroke-dasharray": "5, 3", "fill-opacity": "0.4", "pointer-events": "none", visibility: "hidden" });
        this._svgPreview = SVG.path({ fill: "none", stroke: ColorConfig.hoverPreview, "stroke-width": "2", "pointer-events": "none" });
        this.modDragValueLabel = HTML.div({ width: "90", "text-anchor": "start", contenteditable: "true", style: "display: flex, justify-content: center; align-items:center; position:absolute; pointer-events: none;", "dominant-baseline": "central", });
        this._svg = SVG.svg({ style: `background-color: ${ColorConfig.editorBackground}; touch-action: none; position: absolute;`, width: "100%", height: "100%" }, SVG.defs(this._svgNoteBackground, this._svgDrumBackground, this._svgModBackground), this._svgBackground, this._selectionRect, this._svgNoteContainer, this._svgPreview, this._svgPlayhead);
        this.container = HTML.div({ style: "height: 100%; overflow:hidden; position: relative; flex-grow: 1;" }, this._svg, this.modDragValueLabel);
        this._defaultModBorder = 34;
        this._backgroundPitchRows = [];
        this._backgroundDrumRow = SVG.rect();
        this._backgroundModRow = SVG.rect();
        this._modDragValueLabelLeft = 0;
        this._modDragValueLabelTop = 0;
        this._modDragValueLabelWidth = 0;
        this.editingModLabel = false;
        this._modDragStartValue = 0;
        this._modDragLowerBound = 0;
        this._modDragUpperBound = 6;
        this._pitchHeight = -1;
        this._mouseX = 0;
        this._mouseY = 0;
        this._mouseDown = false;
        this._mouseOver = false;
        this._mouseDragging = false;
        this._mouseHorizontal = false;
        this._usingTouch = false;
        this._copiedPinChannels = [];
        this._mouseXStart = 0;
        this._mouseYStart = 0;
        this._touchTime = 0;
        this._shiftHeld = false;
        this._dragConfirmed = false;
        this._draggingStartOfSelection = false;
        this._draggingEndOfSelection = false;
        this._draggingSelectionContents = false;
        this._dragTime = 0;
        this._dragPitch = 0;
        this._dragSize = 0;
        this._dragVisible = false;
        this._dragChange = null;
        this._changePatternSelection = null;
        this._lastChangeWasPatternSelection = false;
        this._cursor = new PatternCursor();
        this._stashCursorPinVols = [];
        this._pattern = null;
        this._playheadX = 0.0;
        this._octaveOffset = 0;
        this._renderedWidth = -1;
        this._renderedHeight = -1;
        this._renderedBeatWidth = -1;
        this._renderedPitchHeight = -1;
        this._renderedFifths = false;
        this._renderedDrums = false;
        this._renderedMod = false;
        this._renderedRhythm = -1;
        this._renderedPitchChannelCount = -1;
        this._renderedNoiseChannelCount = -1;
        this._renderedModChannelCount = -1;
        this._followPlayheadBar = -1;
        this._validateModDragLabelInput = (event) => {
            const label = event.target;
            let converted = Number(label.innerText);
            if (!isNaN(converted) && converted >= 0 && converted < this._modDragLowerBound)
                return;
            if (label.innerText != "" && label.innerText != "-") {
                if (isNaN(converted)) {
                    converted = this._modDragLowerBound;
                    label.innerText = "" + this._modDragLowerBound;
                }
                let presValue = Math.floor(Math.max(Number(this._modDragLowerBound), Math.min(Number(this._modDragUpperBound), converted)));
                if (label.innerText != presValue + "")
                    label.innerText = presValue + "";
                let xOffset = (+(presValue >= 10.0)) + (+(presValue >= 100.0)) + (+(presValue < 0.0)) + (+(presValue <= -10.0));
                this._modDragValueLabelLeft = +prettyNumber(Math.max(Math.min(this._editorWidth - 10 - xOffset * 8, this._partWidth * (this._modDragNote.start + this._modDragPin.time) - 4 - xOffset * 4), 2));
                this.modDragValueLabel.style.setProperty("left", "" + this._modDragValueLabelLeft + "px");
                const sequence = new ChangeSequence();
                this._dragChange = sequence;
                this._doc.setProspectiveChange(this._dragChange);
                sequence.append(new ChangeSizeBend(this._doc, this._modDragNote, this._modDragPin.time, presValue - Config.modulators[this._modDragSetting].convertRealFactor, this._modDragPin.interval, this.shiftMode));
            }
        };
        this.resetCopiedPins = () => {
            const maxDivision = this._getMaxDivision();
            let cap = this._doc.song.getVolumeCap(false);
            this._copiedPinChannels.length = this._doc.song.getChannelCount();
            this._stashCursorPinVols.length = this._doc.song.getChannelCount();
            for (let i = 0; i < this._doc.song.pitchChannelCount; i++) {
                this._copiedPinChannels[i] = [makeNotePin(0, 0, cap), makeNotePin(0, maxDivision, cap)];
                this._stashCursorPinVols[i] = [cap, cap];
            }
            for (let i = this._doc.song.pitchChannelCount; i < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; i++) {
                this._copiedPinChannels[i] = [makeNotePin(0, 0, cap), makeNotePin(0, maxDivision, 0)];
                this._stashCursorPinVols[i] = [cap, 0];
            }
            for (let i = this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; i < this._doc.song.getChannelCount(); i++) {
                this._copiedPinChannels[i] = [makeNotePin(0, 0, cap), makeNotePin(0, maxDivision, 0)];
                this._stashCursorPinVols[i] = [cap, 0];
            }
        };
        this._animatePlayhead = (timestamp) => {
            if (this._usingTouch && !this.shiftMode && !this._mouseDragging && this._mouseDown && performance.now() > this._touchTime + 1000 && this._cursor.valid && this._doc.lastChangeWas(this._dragChange)) {
                this._dragChange.undo();
                this._shiftHeld = true;
                this._dragConfirmed = false;
                this._whenCursorPressed();
                this._doc.notifier.notifyWatchers();
            }
            const playheadBar = Math.floor(this._doc.synth.playhead);
            if (this._doc.synth.playing && ((this._pattern != null && this._doc.song.getPattern(this._doc.channel, Math.floor(this._doc.synth.playhead)) == this._pattern) || Math.floor(this._doc.synth.playhead) == this._doc.bar + this._barOffset)) {
                this._svgPlayhead.setAttribute("visibility", "visible");
                const modPlayhead = this._doc.synth.playhead - playheadBar;
                if (Math.abs(modPlayhead - this._playheadX) > 0.1) {
                    this._playheadX = modPlayhead;
                }
                else {
                    this._playheadX += (modPlayhead - this._playheadX) * 0.2;
                }
                this._svgPlayhead.setAttribute("x", "" + prettyNumber(this._playheadX * this._editorWidth - 2));
            }
            else {
                this._svgPlayhead.setAttribute("visibility", "hidden");
            }
            if (this._doc.synth.playing && (this._doc.synth.recording || this._doc.prefs.autoFollow) && this._followPlayheadBar != playheadBar) {
                new ChangeChannelBar(this._doc, this._doc.channel, playheadBar);
                this._doc.notifier.notifyWatchers();
            }
            this._followPlayheadBar = playheadBar;
            if (this._doc.currentPatternIsDirty) {
                this._redrawNotePatterns();
            }
            window.requestAnimationFrame(this._animatePlayhead);
        };
        this._whenMouseOver = (event) => {
            if (this._mouseOver)
                return;
            this._mouseOver = true;
            this._usingTouch = false;
        };
        this._whenMouseOut = (event) => {
            if (!this._mouseOver)
                return;
            this._mouseOver = false;
        };
        this._whenMousePressed = (event) => {
            event.preventDefault();
            const boundingRect = this._svg.getBoundingClientRect();
            this._mouseX = ((event.clientX || event.pageX) - boundingRect.left) * this._editorWidth / (boundingRect.right - boundingRect.left);
            this._mouseY = ((event.clientY || event.pageY) - boundingRect.top) * this._editorHeight / (boundingRect.bottom - boundingRect.top);
            if (isNaN(this._mouseX))
                this._mouseX = 0;
            if (isNaN(this._mouseY))
                this._mouseY = 0;
            this._usingTouch = false;
            this._shiftHeld = event.shiftKey;
            this._dragConfirmed = false;
            this._whenCursorPressed();
        };
        this._whenTouchPressed = (event) => {
            event.preventDefault();
            const boundingRect = this._svg.getBoundingClientRect();
            this._mouseX = (event.touches[0].clientX - boundingRect.left) * this._editorWidth / (boundingRect.right - boundingRect.left);
            this._mouseY = (event.touches[0].clientY - boundingRect.top) * this._editorHeight / (boundingRect.bottom - boundingRect.top);
            if (isNaN(this._mouseX))
                this._mouseX = 0;
            if (isNaN(this._mouseY))
                this._mouseY = 0;
            this._usingTouch = true;
            this._shiftHeld = event.shiftKey;
            this._dragConfirmed = false;
            this._touchTime = performance.now();
            this._whenCursorPressed();
        };
        this._whenMouseMoved = (event) => {
            this.controlMode = event.ctrlKey;
            this.shiftMode = event.shiftKey;
            const boundingRect = this._svg.getBoundingClientRect();
            this._mouseX = ((event.clientX || event.pageX) - boundingRect.left) * this._editorWidth / (boundingRect.right - boundingRect.left);
            this._mouseY = ((event.clientY || event.pageY) - boundingRect.top) * this._editorHeight / (boundingRect.bottom - boundingRect.top);
            if (isNaN(this._mouseX))
                this._mouseX = 0;
            if (isNaN(this._mouseY))
                this._mouseY = 0;
            this._usingTouch = false;
            this._whenCursorMoved();
        };
        this._whenTouchMoved = (event) => {
            if (!this._mouseDown)
                return;
            event.preventDefault();
            const boundingRect = this._svg.getBoundingClientRect();
            this._mouseX = (event.touches[0].clientX - boundingRect.left) * this._editorWidth / (boundingRect.right - boundingRect.left);
            this._mouseY = (event.touches[0].clientY - boundingRect.top) * this._editorHeight / (boundingRect.bottom - boundingRect.top);
            if (isNaN(this._mouseX))
                this._mouseX = 0;
            if (isNaN(this._mouseY))
                this._mouseY = 0;
            this._whenCursorMoved();
        };
        this._whenCursorReleased = (event) => {
            if (!this._cursor.valid)
                return;
            const continuousState = this._doc.lastChangeWas(this._dragChange);
            if (this._mouseDown && continuousState && this._dragChange != null) {
                if (this._draggingSelectionContents) {
                    this._doc.record(this._dragChange);
                    this._dragChange = null;
                    if (this._pattern != null && this._doc.song.getChannelIsMod(this._doc.channel))
                        this._pattern.notes.sort(function (a, b) { return (a.start == b.start) ? a.pitches[0] - b.pitches[0] : a.start - b.start; });
                }
                else if (this._draggingStartOfSelection || this._draggingEndOfSelection || this._shiftHeld) {
                    this._setPatternSelection(this._dragChange);
                    this._dragChange = null;
                }
                else if (this._mouseDragging || this._cursor.curNote == null || !this._dragChange.isNoop() || this._draggingStartOfSelection || this._draggingEndOfSelection || this._draggingSelectionContents || this._shiftHeld) {
                    this._doc.record(this._dragChange);
                    this._dragChange = null;
                    if (this._pattern != null && this._doc.song.getChannelIsMod(this._doc.channel))
                        this._pattern.notes.sort(function (a, b) { return (a.start == b.start) ? a.pitches[0] - b.pitches[0] : a.start - b.start; });
                }
                else {
                    if (this._pattern == null)
                        throw new Error();
                    const sequence = new ChangeSequence();
                    sequence.append(new ChangePatternSelection(this._doc, 0, 0));
                    if (this._cursor.pitchIndex == -1) {
                        if (this._cursor.curNote.pitches.length == Config.maxChordSize) {
                            sequence.append(new ChangePitchAdded(this._doc, this._cursor.curNote, this._cursor.curNote.pitches[0], 0, true));
                        }
                        sequence.append(new ChangePitchAdded(this._doc, this._cursor.curNote, this._cursor.pitch, this._cursor.curNote.pitches.length));
                        this._copyPins(this._cursor.curNote);
                        if (this._doc.prefs.enableNotePreview && !this._doc.synth.playing) {
                            const duration = Math.min(Config.partsPerBeat, this._cursor.end - this._cursor.start);
                            this._doc.performance.setTemporaryPitches(this._cursor.curNote.pitches, duration);
                        }
                    }
                    else {
                        if (this._cursor.curNote.pitches.length == 1) {
                            sequence.append(new ChangeNoteAdded(this._doc, this._pattern, this._cursor.curNote, this._cursor.curIndex, true));
                        }
                        else {
                            sequence.append(new ChangePitchAdded(this._doc, this._cursor.curNote, this._cursor.pitch, this._cursor.curNote.pitches.indexOf(this._cursor.pitch), true));
                        }
                    }
                    this._doc.record(sequence);
                }
            }
            this._mouseDown = false;
            this._mouseDragging = false;
            this._draggingStartOfSelection = false;
            this._draggingEndOfSelection = false;
            this._draggingSelectionContents = false;
            this._lastChangeWasPatternSelection = false;
            this.modDragValueLabel.setAttribute("fill", ColorConfig.secondaryText);
            this._updateCursorStatus();
            this._updatePreview();
        };
        for (let i = 0; i < Config.pitchesPerOctave; i++) {
            const rectangle = SVG.rect();
            rectangle.setAttribute("x", "1");
            rectangle.setAttribute("fill", (i == 0) ? ColorConfig.tonic : ColorConfig.pitchBackground);
            this._svgNoteBackground.appendChild(rectangle);
            this._backgroundPitchRows[i] = rectangle;
        }
        this._backgroundDrumRow.setAttribute("x", "1");
        this._backgroundDrumRow.setAttribute("y", "1");
        this._backgroundDrumRow.setAttribute("fill", ColorConfig.pitchBackground);
        this._svgDrumBackground.appendChild(this._backgroundDrumRow);
        this._backgroundModRow.setAttribute("fill", ColorConfig.pitchBackground);
        this._svgModBackground.appendChild(this._backgroundModRow);
        if (this._interactive) {
            this._updateCursorStatus();
            this._updatePreview();
            window.requestAnimationFrame(this._animatePlayhead);
            this._svg.addEventListener("mousedown", this._whenMousePressed);
            document.addEventListener("mousemove", this._whenMouseMoved);
            document.addEventListener("mouseup", this._whenCursorReleased);
            this._svg.addEventListener("mouseover", this._whenMouseOver);
            this._svg.addEventListener("mouseout", this._whenMouseOut);
            this._svg.addEventListener("touchstart", this._whenTouchPressed);
            this._svg.addEventListener("touchmove", this._whenTouchMoved);
            this._svg.addEventListener("touchend", this._whenCursorReleased);
            this._svg.addEventListener("touchcancel", this._whenCursorReleased);
            this.modDragValueLabel.addEventListener("input", this._validateModDragLabelInput);
        }
        else {
            this._svgPlayhead.style.display = "none";
            this._svg.appendChild(SVG.rect({ x: 0, y: 0, width: 10000, height: 10000, fill: ColorConfig.editorBackground, style: "opacity: 0.5;" }));
        }
        this.resetCopiedPins();
    }
    _getMaxPitch() {
        return this._doc.song.getChannelIsMod(this._doc.channel) ? Config.modCount - 1 : (this._doc.song.getChannelIsNoise(this._doc.channel) ? Config.drumCount - 1 : Config.maxPitch);
    }
    _getMaxDivision() {
        if (this.controlMode && this._mouseHorizontal)
            return Config.partsPerBeat;
        const rhythmStepsPerBeat = Config.rhythms[this._doc.song.rhythm].stepsPerBeat;
        if (rhythmStepsPerBeat % 4 == 0) {
            return Config.partsPerBeat / 2;
        }
        else if (rhythmStepsPerBeat % 3 == 0) {
            return Config.partsPerBeat / 3;
        }
        else if (rhythmStepsPerBeat % 2 == 0) {
            return Config.partsPerBeat / 2;
        }
        return Config.partsPerBeat;
    }
    _getMinDivision() {
        if (this.controlMode && this._mouseHorizontal)
            return 1;
        return Config.partsPerBeat / Config.rhythms[this._doc.song.rhythm].stepsPerBeat;
    }
    _snapToMinDivision(input) {
        const minDivision = this._getMinDivision();
        return Math.floor(input / minDivision) * minDivision;
    }
    _updateCursorStatus() {
        this._cursor = new PatternCursor();
        if (this._mouseX < 0 || this._mouseX > this._editorWidth || this._mouseY < 0 || this._mouseY > this._editorHeight || this._pitchHeight <= 0)
            return;
        const minDivision = this._getMinDivision();
        this._cursor.exactPart = this._mouseX / this._partWidth;
        this._cursor.part =
            Math.floor(Math.max(0, Math.min(this._doc.song.beatsPerBar * Config.partsPerBeat - minDivision, this._cursor.exactPart))
                / minDivision) * minDivision;
        let foundNote = false;
        if (this._pattern != null) {
            for (const note of this._pattern.notes) {
                if (note.end <= this._cursor.exactPart) {
                    if (this._doc.song.getChannelIsMod(this._doc.channel)) {
                        if (note.pitches[0] == Math.floor(this._findMousePitch(this._mouseY))) {
                            this._cursor.prevNote = note;
                        }
                        if (!foundNote)
                            this._cursor.curIndex++;
                    }
                    else {
                        this._cursor.prevNote = note;
                        this._cursor.curIndex++;
                    }
                }
                else if (note.start <= this._cursor.exactPart && note.end > this._cursor.exactPart) {
                    if (this._doc.song.getChannelIsMod(this._doc.channel)) {
                        if (note.pitches[0] == Math.floor(this._findMousePitch(this._mouseY))) {
                            this._cursor.curNote = note;
                            foundNote = true;
                        }
                        else if (!foundNote || (this._cursor.curNote != null && note.start < this._cursor.curNote.start))
                            this._cursor.curIndex++;
                    }
                    else {
                        this._cursor.curNote = note;
                    }
                }
                else if (note.start > this._cursor.exactPart) {
                    if (this._doc.song.getChannelIsMod(this._doc.channel)) {
                        if (note.pitches[0] == Math.floor(this._findMousePitch(this._mouseY))) {
                            this._cursor.nextNote = note;
                            break;
                        }
                    }
                    else {
                        this._cursor.nextNote = note;
                        break;
                    }
                }
            }
            if (this._doc.song.getChannelIsMod(this._doc.channel) && !this.editingModLabel) {
                if (this._pattern.notes[this._cursor.curIndex] != null && this._cursor.curNote != null) {
                    let pinIdx = 0;
                    while (this._cursor.curNote.start + this._cursor.curNote.pins[pinIdx].time < this._cursor.exactPart && pinIdx < this._cursor.curNote.pins.length) {
                        pinIdx++;
                    }
                    if (pinIdx > 0) {
                        if (this._cursor.curNote.start + this._cursor.curNote.pins[pinIdx].time - this._cursor.exactPart > this._cursor.exactPart - (this._cursor.curNote.start + this._cursor.curNote.pins[pinIdx - 1].time)) {
                            pinIdx--;
                        }
                    }
                    this.modDragValueLabel.style.setProperty("color", "#666688");
                    this.modDragValueLabel.style.setProperty("display", "");
                    const mod = Math.max(0, Config.modCount - 1 - this._cursor.curNote.pitches[0]);
                    let setting = this._doc.song.channels[this._doc.channel].instruments[this._doc.getCurrentInstrument(this._barOffset)].modulators[mod];
                    let presValue = this._cursor.curNote.pins[pinIdx].size + Config.modulators[setting].convertRealFactor;
                    let xOffset = (+(presValue >= 10.0)) + (+(presValue >= 100.0)) + (+(presValue < 0.0)) + (+(presValue <= -10.0));
                    this._modDragValueLabelWidth = 8 + xOffset * 8;
                    this._modDragValueLabelLeft = +prettyNumber(Math.max(Math.min(this._editorWidth - 10 - xOffset * 8, this._partWidth * (this._cursor.curNote.start + this._cursor.curNote.pins[pinIdx].time) - 4 - xOffset * 4), 2));
                    this._modDragValueLabelTop = +prettyNumber(this._pitchToPixelHeight(this._cursor.curNote.pitches[0] - this._octaveOffset) - 17 - (this._pitchHeight - this._pitchBorder) / 2);
                    this._modDragStartValue = this._cursor.curNote.pins[pinIdx].size;
                    this._modDragNote = this._cursor.curNote;
                    this._modDragPin = this._cursor.curNote.pins[pinIdx];
                    this._modDragLowerBound = Config.modulators[setting].convertRealFactor;
                    this._modDragUpperBound = Config.modulators[setting].convertRealFactor + Config.modulators[setting].maxRawVol;
                    this._modDragSetting = setting;
                    this.modDragValueLabel.style.setProperty("left", "" + this._modDragValueLabelLeft + "px");
                    this.modDragValueLabel.style.setProperty("top", "" + this._modDragValueLabelTop + "px");
                    this.modDragValueLabel.textContent = "" + presValue;
                }
                else {
                    this.modDragValueLabel.style.setProperty("display", "none");
                    this.modDragValueLabel.style.setProperty("pointer-events", "none");
                    this.modDragValueLabel.setAttribute("contenteditable", "false");
                }
            }
            else if (!this.editingModLabel) {
                this.modDragValueLabel.style.setProperty("display", "none");
                this.modDragValueLabel.style.setProperty("pointer-events", "none");
                this.modDragValueLabel.setAttribute("contenteditable", "false");
            }
        }
        else {
            this.modDragValueLabel.style.setProperty("display", "none");
            this.modDragValueLabel.style.setProperty("pointer-events", "none");
            this.modDragValueLabel.setAttribute("contenteditable", "false");
        }
        let mousePitch = this._findMousePitch(this._mouseY);
        if (this._cursor.curNote != null) {
            this._cursor.start = this._cursor.curNote.start;
            this._cursor.end = this._cursor.curNote.end;
            this._cursor.pins = this._cursor.curNote.pins;
            let interval = 0;
            let error = 0;
            let prevPin;
            let nextPin = this._cursor.curNote.pins[0];
            for (let j = 1; j < this._cursor.curNote.pins.length; j++) {
                prevPin = nextPin;
                nextPin = this._cursor.curNote.pins[j];
                const leftSide = this._partWidth * (this._cursor.curNote.start + prevPin.time);
                const rightSide = this._partWidth * (this._cursor.curNote.start + nextPin.time);
                if (this._mouseX > rightSide)
                    continue;
                if (this._mouseX < leftSide)
                    throw new Error();
                const intervalRatio = (this._mouseX - leftSide) / (rightSide - leftSide);
                const arc = Math.sqrt(1.0 / Math.sqrt(4.0) - Math.pow(intervalRatio - 0.5, 2.0)) - 0.5;
                const bendHeight = Math.abs(nextPin.interval - prevPin.interval);
                interval = prevPin.interval * (1.0 - intervalRatio) + nextPin.interval * intervalRatio;
                error = arc * bendHeight + 0.95;
                break;
            }
            let minInterval = Number.MAX_VALUE;
            let maxInterval = -Number.MAX_VALUE;
            let bestDistance = Number.MAX_VALUE;
            for (const pin of this._cursor.curNote.pins) {
                if (minInterval > pin.interval)
                    minInterval = pin.interval;
                if (maxInterval < pin.interval)
                    maxInterval = pin.interval;
                const pinDistance = Math.abs(this._cursor.curNote.start + pin.time - this._mouseX / this._partWidth);
                if (bestDistance > pinDistance) {
                    bestDistance = pinDistance;
                    this._cursor.nearPinIndex = this._cursor.curNote.pins.indexOf(pin);
                }
            }
            mousePitch -= interval;
            this._cursor.pitch = this._snapToPitch(mousePitch, -minInterval, this._getMaxPitch() - maxInterval);
            if (!this._doc.song.getChannelIsNoise(this._doc.channel) && !this._doc.song.getChannelIsMod(this._doc.channel)) {
                let nearest = error;
                for (let i = 0; i < this._cursor.curNote.pitches.length; i++) {
                    const distance = Math.abs(this._cursor.curNote.pitches[i] - mousePitch + 0.5);
                    if (distance > nearest)
                        continue;
                    nearest = distance;
                    this._cursor.pitch = this._cursor.curNote.pitches[i];
                }
            }
            for (let i = 0; i < this._cursor.curNote.pitches.length; i++) {
                if (this._cursor.curNote.pitches[i] == this._cursor.pitch) {
                    this._cursor.pitchIndex = i;
                    break;
                }
            }
        }
        else {
            this._cursor.pitch = this._snapToPitch(mousePitch, 0, this._getMaxPitch());
            const defaultLength = this._copiedPins[this._copiedPins.length - 1].time;
            const fullBeats = Math.floor(this._cursor.part / Config.partsPerBeat);
            const maxDivision = this._getMaxDivision();
            const modMouse = this._cursor.part % Config.partsPerBeat;
            if (defaultLength == 1) {
                this._cursor.start = this._cursor.part;
            }
            else if (defaultLength > Config.partsPerBeat) {
                this._cursor.start = fullBeats * Config.partsPerBeat;
            }
            else if (defaultLength == Config.partsPerBeat) {
                this._cursor.start = fullBeats * Config.partsPerBeat;
                if (maxDivision < Config.partsPerBeat && modMouse > maxDivision) {
                    this._cursor.start += Math.floor(modMouse / maxDivision) * maxDivision;
                }
            }
            else {
                this._cursor.start = fullBeats * Config.partsPerBeat;
                let division = Config.partsPerBeat % defaultLength == 0 ? defaultLength : Math.min(defaultLength, maxDivision);
                while (division < maxDivision && Config.partsPerBeat % division != 0) {
                    division++;
                }
                this._cursor.start += Math.floor(modMouse / division) * division;
            }
            this._cursor.end = this._cursor.start + defaultLength;
            let forceStart = 0;
            let forceEnd = this._doc.song.beatsPerBar * Config.partsPerBeat;
            if (this._cursor.prevNote != null) {
                forceStart = this._cursor.prevNote.end;
            }
            if (this._cursor.nextNote != null) {
                forceEnd = this._cursor.nextNote.start;
            }
            if (this._cursor.start < forceStart) {
                this._cursor.start = forceStart;
                this._cursor.end = this._cursor.start + defaultLength;
                if (this._cursor.end > forceEnd) {
                    this._cursor.end = forceEnd;
                }
            }
            else if (this._cursor.end > forceEnd) {
                this._cursor.end = forceEnd;
                this._cursor.start = this._cursor.end - defaultLength;
                if (this._cursor.start < forceStart) {
                    this._cursor.start = forceStart;
                }
            }
            if (this._cursor.end - this._cursor.start == defaultLength) {
                if (this._copiedPinChannels.length > this._doc.channel) {
                    this._copiedPins = this._copiedPinChannels[this._doc.channel];
                    this._cursor.pins = this._copiedPins;
                }
                else {
                    const cap = this._doc.song.getVolumeCap(false);
                    this._cursor.pins = [makeNotePin(0, 0, cap), makeNotePin(0, maxDivision, cap)];
                }
            }
            else {
                this._cursor.pins = [];
                for (const oldPin of this._copiedPins) {
                    if (oldPin.time <= this._cursor.end - this._cursor.start) {
                        this._cursor.pins.push(makeNotePin(0, oldPin.time, oldPin.size));
                        if (oldPin.time == this._cursor.end - this._cursor.start)
                            break;
                    }
                    else {
                        this._cursor.pins.push(makeNotePin(0, this._cursor.end - this._cursor.start, oldPin.size));
                        break;
                    }
                }
            }
            if (this._doc.song.getChannelIsMod(this._doc.channel)) {
                this._cursor.pitch = Math.max(0, Math.min(Config.modCount - 1, this._cursor.pitch));
                if (this._stashCursorPinVols != null && this._stashCursorPinVols[this._doc.channel] != null) {
                    for (let pin = 0; pin < this._cursor.pins.length; pin++) {
                        this._cursor.pins[pin].size = this._stashCursorPinVols[this._doc.channel][pin];
                    }
                }
                let maxHeight = this._doc.song.getVolumeCap(this._doc.song.getChannelIsMod(this._doc.channel), this._doc.channel, this._doc.getCurrentInstrument(this._barOffset), this._cursor.pitch);
                let maxFoundHeight = 0;
                for (const pin of this._cursor.pins) {
                    if (pin.size > maxFoundHeight) {
                        maxFoundHeight = pin.size;
                    }
                }
                if (maxFoundHeight > maxHeight) {
                    for (const pin of this._cursor.pins) {
                        pin.size = Math.round(pin.size * (maxHeight / maxFoundHeight));
                    }
                }
            }
        }
        this._cursor.valid = true;
    }
    _cursorIsInSelection() {
        return this._cursor.valid && this._doc.selection.patternSelectionActive && this._doc.selection.patternSelectionStart <= this._cursor.exactPart && this._cursor.exactPart <= this._doc.selection.patternSelectionEnd;
    }
    _cursorAtStartOfSelection() {
        return this._cursor.valid && this._doc.selection.patternSelectionActive && this._cursor.pitchIndex == -1 && this._doc.selection.patternSelectionStart - 3 <= this._cursor.exactPart && this._cursor.exactPart <= this._doc.selection.patternSelectionStart + 1.25;
    }
    _cursorAtEndOfSelection() {
        return this._cursor.valid && this._doc.selection.patternSelectionActive && this._cursor.pitchIndex == -1 && this._doc.selection.patternSelectionEnd - 1.25 <= this._cursor.exactPart && this._cursor.exactPart <= this._doc.selection.patternSelectionEnd + 3;
    }
    _findMousePitch(pixelY) {
        return Math.max(0, Math.min(this._pitchCount - 1, this._pitchCount - (pixelY / this._pitchHeight))) + this._octaveOffset;
    }
    _snapToPitch(guess, min, max) {
        if (guess < min)
            guess = min;
        if (guess > max)
            guess = max;
        const scale = this._doc.prefs.notesOutsideScale ? Config.scales.dictionary["Free"].flags : Config.scales[this._doc.song.scale].flags;
        if (scale[Math.floor(guess) % Config.pitchesPerOctave] || this._doc.song.getChannelIsNoise(this._doc.channel) || this._doc.song.getChannelIsMod(this._doc.channel)) {
            return Math.floor(guess);
        }
        else {
            let topPitch = Math.floor(guess) + 1;
            let bottomPitch = Math.floor(guess) - 1;
            while (!scale[topPitch % Config.pitchesPerOctave]) {
                topPitch++;
            }
            while (!scale[(bottomPitch) % Config.pitchesPerOctave]) {
                bottomPitch--;
            }
            if (topPitch > max) {
                if (bottomPitch < min) {
                    return min;
                }
                else {
                    return bottomPitch;
                }
            }
            else if (bottomPitch < min) {
                return topPitch;
            }
            let topRange = topPitch;
            let bottomRange = bottomPitch + 1;
            if (topPitch % Config.pitchesPerOctave == 0 || topPitch % Config.pitchesPerOctave == 7) {
                topRange -= 0.5;
            }
            if (bottomPitch % Config.pitchesPerOctave == 0 || bottomPitch % Config.pitchesPerOctave == 7) {
                bottomRange += 0.5;
            }
            return guess - bottomRange > topRange - guess ? topPitch : bottomPitch;
        }
    }
    _copyPins(note) {
        this._copiedPins = [];
        for (const oldPin of note.pins) {
            this._copiedPins.push(makeNotePin(0, oldPin.time, oldPin.size));
        }
        for (let i = 1; i < this._copiedPins.length - 1;) {
            if (this._copiedPins[i - 1].size == this._copiedPins[i].size &&
                this._copiedPins[i].size == this._copiedPins[i + 1].size) {
                this._copiedPins.splice(i, 1);
            }
            else {
                i++;
            }
        }
        this._copiedPinChannels[this._doc.channel] = this._copiedPins;
        this._stashCursorPinVols[this._doc.channel] = [];
        for (let pin = 0; pin < this._copiedPins.length; pin++) {
            this._stashCursorPinVols[this._doc.channel].push(this._copiedPins[pin].size);
        }
    }
    movePlayheadToMouse() {
        if (this._mouseOver) {
            this._doc.synth.playhead = this._doc.bar + this._barOffset + (this._mouseX / this._editorWidth);
            return true;
        }
        return false;
    }
    setModSettingsForChange(change, songEditor) {
        const thisRef = this;
        const timeQuantum = Math.max(4, (Config.partsPerBeat / Config.rhythms[this._doc.song.rhythm].stepsPerBeat));
        const currentBar = Math.floor(this._doc.synth.playhead);
        const realPart = this._doc.synth.getCurrentPart();
        let changedPatterns = false;
        const currentPart = (realPart < timeQuantum / 2) ? 0 : Math.ceil(realPart / timeQuantum) * timeQuantum;
        function getMatchingInstrumentAndMod(applyToMod, modChannel, modInsIndex, modFilterIndex) {
            let startIndex = (modInsIndex == undefined) ? 0 : modInsIndex;
            let endIndex = (modInsIndex == undefined) ? modChannel.instruments.length - 1 : modInsIndex;
            for (let instrumentIndex = startIndex; instrumentIndex <= endIndex; instrumentIndex++) {
                let instrument = modChannel.instruments[instrumentIndex];
                for (let mod = 0; mod < Config.modCount; mod++) {
                    if (instrument.modulators[mod] == applyToMod && !Config.modulators[instrument.modulators[mod]].forSong && (instrument.modChannels[mod] == thisRef._doc.channel)) {
                        if (thisRef._doc.getCurrentInstrument() == instrument.modInstruments[mod]
                            || instrument.modInstruments[mod] >= thisRef._doc.song.channels[thisRef._doc.channel].instruments.length) {
                            if (modFilterIndex != undefined && (applyToMod == Config.modulators.dictionary["eq filter"].index || applyToMod == Config.modulators.dictionary["note filter"].index)) {
                                if (instrument.modFilterTypes[mod] == modFilterIndex)
                                    return [instrumentIndex, mod];
                            }
                            else
                                return [instrumentIndex, mod];
                        }
                    }
                    else if (instrument.modulators[mod] == applyToMod && Config.modulators[instrument.modulators[mod]].forSong && (instrument.modChannels[mod] == -1)) {
                        return [instrumentIndex, mod];
                    }
                }
            }
            return [-1, -1];
        }
        function sanitizeInterval(doc, startPart, endPart, pattern, forMod, sequence) {
            if (startPart >= endPart)
                return;
            for (let noteIndex = 0; noteIndex < pattern.notes.length; noteIndex++) {
                const note = pattern.notes[noteIndex];
                if (note.pitches[0] != forMod)
                    continue;
                if (note.start < endPart && note.end > startPart) {
                    let couldIntersectStart = false;
                    let intersectsEnd = false;
                    let firstInteriorPin = -1;
                    let interiorPinCount = 0;
                    if (note.start <= startPart && note.end >= endPart) {
                        for (let pinIndex = 0; pinIndex < note.pins.length; pinIndex++) {
                            const pin = note.pins[pinIndex];
                            if (note.start + pin.time > startPart && note.start + pin.time < endPart) {
                                if (firstInteriorPin < 0)
                                    firstInteriorPin = pinIndex;
                                interiorPinCount++;
                            }
                        }
                        if (interiorPinCount > 0)
                            note.pins.splice(firstInteriorPin, interiorPinCount);
                        return;
                    }
                    for (let pinIndex = 0; pinIndex < note.pins.length; pinIndex++) {
                        const pin = note.pins[pinIndex];
                        if (note.start + pin.time >= startPart && note.start + pin.time <= endPart) {
                            if (firstInteriorPin < 0)
                                firstInteriorPin = pinIndex;
                            interiorPinCount++;
                        }
                        else {
                            if (interiorPinCount == 0)
                                couldIntersectStart = true;
                            if (interiorPinCount > 0)
                                intersectsEnd = true;
                        }
                    }
                    if (couldIntersectStart && interiorPinCount > 0) {
                        note.pins[firstInteriorPin].time = startPart - note.start;
                        firstInteriorPin++;
                        interiorPinCount--;
                    }
                    if (intersectsEnd && interiorPinCount > 0) {
                        note.pins[firstInteriorPin + interiorPinCount - 1].time = endPart - note.start;
                        interiorPinCount--;
                    }
                    note.pins.splice(firstInteriorPin, interiorPinCount);
                    if (note.pins.length < 2) {
                        sequence.append(new ChangeNoteAdded(doc, pattern, note, noteIndex, true));
                        noteIndex--;
                        continue;
                    }
                    let timeAdjust = 0;
                    timeAdjust = note.pins[0].time;
                    note.start += timeAdjust;
                    for (let i = 0; i < note.pins.length; i++) {
                        note.pins[i].time -= timeAdjust;
                    }
                    note.end = note.start + note.pins[note.pins.length - 1].time;
                    if (note.end <= note.start) {
                        sequence.append(new ChangeNoteAdded(doc, pattern, note, noteIndex, true));
                        noteIndex--;
                    }
                }
            }
        }
        const sequence = new ChangeSequence();
        const instrument = this._doc.song.channels[this._doc.channel].instruments[this._doc.getCurrentInstrument()];
        let applyToMods = [];
        let applyToFilterTargets = [];
        let applyValues = [];
        let toApply = true;
        let slider = null;
        if (change == null) {
            var modulator = Config.modulators.dictionary["song volume"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(this._doc.prefs.volume - modulator.convertRealFactor);
        }
        else if (this._doc.continuingModRecordingChange != null && this._doc.continuingModRecordingChange.storedChange == null && this._doc.continuingModRecordingChange.storedSlider == null) {
            var modulator = Config.modulators.dictionary["song volume"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(this._doc.continuingModRecordingChange.storedValues[0]);
        }
        else if (change instanceof ChangeTempo) {
            var modulator = Config.modulators.dictionary["tempo"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(this._doc.song.tempo - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                this._doc.song.tempo = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeVolume) {
            var modulator = Config.modulators.dictionary["mix volume"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.volume - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null)
                instrument.volume = slider.getValueBeforeProspectiveChange();
        }
        else if (change instanceof ChangePan) {
            var modulator = Config.modulators.dictionary["pan"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.pan - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.pan = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeReverb) {
            var modulator = Config.modulators.dictionary["reverb"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.reverb - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.reverb = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeDistortion) {
            var modulator = Config.modulators.dictionary["distortion"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.distortion - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.distortion = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeOperatorAmplitude) {
            var modulator = Config.modulators.dictionary["fm slider " + (change.operatorIndex + 1)];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.operators[change.operatorIndex].amplitude - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.operators[change.operatorIndex].amplitude = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeFeedbackAmplitude) {
            var modulator = Config.modulators.dictionary["fm feedback"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.feedbackAmplitude - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.feedbackAmplitude = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangePulseWidth) {
            var modulator = Config.modulators.dictionary["pulse width"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.pulseWidth - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.pulseWidth = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeDetune) {
            var modulator = Config.modulators.dictionary["detune"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.detune - modulator.convertRealFactor - Config.detuneCenter);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.detune = slider.getValueBeforeProspectiveChange() + Config.detuneCenter;
            }
        }
        else if (change instanceof ChangeVibratoDepth) {
            var modulator = Config.modulators.dictionary["vibrato depth"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.vibratoDepth * 25 - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.vibratoDepth = slider.getValueBeforeProspectiveChange() / 25;
            }
        }
        else if (change instanceof ChangeVibratoSpeed) {
            var modulator = Config.modulators.dictionary["vibrato speed"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.vibratoSpeed - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.vibratoSpeed = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeVibratoDelay) {
            var modulator = Config.modulators.dictionary["vibrato delay"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.vibratoDelay - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.vibratoDelay = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeArpeggioSpeed) {
            var modulator = Config.modulators.dictionary["arp speed"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.arpeggioSpeed - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.arpeggioSpeed = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangePanDelay) {
            var modulator = Config.modulators.dictionary["pan delay"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.panDelay - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.panDelay = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeSequence && change.checkFirst() instanceof ChangeFilterMovePoint && !change.isCommitted()) {
            const useChange = change.checkFirst();
            const preMoveData = useChange.getMoveData(true);
            const postMoveData = useChange.getMoveData(false);
            let useFilter = instrument.eqFilter;
            var modulatorIndex;
            if (useChange.useNoteFilter) {
                modulatorIndex = Config.modulators.dictionary["note filter"].index;
                useFilter = instrument.noteFilter;
                if (instrument.tmpNoteFilterEnd == null) {
                    instrument.tmpNoteFilterStart = new FilterSettings();
                    instrument.tmpNoteFilterStart.fromJsonObject(instrument.noteFilter.toJsonObject());
                    instrument.tmpNoteFilterEnd = instrument.tmpNoteFilterStart;
                }
                const modifyPoint = instrument.tmpNoteFilterEnd.controlPoints[useChange.pointIndex];
                if (modifyPoint != null && modifyPoint.type == useChange.pointType) {
                    modifyPoint.freq = postMoveData.freq;
                    modifyPoint.gain = postMoveData.gain;
                }
            }
            else {
                modulatorIndex = Config.modulators.dictionary["eq filter"].index;
                if (instrument.tmpEqFilterEnd == null) {
                    instrument.tmpEqFilterStart = new FilterSettings();
                    instrument.tmpEqFilterStart.fromJsonObject(instrument.eqFilter.toJsonObject());
                    instrument.tmpEqFilterEnd = instrument.tmpEqFilterStart;
                }
                const modifyPoint = instrument.tmpEqFilterEnd.controlPoints[useChange.pointIndex];
                if (modifyPoint != null && modifyPoint.type == useChange.pointType) {
                    modifyPoint.freq = postMoveData.freq;
                    modifyPoint.gain = postMoveData.gain;
                }
            }
            applyToMods.push(modulatorIndex);
            applyToMods.push(modulatorIndex);
            if (toApply)
                applyValues.push(postMoveData.freq);
            if (toApply)
                applyValues.push(postMoveData.gain);
            applyToFilterTargets.push(1 + useChange.pointIndex * 2);
            applyToFilterTargets.push(1 + useChange.pointIndex * 2 + 1);
            for (let i = 0; i < useFilter.controlPointCount; i++) {
                var point = useFilter.controlPoints[i];
                if (Object.is(point, preMoveData.point)) {
                    point.freq = preMoveData.freq;
                    point.gain = preMoveData.gain;
                }
            }
        }
        else if (change instanceof ChangeBitcrusherQuantization) {
            var modulator = Config.modulators.dictionary["bit crush"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.bitcrusherQuantization - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.bitcrusherQuantization = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeBitcrusherFreq) {
            var modulator = Config.modulators.dictionary["freq crush"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.bitcrusherFreq - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.bitcrusherFreq = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeEchoSustain) {
            var modulator = Config.modulators.dictionary["echo"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.echoSustain - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.echoSustain = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeChorus) {
            var modulator = Config.modulators.dictionary["chorus"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.chorus - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.chorus = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeEQFilterSimpleCut) {
            var modulator = Config.modulators.dictionary["eq filt cut"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.eqFilterSimpleCut - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.eqFilterSimpleCut = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeEQFilterSimplePeak) {
            var modulator = Config.modulators.dictionary["eq filt peak"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.eqFilterSimplePeak - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.eqFilterSimplePeak = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeNoteFilterSimpleCut) {
            var modulator = Config.modulators.dictionary["note filt cut"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.noteFilterSimpleCut - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.noteFilterSimpleCut = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeNoteFilterSimplePeak) {
            var modulator = Config.modulators.dictionary["note filt peak"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.noteFilterSimplePeak - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.noteFilterSimplePeak = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangePitchShift) {
            var modulator = Config.modulators.dictionary["pitch shift"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.pitchShift - Config.pitchShiftCenter - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.pitchShift = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeStringSustain) {
            var modulator = Config.modulators.dictionary["sustain"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.stringSustain - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.stringSustain = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeEnvelopeSpeed) {
            var modulator = Config.modulators.dictionary["envelope speed"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.envelopeSpeed - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.envelopeSpeed = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeSupersawDynamism) {
            var modulator = Config.modulators.dictionary["dynamism"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.supersawDynamism - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.supersawDynamism = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeSupersawSpread) {
            var modulator = Config.modulators.dictionary["spread"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.supersawSpread - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.supersawSpread = slider.getValueBeforeProspectiveChange();
            }
        }
        else if (change instanceof ChangeSupersawShape) {
            var modulator = Config.modulators.dictionary["saw shape"];
            applyToMods.push(modulator.index);
            if (toApply)
                applyValues.push(instrument.supersawShape - modulator.convertRealFactor);
            slider = songEditor.getSliderForModSetting(modulator.index);
            if (slider != null) {
                instrument.supersawShape = slider.getValueBeforeProspectiveChange();
            }
        }
        for (let applyIndex = 0; applyIndex < applyValues.length; applyIndex++) {
            applyValues[applyIndex] = Math.round(applyValues[applyIndex]);
        }
        if (this._doc.continuingModRecordingChange != null && applyToFilterTargets.length == 0) {
            if (slider == null && this._doc.continuingModRecordingChange.storedSlider != null)
                slider = this._doc.continuingModRecordingChange.storedSlider;
            if (slider != null && +slider.input.value == slider.getValueBeforeProspectiveChange()) {
                applyValues = this._doc.continuingModRecordingChange.storedValues;
                toApply = false;
            }
            this._doc.continuingModRecordingChange = null;
        }
        if (slider != null)
            slider.updateValue(slider.getValueBeforeProspectiveChange());
        for (let applyIndex = 0; applyIndex < applyToMods.length; applyIndex++) {
            let usedPatterns = [];
            let usedInstruments = [];
            let usedInstrumentIndices = [];
            let usedModIndices = [];
            for (let channelIndex = this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; channelIndex < this._doc.song.getChannelCount(); channelIndex++) {
                const channel = this._doc.song.channels[channelIndex];
                let pattern = this._doc.song.getPattern(channelIndex, currentBar);
                let useInstrumentIndex = 0;
                let useModIndex = 0;
                if (pattern == null) {
                    var rtn;
                    if (applyToFilterTargets.length > applyIndex)
                        rtn = getMatchingInstrumentAndMod(applyToMods[applyIndex], channel, undefined, applyToFilterTargets[applyIndex]);
                    else
                        rtn = getMatchingInstrumentAndMod(applyToMods[applyIndex], channel);
                    useInstrumentIndex = rtn[0];
                    useModIndex = rtn[1];
                    if (useInstrumentIndex != -1) {
                        sequence.append(new ChangeEnsurePatternExists(this._doc, channelIndex, currentBar));
                        new ChangeDuplicateSelectedReusedPatterns(this._doc, currentBar, 1, channelIndex, 1);
                        pattern = this._doc.song.getPattern(channelIndex, currentBar);
                        pattern.instruments[0] = useInstrumentIndex;
                        changedPatterns = true;
                    }
                }
                else {
                    var rtn;
                    if (applyToFilterTargets.length > applyIndex)
                        rtn = getMatchingInstrumentAndMod(applyToMods[applyIndex], channel, pattern.instruments[0], applyToFilterTargets[applyIndex]);
                    else
                        rtn = getMatchingInstrumentAndMod(applyToMods[applyIndex], channel, pattern.instruments[0]);
                    useInstrumentIndex = rtn[0];
                    useModIndex = rtn[1];
                    if (useInstrumentIndex != -1) {
                        new ChangeDuplicateSelectedReusedPatterns(this._doc, currentBar, 1, channelIndex, 1);
                        pattern = this._doc.song.getPattern(channelIndex, currentBar);
                        changedPatterns = true;
                    }
                }
                if (useInstrumentIndex != -1) {
                    usedPatterns.push(pattern);
                    usedInstrumentIndices.push(useInstrumentIndex);
                    usedInstruments.push(channel.instruments[useInstrumentIndex]);
                    usedModIndices.push(useModIndex);
                }
            }
            if (usedInstrumentIndices.length == 0) {
                for (let channelIndex = this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount; channelIndex < this._doc.song.getChannelCount(); channelIndex++) {
                    const channel = this._doc.song.channels[channelIndex];
                    let pattern = this._doc.song.getPattern(channelIndex, currentBar);
                    let useInstrument = -1;
                    if (pattern != null) {
                        useInstrument = pattern.instruments[0];
                    }
                    else {
                        for (let instrumentIndex = 0; instrumentIndex < channel.instruments.length; instrumentIndex++) {
                            for (let mod = 0; mod < Config.modCount; mod++) {
                                if (channel.instruments[instrumentIndex].modulators[mod] == Config.modulators.dictionary["none"].index) {
                                    useInstrument = instrumentIndex;
                                    sequence.append(new ChangeEnsurePatternExists(this._doc, channelIndex, currentBar));
                                    pattern = this._doc.song.getPattern(channelIndex, currentBar);
                                    pattern.instruments[0] = instrumentIndex;
                                    mod = Config.modCount;
                                    instrumentIndex = channel.instruments.length;
                                    channelIndex = this._doc.song.getChannelCount();
                                    changedPatterns = true;
                                }
                            }
                        }
                    }
                    if (useInstrument != -1) {
                        let instrument = channel.instruments[useInstrument];
                        for (let mod = 0; mod < Config.modCount; mod++) {
                            if (instrument.modulators[mod] == Config.modulators.dictionary["none"].index) {
                                instrument.modulators[mod] = applyToMods[applyIndex];
                                if (Config.modulators[applyToMods[applyIndex]].forSong) {
                                    instrument.modChannels[mod] = -1;
                                }
                                else {
                                    instrument.modChannels[mod] = this._doc.channel;
                                    if (this._doc.song.channels[this._doc.channel].instruments.length > 1) {
                                        if (!this.controlMode || !this.shiftMode)
                                            instrument.modInstruments[mod] = this._doc.song.channels[this._doc.channel].instruments.length + 1;
                                        else
                                            instrument.modInstruments[mod] = this._doc.getCurrentInstrument();
                                    }
                                    else
                                        instrument.modInstruments[mod] = 0;
                                    if (applyToFilterTargets.length > applyIndex) {
                                        instrument.modFilterTypes[mod] = applyToFilterTargets[applyIndex];
                                    }
                                }
                                usedPatterns.push(pattern);
                                usedInstrumentIndices.push(useInstrument);
                                usedInstruments.push(instrument);
                                usedModIndices.push(mod);
                                mod = Config.modCount;
                                channelIndex = this._doc.song.getChannelCount();
                            }
                        }
                    }
                }
            }
            for (let i = 0; i < usedPatterns.length; i++) {
                const addLength = (applyToFilterTargets.length == 0) ? 0 : 24;
                const newNoteDist = +(timeQuantum >= 6) * 6 + 12;
                let latestPart = -1;
                let latestNote = null;
                let latestPin = null;
                let latestPinIdx = -1;
                let prevNotePart = -1;
                let prevNote = null;
                const modNoteIndex = Config.modCount - 1 - usedModIndices[i];
                const usedInstrument = usedInstruments[i];
                if (usedInstrument.modChannels[usedModIndices[i]] >= -1) {
                    let usedNewInstrumentIndices = [];
                    if (Config.modulators[applyToMods[applyIndex]].forSong) {
                        usedNewInstrumentIndices.push(0);
                    }
                    else {
                        if (usedInstrument.modInstruments[usedModIndices[i]] == this._doc.synth.song.channels[usedInstrument.modChannels[usedModIndices[i]]].instruments.length) {
                            for (let k = 0; k < this._doc.synth.song.channels[usedInstrument.modChannels[usedModIndices[i]]].instruments.length; k++) {
                                usedNewInstrumentIndices.push(k);
                            }
                        }
                        else if (usedInstrument.modInstruments[usedModIndices[i]] > this._doc.synth.song.channels[usedInstrument.modChannels[usedModIndices[i]]].instruments.length) {
                            if (this._doc.synth.song.getPattern(usedInstrument.modChannels[usedModIndices[i]], currentBar) != null)
                                usedNewInstrumentIndices = this._doc.synth.song.getPattern(usedInstrument.modChannels[usedModIndices[i]], currentBar).instruments;
                        }
                        else {
                            usedNewInstrumentIndices.push(usedInstrument.modInstruments[usedModIndices[i]]);
                        }
                    }
                    for (let instrumentIndex = 0; instrumentIndex < usedNewInstrumentIndices.length; instrumentIndex++) {
                        this._doc.synth.setModValue(applyValues[applyIndex], applyValues[applyIndex], usedInstruments[i].modChannels[usedModIndices[i]], usedNewInstrumentIndices[instrumentIndex], applyToMods[applyIndex]);
                        this._doc.synth.forceHoldMods(applyValues[applyIndex], usedInstruments[i].modChannels[usedModIndices[i]], usedNewInstrumentIndices[instrumentIndex], applyToMods[applyIndex]);
                    }
                }
                for (let j = 0; j < usedPatterns[i].notes.length; j++) {
                    const note = usedPatterns[i].notes[j];
                    if (note.pitches[0] == modNoteIndex && note.start <= currentPart) {
                        for (let pinIdx = 0; pinIdx < note.pins.length; pinIdx++) {
                            const pin = note.pins[pinIdx];
                            if (note.start + pin.time <= currentPart && (note.start + pin.time > latestPart || (note.start == latestPart))) {
                                latestPart = note.start + pin.time;
                                latestPin = pin;
                                latestPinIdx = pinIdx;
                                latestNote = note;
                            }
                        }
                    }
                    if (note.pitches[0] == modNoteIndex && note.end <= currentPart && note.end > prevNotePart) {
                        prevNotePart = note.end;
                        prevNote = note;
                    }
                }
                let prevPart = Math.max(0, currentPart - timeQuantum);
                let endPart = Math.min(currentPart + timeQuantum + addLength, Config.partsPerBeat * this._doc.song.beatsPerBar);
                let continuous = (toApply == false);
                if (latestNote == null || currentPart - latestNote.end >= newNoteDist) {
                    if (currentPart == endPart)
                        continue;
                    sanitizeInterval(this._doc, currentPart, endPart, usedPatterns[i], modNoteIndex, sequence);
                    latestNote = new Note(modNoteIndex, currentPart, endPart, applyValues[applyIndex], this._doc.song.getChannelIsNoise(this._doc.channel));
                    sequence.append(new ChangeNoteAdded(this._doc, usedPatterns[i], latestNote, usedPatterns[i].notes.length));
                }
                else if (latestPart == currentPart) {
                    sanitizeInterval(this._doc, prevPart, currentPart, usedPatterns[i], modNoteIndex, sequence);
                    sanitizeInterval(this._doc, currentPart, endPart, usedPatterns[i], modNoteIndex, sequence);
                    latestPin.size = applyValues[applyIndex];
                    if (continuous) {
                        for (let usePin = 0; usePin < latestNote.pins.length; usePin++) {
                            if (latestNote.pins[usePin].time >= prevPart && latestNote.pins[usePin].time <= currentPart)
                                latestNote.pins[usePin].size = applyValues[applyIndex];
                        }
                    }
                    if (prevNote != null && prevNote.pins.length >= 2) {
                        if (prevNote.end == currentPart) {
                            prevNote.pins[prevNote.pins.length - 1].size = applyValues[applyIndex];
                            if (continuous) {
                                for (let usePin = 0; usePin < prevNote.pins.length; usePin++) {
                                    if (prevNote.pins[usePin].time + prevNote.start >= prevPart)
                                        prevNote.pins[usePin].size = applyValues[applyIndex];
                                }
                            }
                        }
                        else if (prevNote.end == prevPart && latestNote.start == currentPart) {
                            prevNote.pins.push(makeNotePin(0, currentPart - prevNote.start, applyValues[applyIndex]));
                            prevNote.end = currentPart;
                        }
                    }
                }
                else if (currentPart - latestPart < 8 && latestNote.pins[latestPinIdx].size == applyValues[applyIndex]) {
                    if (continuous) {
                        for (let usePin = 0; usePin < latestNote.pins.length; usePin++) {
                            if (latestNote.pins[usePin].time >= prevPart && latestNote.pins[usePin].time <= currentPart)
                                latestNote.pins[usePin].size = applyValues[applyIndex];
                        }
                    }
                }
                else {
                    if (latestNote.pins.length - 1 > latestPinIdx) {
                        sanitizeInterval(this._doc, prevPart, currentPart, usedPatterns[i], modNoteIndex, sequence);
                        sanitizeInterval(this._doc, currentPart, endPart, usedPatterns[i], modNoteIndex, sequence);
                        let k;
                        let usePin = null;
                        for (k = 0; k < latestNote.pins.length; k++) {
                            if (latestNote.pins[k].time == currentPart - latestNote.start) {
                                usePin = latestNote.pins[k];
                                break;
                            }
                            else if (latestNote.pins[k].time > currentPart - latestNote.start)
                                break;
                        }
                        if (usePin != null)
                            usePin.size = applyValues[applyIndex];
                        else
                            latestNote.pins.splice(k, 0, makeNotePin(0, currentPart - latestNote.start, applyValues[applyIndex]));
                    }
                    else {
                        sanitizeInterval(this._doc, prevPart, currentPart, usedPatterns[i], modNoteIndex, sequence);
                        sanitizeInterval(this._doc, currentPart, endPart, usedPatterns[i], modNoteIndex, sequence);
                        latestNote.pins.push(makeNotePin(0, currentPart - latestNote.start, applyValues[applyIndex]));
                        latestNote.end = currentPart;
                    }
                    if (continuous) {
                        for (let usePin = 0; usePin < latestNote.pins.length; usePin++) {
                            if (latestNote.pins[usePin].time >= prevPart && latestNote.pins[usePin].time <= currentPart)
                                latestNote.pins[usePin].size = applyValues[applyIndex];
                        }
                    }
                }
                let lastNoteEnds = [-1, -1, -1, -1, -1, -1];
                usedPatterns[i].notes.sort(function (a, b) { return (a.start == b.start) ? a.pitches[0] - b.pitches[0] : a.start - b.start; });
                for (let checkIndex = 0; checkIndex < usedPatterns[i].notes.length; checkIndex++) {
                    const note = usedPatterns[i].notes[checkIndex];
                    if (note.start < lastNoteEnds[note.pitches[0]])
                        throw new Error("Error in mod note recording!");
                    lastNoteEnds[note.pitches[0]] = note.end;
                    if (note.pins.length < 2 || note.pins[0].time > 0 || note.start == note.end
                        || note.pins[note.pins.length - 1].time != note.end - note.start) {
                        throw new Error("Error in mod note recording!");
                    }
                    let latestPinTime = -1;
                    for (let k = 0; k < note.pins.length; k++) {
                        if (note.pins[k].time <= latestPinTime) {
                            throw new Error("Error in mod note recording!");
                        }
                        latestPinTime = note.pins[k].time;
                    }
                }
            }
        }
        if (this._doc.channel >= this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount) {
            this._doc.currentPatternIsDirty = true;
        }
        if (applyValues.length > 0) {
            this._doc.continuingModRecordingChange = new ChangeHoldingModRecording(this._doc, change, applyValues, slider);
        }
        return changedPatterns;
    }
    stopEditingModLabel(discardChanges) {
        if (this.editingModLabel) {
            this.editingModLabel = false;
            this.modDragValueLabel.style.setProperty("pointer-events", "none");
            if (window.getSelection) {
                let sel = window.getSelection();
                if (sel != null)
                    sel.removeAllRanges();
            }
            if (discardChanges) {
                this._modDragPin.size = this._modDragStartValue;
                let presValue = this._modDragStartValue + Config.modulators[this._modDragSetting].convertRealFactor;
                let xOffset = (+(presValue >= 10.0)) + (+(presValue >= 100.0)) + (+(presValue < 0.0)) + (+(presValue <= -10.0));
                this._modDragValueLabelLeft = +prettyNumber(Math.max(Math.min(this._editorWidth - 10 - xOffset * 8, this._partWidth * (this._modDragNote.start + this._modDragPin.time) - 4 - xOffset * 4), 2));
                this.modDragValueLabel.style.setProperty("left", "" + this._modDragValueLabelLeft + "px");
                const sequence = new ChangeSequence();
                this._dragChange = sequence;
                this._doc.setProspectiveChange(this._dragChange);
                sequence.append(new ChangeSizeBend(this._doc, this._modDragNote, this._modDragPin.time, this._modDragStartValue, this._modDragPin.interval, this.shiftMode));
                this._dragChange = null;
            }
            const continuousState = this._doc.lastChangeWas(this._dragChange);
            if (continuousState) {
                if (this._dragChange != null) {
                    this._doc.record(this._dragChange);
                    this._dragChange = null;
                }
            }
        }
    }
    _whenCursorPressed() {
        if (this._doc.song.getChannelIsMod(this._doc.channel) && this.modDragValueLabel.style.getPropertyValue("display") != "none" &&
            this._mouseX > +this._modDragValueLabelLeft - 6 &&
            this._mouseX < +this._modDragValueLabelLeft + this._modDragValueLabelWidth + 6 &&
            this._mouseY > +this._modDragValueLabelTop - 8 &&
            this._mouseY < +this._modDragValueLabelTop + 11) {
            this.modDragValueLabel.style.setProperty("pointer-events", "fill");
            this.modDragValueLabel.setAttribute("contenteditable", "true");
            if (window.getSelection) {
                let sel = window.getSelection();
                if (sel != null)
                    sel.selectAllChildren(this.modDragValueLabel);
            }
            window.setTimeout(() => { this.modDragValueLabel.focus(); });
            this.editingModLabel = true;
        }
        else {
            this.stopEditingModLabel(false);
            if (this._doc.prefs.enableNotePreview)
                this._doc.synth.maintainLiveInput();
            this._mouseDown = true;
            this._mouseXStart = this._mouseX;
            this._mouseYStart = this._mouseY;
            this._updateCursorStatus();
            this._updatePreview();
            const sequence = new ChangeSequence();
            this._dragChange = sequence;
            this._lastChangeWasPatternSelection = this._doc.lastChangeWas(this._changePatternSelection);
            this._doc.setProspectiveChange(this._dragChange);
            if (this._cursorAtStartOfSelection()) {
                this._draggingStartOfSelection = true;
            }
            else if (this._cursorAtEndOfSelection()) {
                this._draggingEndOfSelection = true;
            }
            else if (this._shiftHeld) {
                if ((this._doc.selection.patternSelectionActive && this._cursor.pitchIndex == -1) || this._cursorIsInSelection()) {
                    sequence.append(new ChangePatternSelection(this._doc, 0, 0));
                }
                else {
                    if (this._cursor.curNote != null) {
                        sequence.append(new ChangePatternSelection(this._doc, this._cursor.curNote.start, this._cursor.curNote.end));
                    }
                    else {
                        const start = Math.max(0, Math.min((this._doc.song.beatsPerBar - 1) * Config.partsPerBeat, Math.floor(this._cursor.exactPart / Config.partsPerBeat) * Config.partsPerBeat));
                        const end = start + Config.partsPerBeat;
                        sequence.append(new ChangePatternSelection(this._doc, start, end));
                    }
                }
            }
            else if (this._cursorIsInSelection()) {
                this._draggingSelectionContents = true;
            }
            else if (this._cursor.valid && this._cursor.curNote == null) {
                sequence.append(new ChangePatternSelection(this._doc, 0, 0));
                const note = new Note(this._cursor.pitch, this._cursor.start, this._cursor.end, Config.noteSizeMax, this._doc.song.getChannelIsNoise(this._doc.channel));
                note.pins = [];
                for (const oldPin of this._cursor.pins) {
                    note.pins.push(makeNotePin(0, oldPin.time, oldPin.size));
                }
                sequence.append(new ChangeEnsurePatternExists(this._doc, this._doc.channel, this._doc.bar));
                const pattern = this._doc.getCurrentPattern(this._barOffset);
                if (pattern == null)
                    throw new Error();
                sequence.append(new ChangeNoteAdded(this._doc, pattern, note, this._cursor.curIndex));
                if (this._doc.prefs.enableNotePreview && !this._doc.synth.playing) {
                    const duration = Math.min(Config.partsPerBeat, this._cursor.end - this._cursor.start);
                    this._doc.performance.setTemporaryPitches([this._cursor.pitch], duration);
                }
            }
            this._updateSelection();
        }
    }
    _whenCursorMoved() {
        if (this._doc.prefs.enableNotePreview && this._mouseOver)
            this._doc.synth.maintainLiveInput();
        const continuousState = this._doc.lastChangeWas(this._dragChange);
        if (!this._mouseDragging && this._mouseDown && this._cursor.valid && continuousState) {
            const dx = this._mouseX - this._mouseXStart;
            const dy = this._mouseY - this._mouseYStart;
            if (Math.sqrt(dx * dx + dy * dy) > 5) {
                this._mouseDragging = true;
                this._mouseHorizontal = Math.abs(dx) >= Math.abs(dy);
            }
        }
        if (this._shiftHeld && this._mouseHorizontal && Math.abs(this._mouseXStart - this._mouseX) > 5) {
            this._dragConfirmed = true;
        }
        if (this._mouseDragging && this._mouseDown && this._cursor.valid && continuousState) {
            this._dragChange.undo();
            const sequence = new ChangeSequence();
            this._dragChange = sequence;
            this._doc.setProspectiveChange(this._dragChange);
            const minDivision = this._getMinDivision();
            const currentPart = this._snapToMinDivision(this._mouseX / this._partWidth);
            if (this._draggingStartOfSelection) {
                sequence.append(new ChangePatternSelection(this._doc, Math.max(0, Math.min(this._doc.song.beatsPerBar * Config.partsPerBeat, currentPart)), this._doc.selection.patternSelectionEnd));
                this._updateSelection();
            }
            else if (this._draggingEndOfSelection) {
                sequence.append(new ChangePatternSelection(this._doc, this._doc.selection.patternSelectionStart, Math.max(0, Math.min(this._doc.song.beatsPerBar * Config.partsPerBeat, currentPart))));
                this._updateSelection();
            }
            else if (this._draggingSelectionContents) {
                const pattern = this._doc.getCurrentPattern(this._barOffset);
                if (this._mouseDragging && pattern != null) {
                    this._dragChange.undo();
                    const sequence = new ChangeSequence();
                    this._dragChange = sequence;
                    this._doc.setProspectiveChange(this._dragChange);
                    const notesInScale = Config.scales[this._doc.song.scale].flags.filter(x => x).length;
                    const pitchRatio = this._doc.song.getChannelIsNoise(this._doc.channel) ? 1 : 12 / notesInScale;
                    const draggedParts = Math.round((this._mouseX - this._mouseXStart) / (this._partWidth * minDivision)) * minDivision;
                    const draggedTranspose = Math.round((this._mouseYStart - this._mouseY) / (this._pitchHeight * pitchRatio));
                    sequence.append(new ChangeDragSelectedNotes(this._doc, this._doc.channel, pattern, draggedParts, draggedTranspose));
                }
            }
            else if (this._shiftHeld && this._dragConfirmed) {
                if (this._mouseDragging) {
                    let start = Math.max(0, Math.min((this._doc.song.beatsPerBar - 1) * Config.partsPerBeat, Math.floor(this._cursor.exactPart / Config.partsPerBeat) * Config.partsPerBeat));
                    let end = start + Config.partsPerBeat;
                    if (this._cursor.curNote != null) {
                        start = Math.max(start, this._cursor.curNote.start);
                        end = Math.min(end, this._cursor.curNote.end);
                    }
                    if (currentPart < start) {
                        start = 0;
                        const pattern = this._doc.getCurrentPattern(this._barOffset);
                        if (pattern != null) {
                            for (let i = 0; i < pattern.notes.length; i++) {
                                if (pattern.notes[i].start <= currentPart) {
                                    start = pattern.notes[i].start;
                                }
                                if (pattern.notes[i].end <= currentPart) {
                                    start = pattern.notes[i].end;
                                }
                            }
                        }
                        for (let beat = 0; beat <= this._doc.song.beatsPerBar; beat++) {
                            const part = beat * Config.partsPerBeat;
                            if (start <= part && part <= currentPart) {
                                start = part;
                            }
                        }
                    }
                    if (currentPart > end) {
                        end = Config.partsPerBeat * this._doc.song.beatsPerBar;
                        const pattern = this._doc.getCurrentPattern(this._barOffset);
                        if (pattern != null) {
                            for (let i = 0; i < pattern.notes.length; i++) {
                                if (pattern.notes[i].start >= currentPart) {
                                    end = pattern.notes[i].start;
                                    break;
                                }
                                if (pattern.notes[i].end >= currentPart) {
                                    end = pattern.notes[i].end;
                                    break;
                                }
                            }
                        }
                        for (let beat = 0; beat <= this._doc.song.beatsPerBar; beat++) {
                            const part = beat * Config.partsPerBeat;
                            if (currentPart < part && part < end) {
                                end = part;
                            }
                        }
                    }
                    sequence.append(new ChangePatternSelection(this._doc, start, end));
                    this._updateSelection();
                }
            }
            else {
                if (this._cursor.curNote == null) {
                    sequence.append(new ChangePatternSelection(this._doc, 0, 0));
                    let backwards;
                    let directLength;
                    if (currentPart < this._cursor.start) {
                        backwards = true;
                        directLength = this._cursor.start - currentPart;
                    }
                    else {
                        backwards = false;
                        directLength = currentPart - this._cursor.start + minDivision;
                    }
                    let defaultLength = minDivision;
                    for (let i = minDivision; i <= this._doc.song.beatsPerBar * Config.partsPerBeat; i += minDivision) {
                        if (minDivision == 1) {
                            if (i < 5) {
                            }
                            else if (i <= Config.partsPerBeat / 2.0) {
                                if (i % 3 != 0 && i % 4 != 0) {
                                    continue;
                                }
                            }
                            else if (i <= Config.partsPerBeat * 1.5) {
                                if (i % 6 != 0 && i % 8 != 0) {
                                    continue;
                                }
                            }
                            else if (i % Config.partsPerBeat != 0) {
                                continue;
                            }
                        }
                        else {
                            if (i >= 5 * minDivision &&
                                i % Config.partsPerBeat != 0 &&
                                i != Config.partsPerBeat * 3.0 / 4.0 &&
                                i != Config.partsPerBeat * 3.0 / 2.0 &&
                                i != Config.partsPerBeat * 4.0 / 3.0) {
                                continue;
                            }
                        }
                        const blessedLength = i;
                        if (blessedLength == directLength) {
                            defaultLength = blessedLength;
                            break;
                        }
                        if (blessedLength < directLength) {
                            defaultLength = blessedLength;
                        }
                        if (blessedLength > directLength) {
                            if (defaultLength < directLength - minDivision) {
                                defaultLength = blessedLength;
                            }
                            break;
                        }
                    }
                    let start;
                    let end;
                    if (backwards) {
                        end = this._cursor.start;
                        start = end - defaultLength;
                    }
                    else {
                        start = this._cursor.start;
                        end = start + defaultLength;
                    }
                    const continuesLastPattern = (start < 0 && this._doc.channel < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount);
                    if (start < 0)
                        start = 0;
                    if (end > this._doc.song.beatsPerBar * Config.partsPerBeat)
                        end = this._doc.song.beatsPerBar * Config.partsPerBeat;
                    if (start < end) {
                        sequence.append(new ChangeEnsurePatternExists(this._doc, this._doc.channel, this._doc.bar));
                        const pattern = this._doc.getCurrentPattern(this._barOffset);
                        if (pattern == null)
                            throw new Error();
                        sequence.append(new ChangeNoteTruncate(this._doc, pattern, start, end, new Note(this._cursor.pitch, 0, 0, 0)));
                        let i;
                        for (i = 0; i < pattern.notes.length; i++) {
                            if (pattern.notes[i].start >= end)
                                break;
                        }
                        const theNote = new Note(this._cursor.pitch, start, end, this._doc.song.getNewNoteVolume(this._doc.song.getChannelIsMod(this._doc.channel), this._doc.channel, this._doc.getCurrentInstrument(this._barOffset), this._cursor.pitch), this._doc.song.getChannelIsNoise(this._doc.channel));
                        theNote.continuesLastPattern = continuesLastPattern;
                        sequence.append(new ChangeNoteAdded(this._doc, pattern, theNote, i));
                        this._copyPins(theNote);
                        this._dragTime = backwards ? start : end;
                        this._dragPitch = this._cursor.pitch;
                        this._dragSize = theNote.pins[backwards ? 0 : 1].size;
                        this._dragVisible = true;
                    }
                    let prevPattern = this._pattern;
                    this._pattern = this._doc.getCurrentPattern(this._barOffset);
                    if (this._pattern != null && this._doc.song.getChannelIsMod(this._doc.channel) && this._interactive && prevPattern != this._pattern) {
                        this._pattern.notes.sort(function (a, b) { return (a.start == b.start) ? a.pitches[0] - b.pitches[0] : a.start - b.start; });
                    }
                }
                else if (this._mouseHorizontal) {
                    sequence.append(new ChangePatternSelection(this._doc, 0, 0));
                    const shift = (this._mouseX - this._mouseXStart) / this._partWidth;
                    const shiftedPin = this._cursor.curNote.pins[this._cursor.nearPinIndex];
                    let shiftedTime = Math.round((this._cursor.curNote.start + shiftedPin.time + shift) / minDivision) * minDivision;
                    const continuesLastPattern = (shiftedTime < 0.0 && this._doc.channel < this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount);
                    if (shiftedTime < 0)
                        shiftedTime = 0;
                    if (shiftedTime > this._doc.song.beatsPerBar * Config.partsPerBeat)
                        shiftedTime = this._doc.song.beatsPerBar * Config.partsPerBeat;
                    if (this._pattern == null)
                        throw new Error();
                    if (shiftedTime <= this._cursor.curNote.start && this._cursor.nearPinIndex == this._cursor.curNote.pins.length - 1 ||
                        shiftedTime >= this._cursor.curNote.end && this._cursor.nearPinIndex == 0) {
                        sequence.append(new ChangeNoteAdded(this._doc, this._pattern, this._cursor.curNote, this._cursor.curIndex, true));
                        this._dragVisible = false;
                    }
                    else {
                        const start = Math.min(this._cursor.curNote.start, shiftedTime);
                        const end = Math.max(this._cursor.curNote.end, shiftedTime);
                        this._dragTime = shiftedTime;
                        this._dragPitch = this._cursor.curNote.pitches[this._cursor.pitchIndex == -1 ? 0 : this._cursor.pitchIndex] + this._cursor.curNote.pins[this._cursor.nearPinIndex].interval;
                        this._dragSize = this._cursor.curNote.pins[this._cursor.nearPinIndex].size;
                        this._dragVisible = true;
                        sequence.append(new ChangeNoteTruncate(this._doc, this._pattern, start, end, this._cursor.curNote));
                        sequence.append(new ChangePinTime(this._doc, this._cursor.curNote, this._cursor.nearPinIndex, shiftedTime, continuesLastPattern));
                        this._copyPins(this._cursor.curNote);
                    }
                }
                else if (this._cursor.pitchIndex == -1 || this._doc.song.getChannelIsMod(this._doc.channel)) {
                    if (!this._mouseDragging)
                        sequence.append(new ChangePatternSelection(this._doc, 0, 0));
                    const bendPart = Math.max(this._cursor.curNote.start, Math.min(this._cursor.curNote.end, Math.round(this._mouseX / (this._partWidth * minDivision)) * minDivision)) - this._cursor.curNote.start;
                    let prevPin;
                    let nextPin = this._cursor.curNote.pins[0];
                    let bendSize = 0;
                    let bendInterval = 0;
                    let cap = this._doc.song.getVolumeCap(this._doc.song.getChannelIsMod(this._doc.channel), this._doc.channel, this._doc.getCurrentInstrument(this._barOffset), this._cursor.pitch);
                    let dragFactorSlow = 25.0 / Math.pow(cap, 0.4);
                    let dragFactorFast = 22.0 / Math.pow(cap, 0.5);
                    let dragSign = (this._mouseYStart > this._mouseY ? 1 : -1);
                    let dragCounts = Math.min(Math.abs(this._mouseYStart - this._mouseY) / dragFactorSlow, 8) + Math.max(0, Math.abs(this._mouseYStart - this._mouseY) / dragFactorFast - 8);
                    if (dragCounts > 0) {
                        this._shiftHeld = false;
                    }
                    for (let i = 1; i < this._cursor.curNote.pins.length; i++) {
                        prevPin = nextPin;
                        nextPin = this._cursor.curNote.pins[i];
                        if (bendPart > nextPin.time)
                            continue;
                        if (bendPart < prevPin.time)
                            throw new Error();
                        const sizeRatio = (bendPart - prevPin.time) / (nextPin.time - prevPin.time);
                        bendSize = Math.round(prevPin.size * (1.0 - sizeRatio) + nextPin.size * sizeRatio + dragSign * dragCounts);
                        if (!this.controlMode && !this._doc.prefs.alwaysFineNoteVol && !this._doc.song.getChannelIsMod(this._doc.channel)) {
                            bendSize = Math.floor(bendSize / 2) * 2;
                        }
                        if (bendSize < 0)
                            bendSize = 0;
                        if (bendSize > cap)
                            bendSize = cap;
                        bendInterval = this._snapToPitch(prevPin.interval * (1.0 - sizeRatio) + nextPin.interval * sizeRatio + this._cursor.curNote.pitches[0], 0, this._getMaxPitch()) - this._cursor.curNote.pitches[0];
                        break;
                    }
                    if (this._doc.song.getChannelIsMod(this._doc.channel) && this.controlMode) {
                        if (bendPart >= this._cursor.curNote.pins[this._cursor.curNote.pins.length - 1].time) {
                            if (this._cursor.curNote.start + this._cursor.curNote.pins[this._cursor.curNote.pins.length - 1].time < this._doc.song.beatsPerBar * Config.partsPerBeat) {
                                for (const note of this._pattern.notes) {
                                    if (note.start == this._cursor.curNote.start + this._cursor.curNote.pins[this._cursor.curNote.pins.length - 1].time && note.pitches[0] == this._cursor.curNote.pitches[0]) {
                                        sequence.append(new ChangeSizeBend(this._doc, note, note.pins[0].time, bendSize, bendInterval, this.shiftMode));
                                    }
                                }
                            }
                            else {
                                const nextPattern = this._doc.getCurrentPattern(1);
                                if (nextPattern != null && nextPattern.instruments[0] == this._pattern.instruments[0]) {
                                    for (const note of nextPattern.notes) {
                                        if (note.start == 0 && note.pitches[0] == this._cursor.curNote.pitches[0]) {
                                            sequence.append(new ChangeSizeBend(this._doc, note, note.pins[0].time, bendSize, bendInterval, this.shiftMode));
                                        }
                                    }
                                }
                            }
                        }
                        else if (bendPart <= this._cursor.curNote.pins[0].time) {
                            if (this._cursor.curNote.start > 0) {
                                for (const note of this._pattern.notes) {
                                    if (note.end == this._cursor.curNote.start && note.pitches[0] == this._cursor.curNote.pitches[0]) {
                                        sequence.append(new ChangeSizeBend(this._doc, note, note.pins[note.pins.length - 1].time, bendSize, bendInterval, this.shiftMode));
                                    }
                                }
                            }
                            else {
                                const prevPattern = this._doc.getCurrentPattern(-1);
                                if (prevPattern != null && prevPattern.instruments[0] == this._pattern.instruments[0]) {
                                    for (const note of prevPattern.notes) {
                                        if (note.end == this._doc.song.beatsPerBar * Config.partsPerBeat && note.pitches[0] == this._cursor.curNote.pitches[0]) {
                                            sequence.append(new ChangeSizeBend(this._doc, note, note.pins[note.pins.length - 1].time, bendSize, bendInterval, this.shiftMode));
                                        }
                                    }
                                }
                            }
                        }
                    }
                    this._dragTime = this._cursor.curNote.start + bendPart;
                    this._dragPitch = this._cursor.curNote.pitches[this._cursor.pitchIndex == -1 ? 0 : this._cursor.pitchIndex] + bendInterval;
                    this._dragSize = bendSize;
                    this._dragVisible = true;
                    sequence.append(new ChangeSizeBend(this._doc, this._cursor.curNote, bendPart, bendSize, bendInterval, this.shiftMode));
                    this._copyPins(this._cursor.curNote);
                }
                else {
                    sequence.append(new ChangePatternSelection(this._doc, 0, 0));
                    this._dragSize = this._cursor.curNote.pins[this._cursor.nearPinIndex].size;
                    if (this._pattern == null)
                        throw new Error();
                    let bendStart;
                    let bendEnd;
                    if (this._mouseX >= this._mouseXStart) {
                        bendStart = Math.max(this._cursor.curNote.start, this._cursor.part);
                        bendEnd = currentPart + minDivision;
                    }
                    else {
                        bendStart = Math.min(this._cursor.curNote.end, this._cursor.part + minDivision);
                        bendEnd = currentPart;
                    }
                    if (bendEnd < 0)
                        bendEnd = 0;
                    if (bendEnd > this._doc.song.beatsPerBar * Config.partsPerBeat)
                        bendEnd = this._doc.song.beatsPerBar * Config.partsPerBeat;
                    if (bendEnd > this._cursor.curNote.end) {
                        sequence.append(new ChangeNoteTruncate(this._doc, this._pattern, this._cursor.curNote.start, bendEnd, this._cursor.curNote));
                    }
                    if (bendEnd < this._cursor.curNote.start) {
                        sequence.append(new ChangeNoteTruncate(this._doc, this._pattern, bendEnd, this._cursor.curNote.end, this._cursor.curNote));
                    }
                    let minPitch = Number.MAX_VALUE;
                    let maxPitch = -Number.MAX_VALUE;
                    for (const pitch of this._cursor.curNote.pitches) {
                        if (minPitch > pitch)
                            minPitch = pitch;
                        if (maxPitch < pitch)
                            maxPitch = pitch;
                    }
                    minPitch -= this._cursor.curNote.pitches[this._cursor.pitchIndex];
                    maxPitch -= this._cursor.curNote.pitches[this._cursor.pitchIndex];
                    if (!this._doc.song.getChannelIsMod(this._doc.channel)) {
                        const bendTo = this._snapToPitch(this._findMousePitch(this._mouseY), -minPitch, this._getMaxPitch() - maxPitch);
                        sequence.append(new ChangePitchBend(this._doc, this._cursor.curNote, bendStart, bendEnd, bendTo, this._cursor.pitchIndex));
                        this._dragPitch = bendTo;
                    }
                    else {
                        const bendTo = this._snapToPitch(this._dragPitch, -minPitch, Config.modCount - 1);
                        sequence.append(new ChangePitchBend(this._doc, this._cursor.curNote, bendStart, bendEnd, bendTo, this._cursor.pitchIndex));
                        this._dragPitch = bendTo;
                    }
                    this._copyPins(this._cursor.curNote);
                    this._dragTime = bendEnd;
                    this._dragVisible = true;
                }
            }
        }
        if (!(this._mouseDown && this._cursor.valid && continuousState)) {
            this._updateCursorStatus();
            this._updatePreview();
        }
    }
    _setPatternSelection(change) {
        this._changePatternSelection = change;
        this._doc.record(this._changePatternSelection, this._lastChangeWasPatternSelection);
    }
    _updatePreview() {
        if (this._usingTouch) {
            if (!this._mouseDown || !this._cursor.valid || !this._mouseDragging || !this._dragVisible || this._shiftHeld || this._draggingStartOfSelection || this._draggingEndOfSelection || this._draggingSelectionContents) {
                this._svgPreview.setAttribute("visibility", "hidden");
                if (!this.editingModLabel) {
                    this.modDragValueLabel.style.setProperty("display", "none");
                    this.modDragValueLabel.style.setProperty("pointer-events", "none");
                    this.modDragValueLabel.setAttribute("contenteditable", "false");
                }
            }
            else {
                this._svgPreview.setAttribute("visibility", "visible");
                const x = this._partWidth * this._dragTime;
                const y = this._pitchToPixelHeight(this._dragPitch - this._octaveOffset);
                const radius = (this._pitchHeight - this._pitchBorder) / 2;
                const width = 80;
                const height = 60;
                const cap = this._doc.song.getVolumeCap(this._doc.song.getChannelIsMod(this._doc.channel), this._doc.channel, this._doc.getCurrentInstrument(this._barOffset), this._cursor.pitch);
                let pathString = "";
                pathString += "M " + prettyNumber(x) + " " + prettyNumber(y - radius * (this._dragSize / cap)) + " ";
                pathString += "L " + prettyNumber(x) + " " + prettyNumber(y - radius * (this._dragSize / cap) - height) + " ";
                pathString += "M " + prettyNumber(x) + " " + prettyNumber(y + radius * (this._dragSize / cap)) + " ";
                pathString += "L " + prettyNumber(x) + " " + prettyNumber(y + radius * (this._dragSize / cap) + height) + " ";
                pathString += "M " + prettyNumber(x) + " " + prettyNumber(y - radius * (this._dragSize / cap)) + " ";
                pathString += "L " + prettyNumber(x + width) + " " + prettyNumber(y - radius * (this._dragSize / cap)) + " ";
                pathString += "M " + prettyNumber(x) + " " + prettyNumber(y + radius * (this._dragSize / cap)) + " ";
                pathString += "L " + prettyNumber(x + width) + " " + prettyNumber(y + radius * (this._dragSize / cap)) + " ";
                pathString += "M " + prettyNumber(x) + " " + prettyNumber(y - radius * (this._dragSize / cap)) + " ";
                pathString += "L " + prettyNumber(x - width) + " " + prettyNumber(y - radius * (this._dragSize / cap)) + " ";
                pathString += "M " + prettyNumber(x) + " " + prettyNumber(y + radius * (this._dragSize / cap)) + " ";
                pathString += "L " + prettyNumber(x - width) + " " + prettyNumber(y + radius * (this._dragSize / cap)) + " ";
                this._svgPreview.setAttribute("d", pathString);
            }
        }
        else {
            if (!this._mouseOver || this._mouseDown || !this._cursor.valid) {
                this._svgPreview.setAttribute("visibility", "hidden");
                if (!this.editingModLabel) {
                    this.modDragValueLabel.style.setProperty("display", "none");
                    this.modDragValueLabel.style.setProperty("pointer-events", "none");
                    this.modDragValueLabel.setAttribute("contenteditable", "false");
                }
            }
            else {
                this._svgPreview.setAttribute("visibility", "visible");
                if (this._cursorAtStartOfSelection()) {
                    const center = this._partWidth * this._doc.selection.patternSelectionStart;
                    const left = prettyNumber(center - 4);
                    const right = prettyNumber(center + 4);
                    const bottom = this._pitchToPixelHeight(-0.5);
                    this._svgPreview.setAttribute("d", "M " + left + " 0 L " + left + " " + bottom + " L " + right + " " + bottom + " L " + right + " 0 z");
                }
                else if (this._cursorAtEndOfSelection()) {
                    const center = this._partWidth * this._doc.selection.patternSelectionEnd;
                    const left = prettyNumber(center - 4);
                    const right = prettyNumber(center + 4);
                    const bottom = this._pitchToPixelHeight(-0.5);
                    this._svgPreview.setAttribute("d", "M " + left + " 0 L " + left + " " + bottom + " L " + right + " " + bottom + " L " + right + " 0 z");
                }
                else if (this._cursorIsInSelection()) {
                    const left = prettyNumber(this._partWidth * this._doc.selection.patternSelectionStart - 2);
                    const right = prettyNumber(this._partWidth * this._doc.selection.patternSelectionEnd + 2);
                    const bottom = this._pitchToPixelHeight(-0.5);
                    this._svgPreview.setAttribute("d", "M " + left + " 0 L " + left + " " + bottom + " L " + right + " " + bottom + " L " + right + " 0 z");
                }
                else {
                    this._drawNote(this._svgPreview, this._cursor.pitch, this._cursor.start, this._cursor.pins, (this._pitchHeight - this._pitchBorder) / 2 + 1, true, this._octaveOffset);
                }
            }
        }
    }
    _updateSelection() {
        if (this._doc.selection.patternSelectionActive) {
            this._selectionRect.setAttribute("visibility", "visible");
            this._selectionRect.setAttribute("x", String(this._partWidth * this._doc.selection.patternSelectionStart));
            this._selectionRect.setAttribute("width", String(this._partWidth * (this._doc.selection.patternSelectionEnd - this._doc.selection.patternSelectionStart)));
        }
        else {
            this._selectionRect.setAttribute("visibility", "hidden");
        }
    }
    render() {
        const nextPattern = this._doc.getCurrentPattern(this._barOffset);
        if (this._pattern != nextPattern) {
            if (this._doc.song.getChannelIsMod(this._doc.channel) && this._interactive && nextPattern != null) {
                nextPattern.notes.sort(function (a, b) { return (a.start == b.start) ? a.pitches[0] - b.pitches[0] : a.start - b.start; });
            }
            if (this._pattern != null) {
                this._dragChange = null;
                this._whenCursorReleased(null);
            }
        }
        this._pattern = nextPattern;
        this._editorWidth = this.container.clientWidth;
        this._editorHeight = this.container.clientHeight;
        this._partWidth = this._editorWidth / (this._doc.song.beatsPerBar * Config.partsPerBeat);
        this._octaveOffset = (this._doc.channel >= this._doc.song.pitchChannelCount) ? 0 : this._doc.song.channels[this._doc.channel].octave * Config.pitchesPerOctave;
        if (this._doc.song.getChannelIsNoise(this._doc.channel)) {
            this._pitchBorder = 0;
            this._pitchCount = Config.drumCount;
        }
        else if (this._doc.song.getChannelIsMod(this._doc.channel)) {
            this._pitchBorder = this._defaultModBorder;
            this._pitchCount = Config.modCount;
            if (this._pattern != null) {
                for (const note of this._pattern.notes) {
                    let pitch = note.pitches[0];
                    let maxHeight = this._doc.song.getVolumeCap(true, this._doc.channel, this._doc.getCurrentInstrument(this._barOffset), pitch);
                    let maxFoundHeight = 0;
                    for (const pin of note.pins) {
                        if (pin.size > maxFoundHeight) {
                            maxFoundHeight = pin.size;
                        }
                    }
                    if (maxFoundHeight > maxHeight) {
                        for (const pin of note.pins) {
                            pin.size = Math.round(pin.size * (maxHeight / maxFoundHeight));
                        }
                    }
                }
            }
        }
        else {
            this._pitchBorder = 0;
            this._pitchCount = this._doc.getVisiblePitchCount();
        }
        this._pitchHeight = this._editorHeight / this._pitchCount;
        this._octaveOffset = (this._doc.channel >= this._doc.song.pitchChannelCount) ? 0 : this._doc.getBaseVisibleOctave(this._doc.channel) * Config.pitchesPerOctave;
        if (this._renderedRhythm != this._doc.song.rhythm ||
            this._renderedPitchChannelCount != this._doc.song.pitchChannelCount ||
            this._renderedNoiseChannelCount != this._doc.song.noiseChannelCount ||
            this._renderedModChannelCount != this._doc.song.modChannelCount) {
            this._renderedRhythm = this._doc.song.rhythm;
            this._renderedPitchChannelCount = this._doc.song.pitchChannelCount;
            this._renderedNoiseChannelCount = this._doc.song.noiseChannelCount;
            this._renderedModChannelCount = this._doc.song.modChannelCount;
            this.resetCopiedPins();
        }
        this._copiedPins = this._copiedPinChannels[this._doc.channel];
        if (this._renderedWidth != this._editorWidth || this._renderedHeight != this._editorHeight) {
            this._renderedWidth = this._editorWidth;
            this._renderedHeight = this._editorHeight;
            this._svgBackground.setAttribute("width", "" + this._editorWidth);
            this._svgBackground.setAttribute("height", "" + this._editorHeight);
            this._svgPlayhead.setAttribute("height", "" + this._editorHeight);
            this._selectionRect.setAttribute("y", "0");
            this._selectionRect.setAttribute("height", "" + this._editorHeight);
        }
        const beatWidth = this._editorWidth / this._doc.song.beatsPerBar;
        if (this._renderedBeatWidth != beatWidth || this._renderedPitchHeight != this._pitchHeight) {
            this._renderedBeatWidth = beatWidth;
            this._renderedPitchHeight = this._pitchHeight;
            this._svgNoteBackground.setAttribute("width", "" + beatWidth);
            this._svgNoteBackground.setAttribute("height", "" + (this._pitchHeight * Config.pitchesPerOctave));
            this._svgDrumBackground.setAttribute("width", "" + beatWidth);
            this._svgDrumBackground.setAttribute("height", "" + this._pitchHeight);
            this._svgModBackground.setAttribute("width", "" + beatWidth);
            this._svgModBackground.setAttribute("height", "" + (this._pitchHeight));
            this._svgModBackground.setAttribute("y", "" + (this._pitchBorder / 2));
            this._backgroundDrumRow.setAttribute("width", "" + (beatWidth - 2));
            this._backgroundDrumRow.setAttribute("height", "" + (this._pitchHeight - 2));
            if (this._pitchHeight > this._pitchBorder) {
                this._backgroundModRow.setAttribute("width", "" + (beatWidth - 2));
                this._backgroundModRow.setAttribute("height", "" + (this._pitchHeight - this._pitchBorder));
            }
            for (let j = 0; j < Config.pitchesPerOctave; j++) {
                const rectangle = this._backgroundPitchRows[j];
                const y = (Config.pitchesPerOctave - j) % Config.pitchesPerOctave;
                rectangle.setAttribute("width", "" + (beatWidth - 2));
                rectangle.setAttribute("y", "" + (y * this._pitchHeight + 1));
                rectangle.setAttribute("height", "" + (this._pitchHeight - 2));
            }
        }
        if (this._interactive) {
            if (!this._mouseDown)
                this._updateCursorStatus();
            this._updatePreview();
            this._updateSelection();
        }
        if (this._renderedFifths != this._doc.prefs.showFifth) {
            this._renderedFifths = this._doc.prefs.showFifth;
            this._backgroundPitchRows[7].setAttribute("fill", this._doc.prefs.showFifth ? ColorConfig.fifthNote : ColorConfig.pitchBackground);
        }
        for (let j = 0; j < Config.pitchesPerOctave; j++) {
            this._backgroundPitchRows[j].style.visibility = Config.scales[this._doc.song.scale].flags[j] ? "visible" : "hidden";
        }
        if (this._doc.song.getChannelIsNoise(this._doc.channel)) {
            if (!this._renderedDrums) {
                this._renderedDrums = true;
                this._renderedMod = false;
                this._svgBackground.setAttribute("fill", "url(#patternEditorDrumBackground" + this._barOffset + ")");
            }
        }
        else if (this._doc.song.getChannelIsMod(this._doc.channel)) {
            if (!this._renderedMod) {
                this._renderedDrums = false;
                this._renderedMod = true;
                this._svgBackground.setAttribute("fill", "url(#patternEditorModBackground" + this._barOffset + ")");
            }
        }
        else {
            if (this._renderedDrums || this._renderedMod) {
                this._renderedDrums = false;
                this._renderedMod = false;
                this._svgBackground.setAttribute("fill", "url(#patternEditorNoteBackground" + this._barOffset + ")");
            }
        }
        this._redrawNotePatterns();
    }
    _redrawNotePatterns() {
        this._svgNoteContainer = makeEmptyReplacementElement(this._svgNoteContainer);
        if (this._doc.prefs.showChannels) {
            if (!this._doc.song.getChannelIsMod(this._doc.channel)) {
                for (let channel = this._doc.song.pitchChannelCount + this._doc.song.noiseChannelCount - 1; channel >= 0; channel--) {
                    if (channel == this._doc.channel)
                        continue;
                    if (this._doc.song.getChannelIsNoise(channel) != this._doc.song.getChannelIsNoise(this._doc.channel))
                        continue;
                    const pattern2 = this._doc.song.getPattern(channel, this._doc.bar + this._barOffset);
                    if (pattern2 == null)
                        continue;
                    const octaveOffset = this._doc.getBaseVisibleOctave(channel) * Config.pitchesPerOctave;
                    for (const note of pattern2.notes) {
                        for (const pitch of note.pitches) {
                            const notePath = SVG.path();
                            notePath.setAttribute("fill", ColorConfig.getChannelColor(this._doc.song, channel).secondaryNote);
                            notePath.setAttribute("pointer-events", "none");
                            this._drawNote(notePath, pitch, note.start, note.pins, this._pitchHeight * 0.19, false, octaveOffset);
                            this._svgNoteContainer.appendChild(notePath);
                        }
                    }
                }
            }
        }
        if (this._pattern != null) {
            const instrument = this._doc.song.channels[this._doc.channel].instruments[this._doc.getCurrentInstrument(this._barOffset)];
            const chord = instrument.getChord();
            const transition = instrument.getTransition();
            const displayNumberedChords = chord.customInterval || chord.arpeggiates || chord.strumParts > 0 || transition.slides;
            for (const note of this._pattern.notes) {
                let disabled = false;
                if (this._doc.song.getChannelIsMod(this._doc.channel)) {
                    const modIndex = instrument.modulators[Config.modCount - 1 - note.pitches[0]];
                    if ((modIndex == Config.modulators.dictionary["none"].index)
                        || instrument.invalidModulators[Config.modCount - 1 - note.pitches[0]])
                        disabled = true;
                }
                for (let i = 0; i < note.pitches.length; i++) {
                    const pitch = note.pitches[i];
                    let notePath = SVG.path();
                    let colorPrimary = (disabled ? ColorConfig.disabledNotePrimary : ColorConfig.getChannelColor(this._doc.song, this._doc.channel).primaryNote);
                    let colorSecondary = (disabled ? ColorConfig.disabledNoteSecondary : ColorConfig.getChannelColor(this._doc.song, this._doc.channel).secondaryNote);
                    notePath.setAttribute("fill", colorSecondary);
                    notePath.setAttribute("pointer-events", "none");
                    this._drawNote(notePath, pitch, note.start, note.pins, (this._pitchHeight - this._pitchBorder) / 2 + 1, false, this._octaveOffset);
                    this._svgNoteContainer.appendChild(notePath);
                    notePath = SVG.path();
                    notePath.setAttribute("fill", colorPrimary);
                    notePath.setAttribute("pointer-events", "none");
                    this._drawNote(notePath, pitch, note.start, note.pins, (this._pitchHeight - this._pitchBorder) / 2 + 1, true, this._octaveOffset);
                    this._svgNoteContainer.appendChild(notePath);
                    let indicatorOffset = 2;
                    if (note.continuesLastPattern) {
                        const arrowHeight = Math.min(this._pitchHeight, 20);
                        let arrowPath;
                        arrowPath = "M " + prettyNumber(this._partWidth * note.start + indicatorOffset) + " " + prettyNumber(this._pitchToPixelHeight(pitch - this._octaveOffset) - 0.1 * arrowHeight);
                        arrowPath += "L " + prettyNumber(this._partWidth * note.start + indicatorOffset) + " " + prettyNumber(this._pitchToPixelHeight(pitch - this._octaveOffset) + 0.1 * arrowHeight);
                        arrowPath += "L " + prettyNumber(this._partWidth * note.start + indicatorOffset + 4) + " " + prettyNumber(this._pitchToPixelHeight(pitch - this._octaveOffset) + 0.1 * arrowHeight);
                        arrowPath += "L " + prettyNumber(this._partWidth * note.start + indicatorOffset + 4) + " " + prettyNumber(this._pitchToPixelHeight(pitch - this._octaveOffset) + 0.3 * arrowHeight);
                        arrowPath += "L " + prettyNumber(this._partWidth * note.start + indicatorOffset + 12) + " " + prettyNumber(this._pitchToPixelHeight(pitch - this._octaveOffset));
                        arrowPath += "L " + prettyNumber(this._partWidth * note.start + indicatorOffset + 4) + " " + prettyNumber(this._pitchToPixelHeight(pitch - this._octaveOffset) - 0.3 * arrowHeight);
                        arrowPath += "L " + prettyNumber(this._partWidth * note.start + indicatorOffset + 4) + " " + prettyNumber(this._pitchToPixelHeight(pitch - this._octaveOffset) - 0.1 * arrowHeight);
                        const arrow = SVG.path();
                        arrow.setAttribute("d", arrowPath);
                        arrow.setAttribute("fill", ColorConfig.invertedText);
                        this._svgNoteContainer.appendChild(arrow);
                        indicatorOffset += 12;
                    }
                    if (note.pitches.length > 1) {
                        if (displayNumberedChords) {
                            const oscillatorLabel = SVG.text();
                            oscillatorLabel.setAttribute("x", "" + prettyNumber(this._partWidth * note.start + indicatorOffset));
                            oscillatorLabel.setAttribute("y", "" + prettyNumber(this._pitchToPixelHeight(pitch - this._octaveOffset)));
                            oscillatorLabel.setAttribute("width", "30");
                            oscillatorLabel.setAttribute("fill", ColorConfig.invertedText);
                            oscillatorLabel.setAttribute("text-anchor", "start");
                            oscillatorLabel.setAttribute("dominant-baseline", "central");
                            oscillatorLabel.setAttribute("pointer-events", "none");
                            oscillatorLabel.textContent = "" + (i + 1);
                            this._svgNoteContainer.appendChild(oscillatorLabel);
                        }
                    }
                }
                if (this._doc.song.getChannelIsMod(this._doc.channel) && this._mouseDragging && !this._mouseHorizontal && note == this._cursor.curNote) {
                    this.modDragValueLabel.style.setProperty("display", "");
                    this.modDragValueLabel.style.setProperty("pointer-events", "none");
                    this.modDragValueLabel.setAttribute("contenteditable", "false");
                    this.modDragValueLabel.style.setProperty("color", "#FFFFFF");
                    let setting = this._doc.song.channels[this._doc.channel].instruments[this._doc.getCurrentInstrument(this._barOffset)].modulators[Config.modCount - 1 - note.pitches[0]];
                    let presValue = this._dragSize + Config.modulators[setting].convertRealFactor;
                    let xOffset = (+(presValue >= 10.0)) + (+(presValue >= 100.0)) + (+(presValue < 0.0)) + (+(presValue <= -10.0));
                    this._modDragValueLabelWidth = 8 + xOffset * 8;
                    this._modDragValueLabelLeft = +prettyNumber(Math.max(Math.min(this._editorWidth - 10 - xOffset * 8, this._partWidth * this._dragTime - 4 - xOffset * 4), 2));
                    this._modDragValueLabelTop = +prettyNumber(this._pitchToPixelHeight(note.pitches[0] - this._octaveOffset) - 17 - (this._pitchHeight - this._pitchBorder) / 2);
                    this.modDragValueLabel.style.setProperty("left", "" + this._modDragValueLabelLeft + "px");
                    this.modDragValueLabel.style.setProperty("top", "" + this._modDragValueLabelTop + "px");
                    this.modDragValueLabel.textContent = "" + presValue;
                }
            }
        }
        this._doc.currentPatternIsDirty = false;
    }
    _drawNote(svgElement, pitch, start, pins, radius, showSize, offset) {
        const totalWidth = this._partWidth * (pins[pins.length - 1].time + pins[0].time);
        const endOffset = 0.5 * Math.min(2, totalWidth - 1);
        let nextPin = pins[0];
        const cap = this._doc.song.getVolumeCap(this._doc.song.getChannelIsMod(this._doc.channel), this._doc.channel, this._doc.getCurrentInstrument(this._barOffset), pitch);
        let pathString = "M " + prettyNumber(this._partWidth * (start + nextPin.time) + endOffset) + " " + prettyNumber(this._pitchToPixelHeight(pitch - offset) + radius * (showSize ? nextPin.size / cap : 1.0)) + " ";
        for (let i = 1; i < pins.length; i++) {
            let prevPin = nextPin;
            nextPin = pins[i];
            let prevSide = this._partWidth * (start + prevPin.time) + (i == 1 ? endOffset : 0);
            let nextSide = this._partWidth * (start + nextPin.time) - (i == pins.length - 1 ? endOffset : 0);
            let prevHeight = this._pitchToPixelHeight(pitch + prevPin.interval - offset);
            let nextHeight = this._pitchToPixelHeight(pitch + nextPin.interval - offset);
            let prevSize = showSize ? prevPin.size / cap : 1.0;
            let nextSize = showSize ? nextPin.size / cap : 1.0;
            pathString += "L " + prettyNumber(prevSide) + " " + prettyNumber(prevHeight - radius * prevSize) + " ";
            if (prevPin.interval > nextPin.interval)
                pathString += "L " + prettyNumber(prevSide + 1) + " " + prettyNumber(prevHeight - radius * prevSize) + " ";
            if (prevPin.interval < nextPin.interval)
                pathString += "L " + prettyNumber(nextSide - 1) + " " + prettyNumber(nextHeight - radius * nextSize) + " ";
            pathString += "L " + prettyNumber(nextSide) + " " + prettyNumber(nextHeight - radius * nextSize) + " ";
        }
        for (let i = pins.length - 2; i >= 0; i--) {
            let prevPin = nextPin;
            nextPin = pins[i];
            let prevSide = this._partWidth * (start + prevPin.time) - (i == pins.length - 2 ? endOffset : 0);
            let nextSide = this._partWidth * (start + nextPin.time) + (i == 0 ? endOffset : 0);
            let prevHeight = this._pitchToPixelHeight(pitch + prevPin.interval - offset);
            let nextHeight = this._pitchToPixelHeight(pitch + nextPin.interval - offset);
            let prevSize = showSize ? prevPin.size / cap : 1.0;
            let nextSize = showSize ? nextPin.size / cap : 1.0;
            pathString += "L " + prettyNumber(prevSide) + " " + prettyNumber(prevHeight + radius * prevSize) + " ";
            if (prevPin.interval < nextPin.interval)
                pathString += "L " + prettyNumber(prevSide - 1) + " " + prettyNumber(prevHeight + radius * prevSize) + " ";
            if (prevPin.interval > nextPin.interval)
                pathString += "L " + prettyNumber(nextSide + 1) + " " + prettyNumber(nextHeight + radius * nextSize) + " ";
            pathString += "L " + prettyNumber(nextSide) + " " + prettyNumber(nextHeight + radius * nextSize) + " ";
        }
        pathString += "z";
        svgElement.setAttribute("d", pathString);
    }
    _pitchToPixelHeight(pitch) {
        return this._pitchHeight * (this._pitchCount - (pitch) - 0.5);
    }
}
//# sourceMappingURL=PatternEditor.js.map