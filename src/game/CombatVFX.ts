import Phaser from "phaser";

export class CombatVFX {
  constructor(private scene: Phaser.Scene) {}
  muzzle(x:number,y:number,color:number){const ring=this.scene.add.circle(x,y,7,color,.8).setStrokeStyle(2,0xffffff,.8);this.scene.tweens.add({targets:ring,scale:2,alpha:0,duration:100,onComplete:()=>ring.destroy()});}
  hit(x:number,y:number,color=0xffffff){for(let i=0;i<5;i++){const p=this.scene.add.circle(x,y,2,color);const a=Phaser.Math.FloatBetween(0,Math.PI*2),d=Phaser.Math.Between(12,28);this.scene.tweens.add({targets:p,x:x+Math.cos(a)*d,y:y+Math.sin(a)*d,alpha:0,duration:180,onComplete:()=>p.destroy()})}}
  explosion(x:number,y:number,color=0xff5c8a){const r=this.scene.add.circle(x,y,10,color,.65);this.scene.tweens.add({targets:r,scale:5,alpha:0,duration:260,onComplete:()=>r.destroy()});this.scene.cameras.main.shake(120,.004);}
}
