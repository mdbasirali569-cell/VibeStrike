import Phaser from "phaser";

export class PlayerController {
  speed = 260;
  maxHp = 100;
  hp = 100;
  constructor(private scene: Phaser.Scene, public sprite: Phaser.GameObjects.Arc) {}
  move(dx: number, dy: number, dt: number, minY = 70) {
    const len = Math.hypot(dx, dy) || 1;
    this.sprite.x = Phaser.Math.Clamp(this.sprite.x + dx / len * this.speed * dt / 1000, 20, 940);
    this.sprite.y = Phaser.Math.Clamp(this.sprite.y + dy / len * this.speed * dt / 1000, minY, 470);
  }
  damage(amount: number) { this.hp = Math.max(0, this.hp - amount); }
  heal(amount: number) { this.hp = Math.min(this.maxHp, this.hp + amount); }
  reset() { this.hp = this.maxHp; }
}
