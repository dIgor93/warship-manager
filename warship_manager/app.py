import asyncio
import json
import os
import time
import uuid

import uvicorn as uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from starlette.responses import JSONResponse, RedirectResponse
from starlette.websockets import WebSocket, WebSocketDisconnect
from websockets import ConnectionClosedOK

from warship_manager.config import ENTITY_PATH, RPS
from warship_manager.data_bus import DataBus

app = FastAPI()
app.state.sockets = []
app.state.data_bus = DataBus()

app.mount("/static", StaticFiles(directory="front"), name="static")
templates = Jinja2Templates(directory="front")

origins = [
    "http://localhost", "http://127.0.0.1",
    "http://localhost:80",
    "http://localhost:8080",
    "https://localhost",
    "https://localhost:80",
    "https://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def main_menu(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/game")
async def main_menu(request: Request, user_name: str = ''):
    return templates.TemplateResponse("client.html", {"request": request, "name": user_name})


@app.get("/load_data")
async def load_data(request: Request):
    data = {}
    for root, dirs, files in os.walk(ENTITY_PATH):
        for name in files:
            f = open(os.path.join(root, name), 'r')
            obj = json.loads(f.read())
            context_id = obj.pop('context_id')
            data[context_id] = obj
    return JSONResponse(content=data)


@app.get("/favicon.ico")
async def favicon(request: Request):
    return RedirectResponse("/static/img/favicon.ico")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    app.state.sockets.append(websocket)

    data = await websocket.receive_json()

    player_name = data.get('name')
    player_id = f'player-{str(uuid.uuid1())[:8]}'
    app.state.data_bus.add_player(player_name=player_name, player_id=player_id)
    await websocket.send_json({'player_id': player_id})

    while True:
        try:
            data = await websocket.receive_json()
            ahead = angle = shot = 0
            if data['up']:
                ahead = 1
            if data['down']:
                ahead = -1
            if data['right']:
                angle = - 1 if data['down'] else 1
            if data['left']:
                angle = + 1 if data['down'] else -1
            if data['shot']:
                shot = 1
            app.state.data_bus.set_shooting(player_id, shot)
            app.state.data_bus.set_moving(player_id, angle, ahead)
        except WebSocketDisconnect as e:
            print(f'WebSocketDisconnect: {e}')
            break
        except Exception as e:
            print(f'Error: {e}')
            break
        await asyncio.sleep(RPS)

    app.state.data_bus.del_player(player_id)
    if websocket in app.state.sockets:
        app.state.sockets.remove(websocket)
    await websocket.close()


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(response_for_all())


async def response_for_all():
    await app.state.data_bus.init_pubsub()
    last = time.time()
    while True:
        message = await app.state.data_bus.get_message()
        if message:
            curr = time.time()
            delta = float((curr - last))
            last = curr

            curr_state = message
            if curr_state:
                curr_state['frame_time'] = delta
                for socket in app.state.sockets:
                    try:
                        await socket.send_json(curr_state)
                    except ConnectionClosedOK as e:
                        print(f'Sending error (ConnectionClosedOK): {e}')
                    except Exception as e:
                        print(f'Sending error: {e}')
        else:
            print("No new message")

        await app.state.data_bus.send_state()
        await asyncio.sleep(RPS)


if __name__ == "__main__":
    #uvicorn.run('warship_manager.app:app', host="localhost", port=8000, debug=False)
    uvicorn.run(app, host="localhost", port=8000, debug=False)
