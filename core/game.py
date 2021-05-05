import asyncio
import time

import config
from core.effects import EffectFactory
from core.endpoint import Endpoint
from core.entities import SpaceShip, Statics
from core.entity_manager import EntityManager
from core.physics_system import PhysicsSystem
from core.scheduler import Scheduler
from core.storage import ResourceStorage


class Game:
    def __init__(self, data_bus):
        self.endpoint = Endpoint(data_bus)
        self.phs = PhysicsSystem()
        self.em = EntityManager(self.phs)
        self.resources = ResourceStorage()
        self.scheduler = Scheduler()
        self.effects = EffectFactory()
        self.em.load_statics()

    def exec_step(self, time_delta):
        self.scheduler.exec_all()
        self.phs.exec_next(time_delta)
        self.phs.collision_computer()
        self.em.remove_all_dead()

        if self.em.bot_count < config.BOTS_COUNT:
            self.em.create_ship('bot')

    def get_state(self):
        return {
            'entities': [pl.get_info() for pl in self.em.all()],
            'effects': self.effects.get_effects()
        }

    def run(self):
        last = time.time()
        curr_step_players = {}
        while True:
            curr = time.time()
            delta = float((curr - last))
            last = curr

            curr_step_players, new_players, expire_players = self.endpoint.scan_players(curr_step_players)

            for player in new_players:
                self.em.create_ship('player', player.get('player_id'), player.get('player_name'))

            for player in expire_players:
                self.em.remove_ship(player)

            for pl_id, pl_data in curr_step_players.items():
                player_obj: SpaceShip = self.em.players.get(pl_id)
                if player_obj:
                    pass
                    self.scheduler.add(player_obj,
                                       SpaceShip.set_shooting,
                                       pl_data.get('shooting'))
                    self.scheduler.add(player_obj,
                                       SpaceShip.set_moving,
                                       pl_data.get('angle', 0),
                                       pl_data.get('direction', 0))
                else:
                    self.em.remove_ship(pl_id)

            self.exec_step(delta)
            self.endpoint.send_data_to_player(self.get_state())

            delay = config.RPS - (time.time() - curr)
            delay = 0 if delay < 0 else delay
            yield delay


async def main_game(data_bus):
    print('Core game started.')
    game = Game(data_bus)
    run_generator = game.run()
    while True:
        delay = next(run_generator)
        await asyncio.sleep(delay)
