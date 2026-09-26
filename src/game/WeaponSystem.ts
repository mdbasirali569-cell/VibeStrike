import Phaser from "phaser";

export type WeaponSpec = { name: string; damage: number; rate: number; speed: number; spread: number; pellets: number; color: number };

export class WeaponSystem {
  constructor(private scene: Phaser.Scene, private weapons: readonly WeaponSpec[]) {}
  levelDamage = 0;
  levelFireRate = 0;
  selected = 0;
  lastShot = 0;
  select(index: number) { if (this.weapons[index]) this.selected = index; }
  get current() { return this.weapons[this.selected]; }
  canFire(now: number, rapidUntil: number) {
    const rate = this.current.rate * (1 - this.levelFireRate * .1) * (now < rapidUntil ? .45 : 1);
    return now - this.lastShot >= rate;
  }
  fire(x: number, y: number, targetX: number, targetY: number, now: number, rapidUntil = 0, damageBoostUntil = 0) {
    if (!this.canFire(now, rapidUntil)) return [] as Phaser.GameObjects.Arc[];
    this.lastShot = now;
    const w = this.current;
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    const shots: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < w.pellets; i++) {
      const a = angle + Phaser.Math.FloatBetween(-w.spread, w.spread);
      const b = this.scene.add.circle(x, y, 5, w.color);
      (b as any).vx = Math.cos(a) * w.speed;
      (b as any).vy = Math.sin(a) * w.speed;
      (b as any).damage = w.damage * (1 + this.levelDamage * .15) * (now < damageBoostUntil ? 1.7 : 1);
      shots.push(b);
    }
    return shots;
  }
}
