bind = "0.0.0.0:5000"
workers = 1  # SQLite only supports single-writer; multiple workers cause DB lock errors
timeout = 120
keepalive = 5
preload_app = True
