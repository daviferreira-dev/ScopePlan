import eventlet
eventlet.monkey_patch()

import os
from app import create_app, socketio

config_name = os.environ.get('FLASK_ENV') or 'development'
app = create_app(config_name)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = config_name == 'development'
    host = '127.0.0.1' if debug else '0.0.0.0'
    socketio.run(app, host=host, port=port, debug=debug, use_reloader=False)
