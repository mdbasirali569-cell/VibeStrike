import Phaser from "phaser";
export type BossPhase = 1|2|3;
export class BossSystem {
  phase:BossPhase=1;
  maxHp:number; hp:number;
  constructor(private scene:Phaser.Scene, maxHp=1400){this.maxHp=maxHp;this.hp=maxHp;}
  updatePhase(){const ratio=this.hp/this.maxHp;const next:BossPhase=ratio<=.33?3:ratio<=.66?2:1;if(next!==this.phase){this.phase=next;this.scene.cameras.main.shake(220,.008);return true}return false}
  damage(amount:number){this.hp=Math.max(0,this.hp-amount);return this.updatePhase()}
  isDefeated(){return this.hp<=0}
  attackCooldown(){return this.phase===3?650:this.phase===2?900:1200}
}
