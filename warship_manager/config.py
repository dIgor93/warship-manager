import os
from os.path import join

RPS = float(os.environ.get('RPS') or 0.016)
AREA_WIDTH = 3000
AREA_HEIGHT = 3000
PLAYERS_COUNT = 16
ENTITY_PATH = 'entities'
STATICS_PATH = join(ENTITY_PATH, 'statics')
SHIPS_PATH = join(ENTITY_PATH, 'dynamics')

REDIS_HOST = os.environ.get('REDIS_HOST') or 'localhost'
REDIS_PORT = os.environ.get('REDIS_PORT') or 6379
REDIS_PASSWORD = os.environ.get('REDIS_PASSWORD') or ''
