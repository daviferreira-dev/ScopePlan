import * as Y from 'yjs';
import type { Socket } from 'socket.io-client';

export interface PresenceUser {
  name: string;
  color: string;
}

type SyncedCallback = (hasHistory: boolean) => void;
type PresenceCallback = (users: PresenceUser[]) => void;

function uint8ToBase64(arr: Uint8Array): string {
  let binary = '';
  arr.forEach(b => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToUint8(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

export class SocketIoYjsProvider {
  readonly ydoc: Y.Doc;
  private socket: Socket;
  private roomId: string;
  private syncCallbacks: SyncedCallback[] = [];
  private presenceCallback?: PresenceCallback;

  constructor(ydoc: Y.Doc, socket: Socket, roomId: string) {
    this.ydoc = ydoc;
    this.socket = socket;
    this.roomId = roomId;
    this._attach();
  }

  private _onYjsUpdate = ({ roomId, update }: { roomId: string; update: string }) => {
    if (roomId !== this.roomId) return;
    Y.applyUpdate(this.ydoc, base64ToUint8(update));
  };

  private _onRoomSynced = ({ roomId, hasHistory }: { roomId: string; hasHistory: boolean }) => {
    if (roomId !== this.roomId) return;
    this.syncCallbacks.forEach(cb => cb(hasHistory));
    this.syncCallbacks = [];
  };

  private _onPresenceUpdate = ({ roomId, users }: { roomId: string; users: PresenceUser[] }) => {
    if (roomId !== this.roomId) return;
    this.presenceCallback?.(users);
  };

  private _onYdocUpdate = (update: Uint8Array) => {
    this.socket.emit('yjs-update', {
      roomId: this.roomId,
      update: uint8ToBase64(update),
    });
  };

  private _attach() {
    this.ydoc.on('update', this._onYdocUpdate);
    this.socket.on('yjs-update', this._onYjsUpdate);
    this.socket.on('room-synced', this._onRoomSynced);
    this.socket.on('presence-update', this._onPresenceUpdate);
  }

  join(user: PresenceUser): void {
    this.socket.emit('join-room', { roomId: this.roomId, user });
  }

  onSynced(cb: SyncedCallback): void {
    this.syncCallbacks.push(cb);
  }

  onPresence(cb: PresenceCallback): void {
    this.presenceCallback = cb;
  }

  destroy(): void {
    this.ydoc.off('update', this._onYdocUpdate);
    this.socket.off('yjs-update', this._onYjsUpdate);
    this.socket.off('room-synced', this._onRoomSynced);
    this.socket.off('presence-update', this._onPresenceUpdate);
    this.socket.emit('leave-room', { roomId: this.roomId });
  }
}

// Deterministic color per user ID
const PRESENCE_COLORS = ['#2d7a40', '#1a5e9e', '#b45309', '#7c3aed', '#be185d', '#0891b2'];
export function presenceColor(userId: number): string {
  return PRESENCE_COLORS[userId % PRESENCE_COLORS.length];
}
