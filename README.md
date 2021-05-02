### description

Frontend of 2d browser multiplayer game for PC about Spaceships

### related repos

https://github.com/dIgor93/warship

### for developers

**run(prod):** `gunicorn -w 1 -k uvicorn.workers.UvicornWorker warship_manager.app:app`

**run(dev):** `python ./warship_manager/app.py` 
