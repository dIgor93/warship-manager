### Description
2d browser multiplayer game for PC about Spaceships 

### for developers

**run(prod):** `gunicorn -w 1 -k uvicorn.workers.UvicornWorker client.app:app`

**run(dev):** `python ./client/app.py` 

** Управление: **
- Движение: [W][A][S][D] 
- Стрельба: [Space]
![изображение](https://user-images.githubusercontent.com/33654315/117588212-b2b6cf80-b12a-11eb-8b70-19b6ea1a4411.png)
