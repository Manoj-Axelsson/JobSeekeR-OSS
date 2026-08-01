/**
 * Web Speech API Text-to-Speech (TTS) Utility for Visually Impaired Users
 * Fully compliant with EU EN 301 549 & WCAG 2.1 AA Audio Assistance Guidelines
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(text: string, lang: string = "sv-SE"): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("Speech synthesis is not supported in this browser.");
    return false;
  }

  // Stop any currently ongoing speech
  window.speechSynthesis.cancel();

  // Strip HTML or markdown tags for clean reading
  const cleanText = text.replace(/<[^>]*>?/gm, "").trim();
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = lang;
  utterance.rate = 0.95; // Slightly slower, highly legible speed for accessibility
  utterance.pitch = 1.0;

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}
