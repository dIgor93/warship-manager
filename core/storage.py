import json
import os
from typing import List

from config import ENTITY_PATH
from core.models import SpaceShipModel, BulletModel, BonusModel, StaticsModel
from core.singleton import SingletonMeta


class ResourceStorage(metaclass=SingletonMeta):
    def __init__(self):
        self.storage = {}
        self.__ships = {}
        self.__bullets = {}
        self.__statics = []
        self.__bonuses = {}

        self.load_dynamics()

    def load_dynamics(self):
        for root, dirs, files in os.walk(ENTITY_PATH):
            for name in files:
                f = open(os.path.join(root, name), 'r')
                obj = json.loads(f.read())
                self.storage[name[:-5]] = obj
                _type = obj['type']

                if _type == 'bonus':
                    obj.pop('type')
                    obj['content_id'] = name[:-5]
                    self.__bonuses[name[:-5]] = BonusModel(**obj)

                elif _type == 'static':
                    obj.pop('type')
                    obj['content_id'] = name[:-5]
                    self.__statics.append(StaticsModel(**obj))

                elif _type == 'ship':
                    obj.pop('type')
                    obj['content_id'] = name[:-5]
                    self.__ships[name[:-5]] = SpaceShipModel(**obj)

                elif _type == 'bullet':
                    obj.pop('type')
                    obj['content_id'] = name[:-5]
                    self.__bullets[name[:-5]] = BulletModel(**obj)

    def get_spaceship(self, name='main_spaceship') -> SpaceShipModel:
        return self.__ships[name]

    def get_bullet(self, name='bullet_main_spaceship') -> BulletModel:
        return self.__bullets[name]

    def get_bonus(self, name='bonus_shoot') -> BonusModel:
        return self.__bonuses[name]

    def get_statics(self) -> List[StaticsModel]:
        return self.__statics


