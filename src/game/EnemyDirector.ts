export type EnemyArchetype = 'grunt'|'runner'|'tank'|'ranged'|'elite'|'boss';
export const ENEMY_STATS: Record<EnemyArchetype,{hp:number;speed:number;damage:number;reward:number}>={
 grunt:{hp:70,speed:85,damage:10,reward:4}, runner:{hp:45,speed:150,damage:12,reward:6}, tank:{hp:180,speed:55,damage:18,reward:12}, ranged:{hp:90,speed:45,damage:14,reward:10}, elite:{hp:320,speed:80,damage:22,reward:25}, boss:{hp:1400,speed:48,damage:30,reward:60}
};
export class EnemyDirector {
  wave=1;
  chooseArchetype(): EnemyArchetype { const r=Math.random(); if(this.wave>=8&&r<.08)return 'elite'; if(this.wave>=6&&r<.18)return 'ranged'; if(this.wave>=4&&r<.34)return 'tank'; if(r<.58)return 'runner'; return 'grunt'; }
  advanceWave(score:number){this.wave=Math.max(1,1+Math.floor(score/1000));return this.wave;}
}
