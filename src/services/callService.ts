export type CallKind = 'voice' | 'video';
export type CallState = 'idle' | 'ringing' | 'active' | 'ended';

export interface ActiveCall {
  contactId: string;
  kind: CallKind;
  state: CallState;
  startedAt: number;
}

let currentCall: ActiveCall | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let onStateChange: ((call: ActiveCall | null) => void) | null = null;

export function subscribeToCalls(callback: (call: ActiveCall | null) => void): () => void {
  onStateChange = callback;
  return () => {
    onStateChange = null;
  };
}

function notify() {
  onStateChange?.(currentCall);
}

export function getCurrentCall(): ActiveCall | null {
  return currentCall;
}

export function startCall(contactId: string, kind: CallKind): ActiveCall {
  if (currentCall && currentCall.state !== 'ended') {
    endCall();
  }
  currentCall = {
    contactId,
    kind,
    state: 'ringing',
    startedAt: Date.now(),
  };
  notify();
  setTimeout(() => {
    if (currentCall?.state === 'ringing') {
      currentCall.state = 'active';
      currentCall.startedAt = Date.now();
      notify();
    }
  }, 2000);
  return currentCall;
}

export function endCall(): ActiveCall | null {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (currentCall) {
    currentCall.state = 'ended';
    const ended = { ...currentCall };
    notify();
    setTimeout(() => {
      currentCall = null;
      notify();
    }, 1500);
    return ended;
  }
  return null;
}

export function toggleMute(): boolean {
  return false;
}

export function toggleSpeaker(): boolean {
  return false;
}

export function getCallDuration(startedAt: number): string {
  const seconds = Math.floor((Date.now() - startedAt) / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
