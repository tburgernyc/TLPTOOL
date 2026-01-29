import React, { useState, useEffect, useCallback } from 'react';
import { getFlatCardDatabase, CANONICAL_TAROT_LIST } from './tarotCardDatabase';
import { parseCardFromSpeech } from './cardMatcher';
import { Check, X, Mic, RotateCcw, Edit3 } from 'lucide-react';

interface CapturedCard {
    name: string;
    orientation: 'Upright' | 'Reversed';
}

interface BatchCardCaptureProps {
    onConfirm: (cards: CapturedCard[]) => void;
    onCancel: () => void;
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    reset: () => void;
}

// Card position labels for the 13-card spread
const POSITION_LABELS = [
    { group: 'Situation', positions: ['Card 1', 'Card 2', 'Card 3'] },
    { group: 'Feelings', positions: ['Card 4', 'Card 5', 'Card 6'] },
    { group: 'Message', positions: ['Card 7', 'Card 8', 'Card 9'] },
    { group: 'Outcome', positions: ['Card 10', 'Card 11', 'Card 12'] },
    { group: 'Bottom of Deck', positions: ['Card 13'] },
];

const BatchCardCapture: React.FC<BatchCardCaptureProps> = ({
    onConfirm,
    onCancel,
    isListening,
    transcript,
    interimTranscript,
    reset,
}) => {
    const [capturedCards, setCapturedCards] = useState<(CapturedCard | null)[]>(
        Array(13).fill(null)
    );
    const [lastProcessedLength, setLastProcessedLength] = useState(0);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [listeningStatus, setListeningStatus] = useState('Listening for cards...');
    const [latestDetection, setLatestDetection] = useState<string>('');

    // Get all card names for dropdown
    const allCardNames = CANONICAL_TAROT_LIST;

    // Count how many cards are captured
    const capturedCount = capturedCards.filter((c) => c !== null).length;
    const nextSlot = capturedCards.findIndex((c) => c === null);

    // Listen for new cards in the transcript
    useEffect(() => {
        if (!isListening) return;

        const fullText = (transcript + ' ' + interimTranscript).trim();
        if (!fullText || fullText.length <= lastProcessedLength) return;

        // Get new portion of transcript
        const newPortion = fullText.slice(lastProcessedLength).trim();
        if (!newPortion) return;

        // Debounce card detection
        const timeoutId = setTimeout(() => {
            setListeningStatus('Scanning...');
            const parsed = parseCardFromSpeech(newPortion, getFlatCardDatabase());

            if (parsed.success && nextSlot !== -1) {
                const newCards = [...capturedCards];
                newCards[nextSlot] = parsed.card as CapturedCard;
                setCapturedCards(newCards);
                setLatestDetection(`✓ ${parsed.card.name} (${parsed.card.orientation})`);
                setListeningStatus(`Captured: ${parsed.card.name}`);
                setLastProcessedLength(fullText.length);

                // Visual feedback timing
                setTimeout(() => {
                    setLatestDetection('');
                    setListeningStatus(nextSlot + 1 < 13 ? 'Listening for next card...' : 'All 13 cards captured!');
                }, 1500);
            }
        }, 400);

        return () => clearTimeout(timeoutId);
    }, [transcript, interimTranscript, isListening, lastProcessedLength, capturedCards, nextSlot]);

    // Handle card edit
    const handleEditCard = useCallback((index: number, name: string, orientation: 'Upright' | 'Reversed') => {
        const newCards = [...capturedCards];
        newCards[index] = { name, orientation };
        setCapturedCards(newCards);
        setEditingIndex(null);
    }, [capturedCards]);

    // Handle undo last card
    const handleUndoLast = useCallback(() => {
        const lastFilledIndex = capturedCards.map((c, i) => c !== null ? i : -1).filter(i => i !== -1).pop();
        if (lastFilledIndex !== undefined) {
            const newCards = [...capturedCards];
            newCards[lastFilledIndex] = null;
            setCapturedCards(newCards);
            // Reset transcript tracking to allow re-detection of the same card
            setLastProcessedLength(Math.max(0, lastProcessedLength - 100));
        }
    }, [capturedCards, lastProcessedLength]);

    // Handle reset all
    const handleResetAll = useCallback(() => {
        setCapturedCards(Array(13).fill(null));
        setLastProcessedLength(0);
        reset();
        setListeningStatus('Listening for cards...');
    }, [reset]);

    // Handle confirm
    const handleConfirm = useCallback(() => {
        if (capturedCount === 13) {
            onConfirm(capturedCards as CapturedCard[]);
        }
    }, [capturedCount, capturedCards, onConfirm]);

    // Render card slot
    const renderCardSlot = (index: number, positionLabel: string) => {
        const card = capturedCards[index];
        const isEditing = editingIndex === index;

        if (isEditing) {
            return (
                <div className="bg-white/10 border-2 border-gold-accent rounded-xl p-3 min-w-[140px]">
                    <select
                        className="w-full bg-black/50 text-white text-[11px] rounded-lg p-2 mb-2 border border-white/20"
                        value={card?.name || ''}
                        onChange={(e) => handleEditCard(index, e.target.value, card?.orientation || 'Upright')}
                        autoFocus
                    >
                        <option value="">Select card...</option>
                        {allCardNames.map((name) => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleEditCard(index, card?.name || '', 'Upright')}
                            className={`flex-1 text-[9px] py-1 rounded ${card?.orientation === 'Upright' ? 'bg-emerald-500/30 text-emerald-400' : 'bg-white/5 text-white/40'}`}
                        >
                            Upright
                        </button>
                        <button
                            onClick={() => handleEditCard(index, card?.name || '', 'Reversed')}
                            className={`flex-1 text-[9px] py-1 rounded ${card?.orientation === 'Reversed' ? 'bg-rose-500/30 text-rose-400' : 'bg-white/5 text-white/40'}`}
                        >
                            Reversed
                        </button>
                    </div>
                    <button
                        onClick={() => setEditingIndex(null)}
                        className="w-full mt-2 text-[9px] text-white/40 hover:text-white"
                    >
                        Done
                    </button>
                </div>
            );
        }

        return (
            <div
                onClick={() => card && setEditingIndex(index)}
                className={`
          relative rounded-xl p-3 min-w-[120px] transition-all duration-300 cursor-pointer
          ${card
                        ? 'bg-emerald-500/10 border-2 border-emerald-500/30 hover:border-emerald-500/50'
                        : 'bg-white/5 border-2 border-dashed border-white/10'
                    }
          ${index === nextSlot ? 'ring-2 ring-gold-accent/50 animate-pulse' : ''}
        `}
                title={card ? 'Click to edit' : ''}
            >
                <div className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">
                    {positionLabel}
                </div>
                {card ? (
                    <>
                        <div className="text-[11px] font-bold text-white truncate">{card.name}</div>
                        <div className={`text-[9px] font-black uppercase ${card.orientation === 'Reversed' ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {card.orientation}
                        </div>
                        <Edit3 className="absolute top-2 right-2 w-3 h-3 text-white/20" />
                    </>
                ) : (
                    <div className="text-[10px] text-white/20 italic">Waiting...</div>
                )}
            </div>
        );
    };

    let positionIndex = 0;

    return (
        <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl z-[400] flex flex-col items-center justify-center p-8 overflow-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-white uppercase tracking-[0.4em] mb-3">
                    Card Capture Mode
                </h2>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em]">
                    Speak your 13 cards clearly • Auto-captures as you speak
                </p>
            </div>

            {/* Status Bar */}
            <div className="flex items-center gap-6 mb-8 bg-white/5 px-8 py-4 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                    {isListening && <Mic className="w-5 h-5 text-emerald-400 animate-pulse" />}
                    <span className="text-[12px] font-bold text-white/60">{listeningStatus}</span>
                </div>
                {latestDetection && (
                    <div className="text-[12px] font-black text-emerald-400 animate-pulse">
                        {latestDetection}
                    </div>
                )}
                <div className="text-[14px] font-black text-gold-accent tabular-nums">
                    {capturedCount} / 13
                </div>
            </div>

            {/* Card Grid */}
            <div className="space-y-6 mb-8">
                {POSITION_LABELS.map((group) => (
                    <div key={group.group} className="flex flex-col items-center">
                        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-3">
                            {group.group}
                        </div>
                        <div className="flex gap-4 justify-center">
                            {group.positions.map((label) => {
                                const slot = renderCardSlot(positionIndex, label);
                                positionIndex++;
                                return <div key={label}>{slot}</div>;
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleUndoLast}
                    disabled={capturedCount === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <RotateCcw className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Undo Last</span>
                </button>

                <button
                    onClick={handleResetAll}
                    disabled={capturedCount === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-400 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <X className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Reset All</span>
                </button>

                <button
                    onClick={handleConfirm}
                    disabled={capturedCount < 13}
                    className={`flex items-center gap-3 px-10 py-4 rounded-xl font-black uppercase tracking-widest transition-all duration-500 ${capturedCount === 13
                        ? 'bg-gold-accent text-black hover:scale-105 shadow-[0_0_50px_rgba(255,215,0,0.3)]'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                        }`}
                >
                    <Check className="w-5 h-5" />
                    <span className="text-[11px]">Confirm Cards</span>
                </button>

                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl transition-all"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest">Cancel</span>
                </button>
            </div>

            {/* Transcript Preview (debug-style, subtle) */}
            {(transcript || interimTranscript) && (
                <div className="mt-8 max-w-2xl text-center">
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
                        Hearing...
                    </div>
                    <div className="text-[11px] text-white/30 italic">
                        {transcript} <span className="text-white/50">{interimTranscript}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchCardCapture;
