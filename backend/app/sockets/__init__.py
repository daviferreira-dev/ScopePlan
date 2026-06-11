import base64
import time
from flask import request
from app import socketio

# In-memory relay store: room_id -> {'updates': [...], 'last_active': timestamp}
_room_updates: dict[str, dict] = {}

# Presence: room_id -> {sid: {name, color}}
_room_presence: dict[str, dict[str, dict]] = {}

# Rooms inactive for more than 2 hours are evicted
_ROOM_TTL_SECONDS = 7200


def _evict_stale_rooms():
    now = time.time()
    stale = [rid for rid, meta in _room_updates.items()
             if now - meta.get('last_active', 0) > _ROOM_TTL_SECONDS]
    for rid in stale:
        _room_updates.pop(rid, None)
        _room_presence.pop(rid, None)


@socketio.on('connect')
def on_connect(auth):
    """Validate JWT before accepting the WebSocket connection."""
    token = (auth or {}).get('token')
    if not token:
        raise ConnectionRefusedError('authentication-required')
    try:
        from flask_jwt_extended import decode_token
        from app.models import TokenBlocklist
        decoded = decode_token(token)
        jti = decoded.get('jti')
        if jti and TokenBlocklist.is_revoked(jti):
            raise ConnectionRefusedError('token-revoked')
        request.environ['ws_user_id'] = str(decoded.get('sub'))
    except ConnectionRefusedError:
        raise
    except Exception:
        raise ConnectionRefusedError('invalid-token')


@socketio.on('disconnect')
def on_disconnect():
    sid = request.sid
    for room_id, users in list(_room_presence.items()):
        if sid in users:
            del users[sid]
            socketio.emit(
                'presence-update',
                {'roomId': room_id, 'users': list(users.values())},
                room=room_id,
            )


@socketio.on('join-room')
def on_join(data):
    from flask_socketio import join_room, emit
    room_id = str(data.get('roomId', ''))
    user = data.get('user') or {}
    if not room_id:
        return
    join_room(room_id)

    # Update presence
    if room_id not in _room_presence:
        _room_presence[room_id] = {}
    _room_presence[room_id][request.sid] = user
    socketio.emit(
        'presence-update',
        {'roomId': room_id, 'users': list(_room_presence[room_id].values())},
        room=room_id,
    )

    # Replay accumulated Yjs updates so the new joiner reaches current state
    room_meta = _room_updates.get(room_id)
    has_history = bool(room_meta and room_meta.get('updates'))
    if has_history:
        for update in room_meta['updates']:
            emit('yjs-update', {
                'roomId': room_id,
                'update': base64.b64encode(update).decode(),
            })

    # Signal replay complete so the client knows whether to seed from REST
    emit('room-synced', {'roomId': room_id, 'hasHistory': has_history})


@socketio.on('leave-room')
def on_leave(data):
    from flask_socketio import leave_room
    room_id = str(data.get('roomId', ''))
    if not room_id:
        return
    leave_room(room_id)
    if room_id in _room_presence:
        _room_presence[room_id].pop(request.sid, None)
        socketio.emit(
            'presence-update',
            {'roomId': room_id, 'users': list(_room_presence[room_id].values())},
            room=room_id,
        )


@socketio.on('yjs-update')
def on_yjs_update(data):
    from flask_socketio import emit
    room_id = str(data.get('roomId', ''))
    update_b64 = data.get('update', '')
    if not room_id or not update_b64:
        return

    update_bytes = base64.b64decode(update_b64)
    if room_id not in _room_updates:
        _room_updates[room_id] = {'updates': [], 'last_active': time.time()}
    _room_updates[room_id]['updates'].append(update_bytes)
    _room_updates[room_id]['last_active'] = time.time()
    _evict_stale_rooms()

    # Relay to every other client in the room
    emit(
        'yjs-update',
        {'roomId': room_id, 'update': update_b64},
        room=room_id,
        include_self=False,
    )
