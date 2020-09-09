import json
import time

from aredis import StrictRedis

from warship_manager.config import REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, RPS


class DataBus:
    def __init__(self):
        self._redis = StrictRedis(host=REDIS_HOST, port=REDIS_PORT, db=0, password=REDIS_PASSWORD)
        self.players_state = {}
        self.pubsub = self._redis.pubsub()
        self.pubsub_players = self._redis.pubsub()

    async def init_pubsub(self):
        await self.pubsub.subscribe('game-state')

    def add_player(self, player_name, player_id):
        player = {
            'player_id': player_id,
            'player_name': player_name,
            'shooting': 0,
            'angle': 0,
            'direction': 0
        }
        self.players_state[player_id] = player

    def del_player(self, player_id):
        del self.players_state[player_id]

    def set_moving(self, player_id, angle, direction):
        self.players_state[player_id]['angle'] = angle
        self.players_state[player_id]['direction'] = direction

    def set_shooting(self, player_id, shooting):
        self.players_state[player_id]['shooting'] = shooting

    async def send_state(self):
        await self.pubsub_players.execute_command("PUBLISH", 'players-state', json.dumps(self.players_state))

    async def get_message(self):
        raw_message = await self.pubsub.get_message(ignore_subscribe_messages=True, timeout=RPS+0.1)
        if raw_message:
            return self.get_dict(raw_message['data'])
        return None

    @staticmethod
    def get_dict(value: bytes):
        if isinstance(value, bytes):
            return json.loads(value.decode().replace("'", '"'))
        return {}
