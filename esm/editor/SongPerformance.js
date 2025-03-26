import { Config } from "../synth/SynthConfig";
import { Note } from "../synth/synth";
import { ChangeGroup } from "./Change";
import { ChangeChannelBar, ChangePinTime, ChangeEnsurePatternExists, ChangeNoteAdded, ChangeInsertBars, ChangeDeleteBars, ChangeNoteLength } from "./changes";
import { Piano } from "./Piano";
export class SongPerformance {
    constructor(_doc) {
        this._doc = _doc;
        this._channelIsDrum = false;
        this._channelOctave = -1;
        this._songKey = -1;
        this._pitchesAreTemporary = false;
        this._bassPitchesAreTemporary = false;
        this._recentlyAddedPitches = [];
        this._recentlyAddedBassPitches = [];
        this._songLengthWhenRecordingStarted = -1;
        this._playheadPart = -1;
        this._bassPlayheadPart = -1;
        this._playheadPattern = null;
        this._bassPlayheadPattern = null;
        this._pitchesChanged = false;
        this._bassPitchesChanged = false;
        this._lastNote = null;
        this._lastBassNote = null;
        this._recordingChange = null;
        this._onAnimationFrame = () => {
            window.requestAnimationFrame(this._onAnimationFrame);
            if (this._doc.synth.recording) {
                let dirty = this._updateRecordedNotes();
                dirty = this._updateRecordedBassNotes() ? true : dirty;
                if (dirty) {
                    this._doc.notifier.notifyWatchers();
                }
            }
        };
        this._documentChanged = () => {
            const isDrum = this._doc.song.getChannelIsNoise(this._doc.channel);
            const octave = this._doc.song.channels[this._doc.channel].octave;
            if (this._doc.synth.liveInputChannel != this._doc.channel || this._doc.synth.liveBassInputChannel != this._getBassOffsetChannel() || this._channelIsDrum != isDrum || this._channelOctave != octave || this._songKey != this._doc.song.key) {
                this._doc.synth.liveInputChannel = this._doc.channel;
                this._doc.synth.liveBassInputChannel = this._getBassOffsetChannel();
                this._channelIsDrum = isDrum;
                this._channelOctave = octave;
                this._songKey = this._doc.song.key;
                this.clearAllPitches();
                this.clearAllBassPitches();
            }
            this._doc.synth.liveInputInstruments = this._doc.recentPatternInstruments[this._doc.channel];
            this._doc.synth.liveBassInputInstruments = this._doc.recentPatternInstruments[this._doc.synth.liveBassInputChannel];
        };
        this._doc.notifier.watch(this._documentChanged);
        this._documentChanged();
        window.requestAnimationFrame(this._onAnimationFrame);
    }
    play() {
        this._doc.synth.play();
        this._doc.synth.enableMetronome = false;
        this._doc.synth.countInMetronome = false;
        this._doc.synth.maintainLiveInput();
    }
    pause() {
        this.clearAllPitches();
        this.clearAllBassPitches();
        if (this._recordingChange != null) {
            if (this._doc.song.barCount > this._songLengthWhenRecordingStarted && !this._lastBarHasPatterns()) {
                new ChangeDeleteBars(this._doc, this._doc.song.barCount - 1, 1);
                new ChangeChannelBar(this._doc, this._doc.channel, this._doc.song.barCount - 1);
            }
            if (!this._recordingChange.isNoop()) {
                this._doc.record(this._recordingChange);
                this._recordingChange = null;
            }
            this._lastNote = null;
        }
        this._doc.synth.pause();
        this._doc.synth.resetEffects();
        this._doc.synth.enableMetronome = false;
        this._doc.synth.countInMetronome = false;
        if (this._doc.prefs.autoFollow) {
            this._doc.synth.goToBar(this._doc.bar);
        }
        this._doc.synth.snapToBar();
    }
    record() {
        this._doc.synth.snapToBar();
        const playheadBar = Math.floor(this._doc.synth.playhead);
        if (playheadBar != this._doc.bar) {
            new ChangeChannelBar(this._doc, this._doc.channel, playheadBar);
        }
        if (this._pitchesAreTemporary) {
            this.clearAllPitches();
            this._pitchesAreTemporary = false;
        }
        if (this._bassPitchesAreTemporary) {
            this.clearAllBassPitches();
            this._bassPitchesAreTemporary = false;
        }
        this._doc.synth.enableMetronome = this._doc.prefs.metronomeWhileRecording;
        this._doc.synth.countInMetronome = this._doc.prefs.metronomeCountIn;
        this._doc.synth.startRecording();
        this._doc.synth.maintainLiveInput();
        this._songLengthWhenRecordingStarted = this._doc.song.barCount;
        this._playheadPart = this._getCurrentPlayheadPart();
        this._bassPlayheadPart = this._getCurrentPlayheadPart();
        this._playheadPattern = null;
        this._bassPlayheadPattern = null;
        this._pitchesChanged = false;
        this._bassPitchesChanged = false;
        this._lastNote = null;
        this._lastBassNote = null;
        this._recentlyAddedPitches.length = 0;
        this._recentlyAddedBassPitches.length = 0;
        this._recordingChange = new ChangeGroup();
        this._doc.setProspectiveChange(this._recordingChange);
    }
    abortRecording() {
        this._recordingChange = null;
        this.pause();
    }
    pitchesAreTemporary() {
        return this._pitchesAreTemporary;
    }
    bassPitchesAreTemporary() {
        return this._bassPitchesAreTemporary;
    }
    _getBassOffsetChannel() {
        if (this._doc.channel >= this._doc.song.pitchChannelCount)
            return this._doc.channel;
        return Math.max(0, Math.min(this._doc.song.pitchChannelCount - 1, this._doc.channel + this._doc.prefs.bassOffset));
    }
    _getMinDivision() {
        if (this._doc.prefs.snapRecordedNotesToRhythm) {
            return Config.partsPerBeat / Config.rhythms[this._doc.song.rhythm].stepsPerBeat;
        }
        else {
            return 1;
        }
    }
    _getCurrentPlayheadPart() {
        const currentPart = this._doc.synth.playhead * this._doc.song.beatsPerBar * Config.partsPerBeat;
        if (this._doc.prefs.snapRecordedNotesToRhythm) {
            const minDivision = this._getMinDivision();
            return Math.round(currentPart / minDivision) * minDivision;
        }
        return Math.round(currentPart);
    }
    _lastBarHasPatterns() {
        for (let channelIndex = 0; channelIndex < this._doc.song.getChannelCount(); channelIndex++) {
            if (this._doc.song.channels[channelIndex].bars[this._doc.song.barCount - 1] != 0)
                return true;
        }
        return false;
    }
    _updateRecordedNotes() {
        if (this._recordingChange == null)
            return false;
        if (!this._doc.lastChangeWas(this._recordingChange)) {
            this.abortRecording();
            return false;
        }
        if (this._doc.synth.countInMetronome) {
            this._recentlyAddedPitches.length = 0;
            this._pitchesChanged = false;
            return false;
        }
        const partsPerBar = this._doc.song.beatsPerBar * Config.partsPerBeat;
        const oldPart = this._playheadPart % partsPerBar;
        const oldBar = Math.floor(this._playheadPart / partsPerBar);
        const oldPlayheadPart = this._playheadPart;
        this._playheadPart = this._getCurrentPlayheadPart();
        const newPart = this._playheadPart % partsPerBar;
        const newBar = Math.floor(this._playheadPart / partsPerBar);
        if (oldPart == newPart && oldBar == newBar)
            return false;
        if (this._playheadPart < oldPlayheadPart) {
            this._lastNote = null;
            this._playheadPattern = null;
            return false;
        }
        let dirty = false;
        for (let bar = oldBar; bar <= newBar; bar++) {
            if (bar != oldBar) {
                this._playheadPattern = null;
            }
            const startPart = (bar == oldBar) ? oldPart : 0;
            const endPart = (bar == newBar) ? newPart : partsPerBar;
            if (startPart == endPart)
                break;
            if (this._lastNote != null && !this._pitchesChanged && startPart > 0 && this._doc.synth.liveInputPitches.length > 0) {
                this._recordingChange.append(new ChangePinTime(this._doc, this._lastNote, 1, endPart, this._lastNote.continuesLastPattern));
                this._doc.currentPatternIsDirty = true;
            }
            else {
                if (this._lastNote != null) {
                    this._lastNote = null;
                }
                let noteStartPart = startPart;
                let noteEndPart = endPart;
                while (noteStartPart < endPart) {
                    let addedAlreadyReleasedPitch = false;
                    if (this._recentlyAddedPitches.length > 0 || this._doc.synth.liveInputPitches.length > 0) {
                        if (this._playheadPattern == null) {
                            this._doc.selection.erasePatternInBar(this._recordingChange, this._doc.synth.liveInputChannel, bar);
                            this._recordingChange.append(new ChangeEnsurePatternExists(this._doc, this._doc.synth.liveInputChannel, bar));
                            this._playheadPattern = this._doc.song.getPattern(this._doc.synth.liveInputChannel, bar);
                        }
                        if (this._playheadPattern == null)
                            throw new Error();
                        this._lastNote = new Note(-1, noteStartPart, noteEndPart, Config.noteSizeMax, this._doc.song.getChannelIsNoise(this._doc.synth.liveInputChannel));
                        this._lastNote.continuesLastPattern = (noteStartPart == 0 && !this._pitchesChanged);
                        this._lastNote.pitches.length = 0;
                        while (this._recentlyAddedPitches.length > 0) {
                            if (this._lastNote.pitches.length >= Config.maxChordSize)
                                break;
                            const recentPitch = this._recentlyAddedPitches.shift();
                            if (this._doc.synth.liveInputPitches.indexOf(recentPitch) == -1) {
                                this._lastNote.pitches.push(recentPitch);
                                addedAlreadyReleasedPitch = true;
                            }
                        }
                        for (let i = 0; i < this._doc.synth.liveInputPitches.length; i++) {
                            if (this._lastNote.pitches.length >= Config.maxChordSize)
                                break;
                            this._lastNote.pitches.push(this._doc.synth.liveInputPitches[i]);
                        }
                        this._recordingChange.append(new ChangeNoteAdded(this._doc, this._playheadPattern, this._lastNote, this._playheadPattern.notes.length));
                        if (addedAlreadyReleasedPitch) {
                            noteEndPart = noteStartPart + this._getMinDivision();
                            new ChangeNoteLength(this._doc, this._lastNote, this._lastNote.start, noteEndPart);
                            this._lastNote = null;
                        }
                        dirty = true;
                    }
                    this._pitchesChanged = addedAlreadyReleasedPitch;
                    noteStartPart = noteEndPart;
                    noteEndPart = endPart;
                }
            }
            if (bar == this._doc.song.barCount - 1) {
                if (this._lastBarHasPatterns()) {
                    new ChangeInsertBars(this._doc, this._doc.song.barCount, 1);
                    this._doc.bar--;
                    dirty = true;
                }
            }
        }
        return dirty;
    }
    _updateRecordedBassNotes() {
        if (this._recordingChange == null)
            return false;
        if (!this._doc.lastChangeWas(this._recordingChange)) {
            this.abortRecording();
            return false;
        }
        if (this._doc.synth.countInMetronome) {
            this._recentlyAddedBassPitches.length = 0;
            this._bassPitchesChanged = false;
            return false;
        }
        const partsPerBar = this._doc.song.beatsPerBar * Config.partsPerBeat;
        const oldPart = this._bassPlayheadPart % partsPerBar;
        const oldBar = Math.floor(this._bassPlayheadPart / partsPerBar);
        const oldPlayheadPart = this._bassPlayheadPart;
        this._bassPlayheadPart = this._getCurrentPlayheadPart();
        const newPart = this._bassPlayheadPart % partsPerBar;
        const newBar = Math.floor(this._bassPlayheadPart / partsPerBar);
        if (oldPart == newPart && oldBar == newBar)
            return false;
        if (this._bassPlayheadPart < oldPlayheadPart) {
            this._lastBassNote = null;
            this._bassPlayheadPattern = null;
            return false;
        }
        let dirty = false;
        for (let bar = oldBar; bar <= newBar; bar++) {
            if (bar != oldBar) {
                this._bassPlayheadPattern = null;
            }
            const startPart = (bar == oldBar) ? oldPart : 0;
            const endPart = (bar == newBar) ? newPart : partsPerBar;
            if (startPart == endPart)
                break;
            if (this._lastBassNote != null && !this._bassPitchesChanged && startPart > 0 && this._doc.synth.liveBassInputPitches.length > 0) {
                this._recordingChange.append(new ChangePinTime(this._doc, this._lastBassNote, 1, endPart, this._lastBassNote.continuesLastPattern));
                this._doc.currentPatternIsDirty = true;
            }
            else {
                if (this._lastBassNote != null) {
                    this._lastBassNote = null;
                }
                let noteStartPart = startPart;
                let noteEndPart = endPart;
                while (noteStartPart < endPart) {
                    let addedAlreadyReleasedPitch = false;
                    if (this._recentlyAddedBassPitches.length > 0 || this._doc.synth.liveBassInputPitches.length > 0) {
                        if (this._bassPlayheadPattern == null) {
                            this._doc.selection.erasePatternInBar(this._recordingChange, this._doc.synth.liveBassInputChannel, bar);
                            this._recordingChange.append(new ChangeEnsurePatternExists(this._doc, this._doc.synth.liveBassInputChannel, bar));
                            this._bassPlayheadPattern = this._doc.song.getPattern(this._doc.synth.liveBassInputChannel, bar);
                        }
                        if (this._bassPlayheadPattern == null)
                            throw new Error();
                        this._lastBassNote = new Note(-1, noteStartPart, noteEndPart, Config.noteSizeMax, this._doc.song.getChannelIsNoise(this._doc.synth.liveBassInputChannel));
                        this._lastBassNote.continuesLastPattern = (noteStartPart == 0 && !this._bassPitchesChanged);
                        this._lastBassNote.pitches.length = 0;
                        while (this._recentlyAddedBassPitches.length > 0) {
                            if (this._lastBassNote.pitches.length >= Config.maxChordSize)
                                break;
                            const recentPitch = this._recentlyAddedBassPitches.shift();
                            if (this._doc.synth.liveBassInputPitches.indexOf(recentPitch) == -1) {
                                this._lastBassNote.pitches.push(recentPitch);
                                addedAlreadyReleasedPitch = true;
                            }
                        }
                        for (let i = 0; i < this._doc.synth.liveBassInputPitches.length; i++) {
                            if (this._lastBassNote.pitches.length >= Config.maxChordSize)
                                break;
                            this._lastBassNote.pitches.push(this._doc.synth.liveBassInputPitches[i]);
                        }
                        this._recordingChange.append(new ChangeNoteAdded(this._doc, this._bassPlayheadPattern, this._lastBassNote, this._bassPlayheadPattern.notes.length));
                        if (addedAlreadyReleasedPitch) {
                            noteEndPart = noteStartPart + this._getMinDivision();
                            new ChangeNoteLength(this._doc, this._lastBassNote, this._lastBassNote.start, noteEndPart);
                            this._lastBassNote = null;
                        }
                        dirty = true;
                    }
                    this._bassPitchesChanged = addedAlreadyReleasedPitch;
                    noteStartPart = noteEndPart;
                    noteEndPart = endPart;
                }
            }
            if (bar == this._doc.song.barCount - 1) {
                if (this._lastBarHasPatterns()) {
                    new ChangeInsertBars(this._doc, this._doc.song.barCount, 1);
                    this._doc.bar--;
                    dirty = true;
                }
            }
        }
        return dirty;
    }
    setTemporaryPitches(pitches, duration) {
        this._updateRecordedNotes();
        for (let i = 0; i < pitches.length; i++) {
            this._doc.synth.liveInputPitches[i] = pitches[i];
        }
        this._doc.synth.liveInputPitches.length = Math.min(pitches.length, Config.maxChordSize);
        this._doc.synth.liveInputDuration = duration;
        this._doc.synth.liveInputStarted = true;
        this._pitchesAreTemporary = true;
        this._pitchesChanged = true;
    }
    setTemporaryBassPitches(pitches, duration) {
        this._updateRecordedBassNotes();
        for (let i = 0; i < pitches.length; i++) {
            this._doc.synth.liveBassInputPitches[i] = pitches[i];
        }
        this._doc.synth.liveBassInputPitches.length = Math.min(pitches.length, Config.maxChordSize);
        this._doc.synth.liveBassInputDuration = duration;
        this._doc.synth.liveBassInputStarted = true;
        this._bassPitchesAreTemporary = true;
        this._bassPitchesChanged = true;
    }
    addPerformedPitch(pitch) {
        this._doc.synth.maintainLiveInput();
        if (pitch > Piano.getBassCutoffPitch(this._doc) || this._getBassOffsetChannel() == this._doc.channel) {
            this._updateRecordedNotes();
            if (this._pitchesAreTemporary) {
                this.clearAllPitches();
                this._pitchesAreTemporary = false;
            }
            if (this._doc.prefs.ignorePerformedNotesNotInScale && !Config.scales[this._doc.song.scale].flags[pitch % Config.pitchesPerOctave]) {
                return;
            }
            if (this._doc.synth.liveInputPitches.indexOf(pitch) == -1) {
                this._doc.synth.liveInputPitches.push(pitch);
                this._pitchesChanged = true;
                while (this._doc.synth.liveInputPitches.length > Config.maxChordSize) {
                    this._doc.synth.liveInputPitches.shift();
                }
                this._doc.synth.liveInputDuration = Number.MAX_SAFE_INTEGER;
                if (this._recordingChange != null) {
                    const recentIndex = this._recentlyAddedPitches.indexOf(pitch);
                    if (recentIndex != -1) {
                        this._recentlyAddedPitches.splice(recentIndex, 1);
                    }
                    this._recentlyAddedPitches.push(pitch);
                    while (this._recentlyAddedPitches.length > Config.maxChordSize * 4) {
                        this._recentlyAddedPitches.shift();
                    }
                }
            }
        }
        else {
            this._updateRecordedBassNotes();
            if (this._bassPitchesAreTemporary) {
                this.clearAllBassPitches();
                this._bassPitchesAreTemporary = false;
            }
            if (this._doc.prefs.ignorePerformedNotesNotInScale && !Config.scales[this._doc.song.scale].flags[pitch % Config.pitchesPerOctave]) {
                return;
            }
            if (this._doc.synth.liveBassInputPitches.indexOf(pitch) == -1) {
                this._doc.synth.liveBassInputPitches.push(pitch);
                this._bassPitchesChanged = true;
                while (this._doc.synth.liveBassInputPitches.length > Config.maxChordSize) {
                    this._doc.synth.liveBassInputPitches.shift();
                }
                this._doc.synth.liveBassInputDuration = Number.MAX_SAFE_INTEGER;
                if (this._recordingChange != null) {
                    const recentIndex = this._recentlyAddedPitches.indexOf(pitch);
                    if (recentIndex != -1) {
                        this._recentlyAddedBassPitches.splice(recentIndex, 1);
                    }
                    this._recentlyAddedBassPitches.push(pitch);
                    while (this._recentlyAddedBassPitches.length > Config.maxChordSize * 4) {
                        this._recentlyAddedBassPitches.shift();
                    }
                }
            }
        }
    }
    removePerformedPitch(pitch) {
        if (pitch > Piano.getBassCutoffPitch(this._doc) || this._getBassOffsetChannel() == this._doc.channel) {
            this._updateRecordedNotes();
            for (let i = 0; i < this._doc.synth.liveInputPitches.length; i++) {
                if (this._doc.synth.liveInputPitches[i] == pitch) {
                    this._doc.synth.liveInputPitches.splice(i, 1);
                    this._pitchesChanged = true;
                    i--;
                }
            }
        }
        else {
            this._updateRecordedBassNotes();
            for (let i = 0; i < this._doc.synth.liveBassInputPitches.length; i++) {
                if (this._doc.synth.liveBassInputPitches[i] == pitch) {
                    this._doc.synth.liveBassInputPitches.splice(i, 1);
                    this._bassPitchesChanged = true;
                    i--;
                }
            }
        }
    }
    clearAllPitches() {
        this._updateRecordedNotes();
        this._doc.synth.liveInputPitches.length = 0;
        this._pitchesChanged = true;
    }
    clearAllBassPitches() {
        this._updateRecordedBassNotes();
        this._doc.synth.liveBassInputPitches.length = 0;
        this._bassPitchesChanged = true;
    }
}
//# sourceMappingURL=SongPerformance.js.map