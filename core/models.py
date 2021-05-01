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


@dataclass
class BulletModel(GeometryParams):
    content_id: str
    hp_max: int
    texture: str


@dataclass
class BonusModel(BulletModel):
    ...


@dataclass
class StaticsModel(GeometryParams):
    content_id: str
    texture: str
    x: int
    y: int
