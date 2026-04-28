import os
from app import create_app

config_name = os.environ.get('FLASK_ENV') or 'development'
app = create_app(config_name)

if __name__ == '__main__':
    # Disable reloader to prevent JWT key regeneration issues
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True, use_reloader=False)
