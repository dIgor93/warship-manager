from dataclasses import dataclass
from typing import List


@dataclass
class GeometryParams:
    offset_x: int
    offset_y: int
    width: int
    height: int
    points: List[dict]


@dataclass
class SpaceShipModel(GeometryParams):
    content_id: str
    hp_max: int
    mobility: float
    speed: int
    acceleration: int
    shot_speed: float
    bullet_damage: int
    bullet_speed: int
    animation_sprite: str = None


@dataclass
class BulletModel(GeometryParams):
    content_id: str
    hp_max: int
    animation_sprite: str = None


@dataclass
class BonusModel(GeometryParams):
    content_id: str
    hp_max: int
    animation_sprite: str = None


@dataclass
class StaticsModel(GeometryParams):
    content_id: str
    x: int
    y: int
    animation_sprite: str = None