export type AbilityId="dash"|"shield"|"overdrive";
export type AbilityState={id:AbilityId;cooldown:number;readyAt:number};
export class AbilitySystem{
  abilities:Record<AbilityId,AbilityState>={dash:{id:"dash",cooldown:5000,readyAt:0},shield:{id:"shield",cooldown:10000,readyAt:0},overdrive:{id:"overdrive",cooldown:15000,readyAt:0}};
  use(id:AbilityId,now:number){const a=this.abilities[id];if(now<a.readyAt)return false;a.readyAt=now+a.cooldown;return true}
  remaining(id:AbilityId,now:number){return Math.max(0,this.abilities[id].readyAt-now)}
}
