import Phaser from "phaser";
import "./style.css";

const W=960,H=540;
const weapons=[
 {name:"PULSE",damage:22,rate:180,speed:650,spread:.02,pellets:1,color:0x69f7ff},
 {name:"BLASTER",damage:13,rate:360,speed:600,spread:.18,pellets:5,color:0xffd166},
 {name:"NOVA",damage:65,rate:650,speed:520,spread:.04,pellets:1,color:0xff5c8a}
] as const;
type Kind="grunt"|"runner"|"tank"|"boss";

class GameScene extends Phaser.Scene{
 player!:Phaser.GameObjects.Arc; cursors!:Phaser.Types.Input.Keyboard.CursorKeys; keys:any;
 enemies=new Set<Phaser.GameObjects.Arc>(); bullets=new Set<Phaser.GameObjects.Arc>();
 hp=100; score=0; wave=1; weapon=0; lastShot=0; spawnTimer=0; boss=false; dead=false; paused=false;
 scoreText!:Phaser.GameObjects.Text; hpText!:Phaser.GameObjects.Text; waveText!:Phaser.GameObjects.Text; weaponText!:Phaser.GameObjects.Text;
 constructor(){super("game")}
 create(){
  this.add.grid(W/2,H/2,W,H,40,40,0x0d2035,.3,0x173b58,.22);
  this.player=this.add.circle(W/2,H/2,18,0x69e7ff).setStrokeStyle(3,0xffffff);
  this.cursors=this.input.keyboard!.createCursorKeys(); this.keys=this.input.keyboard!.addKeys("W,A,S,D,ONE,TWO,THREE,P");
  this.scoreText=this.add.text(20,18,"SCORE 0",{fontSize:"20px",color:"#fff"});
  this.hpText=this.add.text(20,46,"HP 100",{fontSize:"18px",color:"#69f7ff"});
  this.waveText=this.add.text(W-160,18,"WAVE 1",{fontSize:"20px",color:"#fff"});
  this.weaponText=this.add.text(W-160,46,"PULSE",{fontSize:"18px",color:"#ffd166"});
  this.add.text(W/2,H-22,"WASD / ARROWS • CLICK TO FIRE • 1/2/3 WEAPONS • P PAUSE",{fontSize:"13px",color:"#8aa4bd"}).setOrigin(.5);
  this.input.on("pointerdown",()=>{if(this.dead){this.scene.restart();return}this.fire()});
  this.input.keyboard!.on("keydown-ONE",()=>this.weapon=0);this.input.keyboard!.on("keydown-TWO",()=>this.weapon=1);this.input.keyboard!.on("keydown-THREE",()=>this.weapon=2);
  this.input.keyboard!.on("keydown-P",()=>{if(!this.dead)this.paused=!this.paused});
 }
 spawn(kind:Kind){
  let x=Phaser.Math.Between(0,W),y=Phaser.Math.Between(0,H); const side=Phaser.Math.Between(0,3);if(side===0)x=-30;if(side===1)x=W+30;if(side===2)y=-30;if(side===3)y=H+30;
  const r=kind==="boss"?40:kind==="tank"?25:kind==="runner"?13:17; const c=kind==="boss"?0xff2857:kind==="tank"?0xff8614:kind==="runner"?0xff4d9d:0xff526b;
  const e=this.add.circle(x,y,r,c).setStrokeStyle(2,0xffffff) as Phaser.GameObjects.Arc;
  (e as any).kind=kind;(e as any).hp=kind==="boss"?1000:kind==="tank"?180:kind==="runner"?45:70;(e as any).speed=kind==="boss"?45:kind==="tank"?55:kind==="runner"?150:85;this.enemies.add(e);
 }
 fire(){const w=weapons[this.weapon],now=this.time.now;if(now-this.lastShot<w.rate)return;this.lastShot=now;const p=this.input.activePointer,a=Phaser.Math.Angle.Between(this.player.x,this.player.y,p.worldX,p.worldY);for(let i=0;i<w.pellets;i++){const ang=a+Phaser.Math.FloatBetween(-w.spread,w.spread),b=this.add.circle(this.player.x,this.player.y,5,w.color);(b as any).vx=Math.cos(ang)*w.speed;(b as any).vy=Math.sin(ang)*w.speed;(b as any).damage=w.damage;this.bullets.add(b)}}
 update(_:number,dt:number){
  if(this.dead||this.paused)return; let dx=0,dy=0;if(this.cursors.left.isDown||this.keys.A.isDown)dx--;if(this.cursors.right.isDown||this.keys.D.isDown)dx++;if(this.cursors.up.isDown||this.keys.W.isDown)dy--;if(this.cursors.down.isDown||this.keys.S.isDown)dy++;
  const l=Math.hypot(dx,dy)||1;this.player.x=Phaser.Math.Clamp(this.player.x+dx/l*260*dt/1000,20,W-20);this.player.y=Phaser.Math.Clamp(this.player.y+dy/l*260*dt/1000,20,H-20);if(this.input.activePointer.isDown)this.fire();
  this.spawnTimer-=dt;if(this.spawnTimer<=0){const n=Math.min(1+Math.floor(this.wave/2),5);for(let i=0;i<n;i++)this.spawn(Math.random()<.2?"runner":"grunt");this.spawnTimer=Math.max(250,950-this.wave*30)}if(this.wave%5===0&&!this.boss){this.spawn("boss");this.boss=true}
  for(const b of [...this.bullets]){b.x+=(b as any).vx*dt/1000;b.y+=(b as any).vy*dt/1000;if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30){b.destroy();this.bullets.delete(b);continue}for(const e of [...this.enemies])if(e.active&&Phaser.Math.Distance.Between(b.x,b.y,e.x,e.y)<e.width/2+5){(e as any).hp-=(b as any).damage;b.destroy();this.bullets.delete(b);if((e as any).hp<=0){const k=(e as any).kind as Kind;this.score+=k==="boss"?1000:k==="tank"?250:k==="runner"?120:80;e.destroy();this.enemies.delete(e);if(k==="boss")this.boss=false}break}}
  for(const e of [...this.enemies]){const a=Phaser.Math.Angle.Between(e.x,e.y,this.player.x,this.player.y);e.x+=Math.cos(a)*(e as any).speed*dt/1000;e.y+=Math.sin(a)*(e as any).speed*dt/1000;if(Phaser.Math.Distance.Between(e.x,e.y,this.player.x,this.player.y)<e.width/2+18){this.hp-=(e as any).kind==="boss"?25:10;e.destroy();this.enemies.delete(e)}}
  this.wave=1+Math.floor(this.score/1000);this.hpText.setText("HP "+Math.max(0,this.hp));this.scoreText.setText("SCORE "+this.score);this.waveText.setText("WAVE "+this.wave);this.weaponText.setText(weapons[this.weapon].name);if(this.hp<=0)this.end();
 }
 end(){this.dead=true;this.add.rectangle(W/2,H/2,W,H,0x000000,.75);this.add.text(W/2,H/2-45,"GAME OVER",{fontSize:"52px",fontStyle:"bold",color:"#ff5c7a"}).setOrigin(.5);this.add.text(W/2,H/2+25,`Score ${this.score} • Wave ${this.wave}\nClick / tap to restart`,{fontSize:"22px",align:"center",color:"#fff"}).setOrigin(.5)}
}
new Phaser.Game({type:Phaser.AUTO,width:W,height:H,parent:"game",backgroundColor:"#08111f",scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:GameScene});