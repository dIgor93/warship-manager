import os
from os.path import join

RPS = 0.016
AREA_WIDTH = 3000
AREA_HEIGHT = 3000
ENEMY_COUNT = 10
ENTITY_PATH = 'entities'
STATICS_PATH = join(ENTITY_PATH, 'statics')
SHIPS_PATH = join(ENTITY_PATH, 'dynamics')

REDIS_HOST = os.environ['REDIS_HOST']
REDIS_PORT = os.environ['REDIS_PORT']
REDIS_PASSWORD = os.environ['REDIS_PASSWORD']
