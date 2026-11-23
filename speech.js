/* Allons-y. Classic scripts, loaded in order. Shared vars use var so later files can see them. */
/* French text-to-speech. */
var frenchVoice = null;
var voicesReady = false;

function refreshVoices() {
  if (!window.speechSynthesis) return;
  const voices = speechSynthesis.getVoices() || [];
  frenchVoice =
    voices.find((voice) => /^fr(-|_)FR/i.test(voice.lang)) ||
    voices.find((voice) => /^fr/i.test(voice.lang)) ||
    voices.find((voice) => /french/i.test(voice.name)) ||
    null;
  voicesReady = voices.length > 0;
}

if (window.speechSynthesis) {
  refreshVoices();
  speechSynthesis.addEventListener("voiceschanged", refreshVoices);
}

function speakFrench(text) {
  if (!window.speechSynthesis) {
    showToast("This browser can’t speak aloud.");
    return false;
  }
  refreshVoices();
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 0.9;
  if (frenchVoice) utterance.voice = frenchVoice;
  speechSynthesis.speak(utterance);
  if (voicesReady && !frenchVoice) {
    showToast("No French voice is installed, so this may sound English.");
  }
  return true;
}

