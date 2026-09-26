export class ProgressionSystem {
  score = 0;
  xp = 0;
  coins = 0;
  wave = 1;
  damageLevel = 0;
  fireLevel = 0;
  addEnemyReward(score: number, xp: number, coins: number) { this.score += score; this.xp += xp; this.coins += coins; this.wave = 1 + Math.floor(this.score / 1000); }
  buyDamage() { const cost = 25 + this.damageLevel * 25; if (this.coins < cost) return false; this.coins -= cost; this.damageLevel++; return true; }
  buyFireRate() { const cost = 30 + this.fireLevel * 30; if (this.coins < cost) return false; this.coins -= cost; this.fireLevel++; return true; }
}
