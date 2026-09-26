import Phaser from "phaser";
import "./style.css";

const W=960,H=540;
const weapons=[
 {name:"PULSE",damage:22,rate:180,speed:650,spread:.02,pellets:1,color:0x69f7ff,unlock:0},
 {name:"BLASTER",damage:15,rate:330,speed:620,spread:.18,pellets:5,color:0xffd166,unlock:3},
 {name:"NOVA",damage:75,rate:620,speed:540,spread:.04,pellets:1,color:0xff5c8a,unlock:7}
] as const;
type Kind="grunt"|"runner"|"tank"|"boss";
type Power="heal"|"rapid"|"damage";

class GameScene extends Phaser.Scene{
 player!:Phaser.GameObjects.Arc; cursors!:Phaser.Types.Input.Keyboard.CursorKeys; keys:any;
 enemies=new Set<Phaser.GameObjects.Arc>(); bullets=new Set<Phaser.GameObjects.Arc>(); pickups=new Set<Phaser.GameObjects.Arc>();
 hp=100; score=0; wave=1; weapon=0; lastShot=0; spawnTimer=0; pickupTimer=0; boss=false; dead=false; paused=false;
 coins=0; xp=0; rapidUntil=0; damageBoostUntil=0;
 joystickBase!:Phaser.GameObjects.Arc; joystickKnob!:Phaser.GameObjects.Arc; fireButton!:Phaser.GameObjects.Arc; pauseButton!:Phaser.GameObjects.Text;
 joyActive=false; joyX=0; joyY=0; firing=false;
 scoreText!:Phaser.GameObjects.Text; hpText!:Phaser.GameObjects.Text; waveText!:Phaser.GameObjects.Text; weaponText!:Phaser.GameObjects.Text; xpText!:Phaser.GameObjects.Text; coinText!:Phaser.GameObjects.Text; banner!:Phaser.GameObjects.Text;
 constructor(){super("game")}
 create(){
  this.add.grid(W/2,H/2,W,H,40,40,0x0d2035,.3,0x173b58,.22);
  this.player=this.add.circle(W/2,H/2,18,0x69e7ff).setStrokeStyle(3,0xffffff);
  this.cursors=this.input.keyboard!.createCursorKeys(); this.keys=this.input.keyboard!.addKeys("W,A,S,D,ONE,TWO,THREE,P");
  this.scoreText=this.add.text(18,14,"SCORE 0",{fontSize:"19px",color:"#fff"});
  this.hpText=this.add.text(18,41,"HP 100",{fontSize:"17px",color:"#69f7ff"});
  this.xpText=this.add.text(18,66,"XP 0",{fontSize:"15px",color:"#bda7ff"});
  this.coinText=this.add.text(18,88,"COINS 0",{fontSize:"15px",color:"#ffd166"});
  this.waveText=this.add.text(W-145,14,"WAVE 1",{fontSize:"19px",color:"#fff"});
  this.weaponText=this.add.text(W-145,41,"PULSE",{fontSize:"17px",color:"#ffd166"});
  this.pauseButton=this.add.text(W/2,H-20,"PAUSE",{fontSize:"14px",color:"#fff",backgroundColor:"#172a40",padding:{x:10,y:5}}).setOrigin(.5).setInteractive();
  this.pauseButton.on("pointerdown",()=>{if(!this.dead)this.paused=!this.paused});
  this.banner=this.add.text(W/2,78,"",{fontSize:"18px",fontStyle:"bold",color:"#fff",backgroundColor:"#10243a",padding:{x:12,y:6}}).setOrigin(.5).setAlpha(0).setDepth(30);
  this.setupMobileControls();
  this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{if(this.dead){this.scene.restart();return}if(p.x>W-150&&p.y>H-150)this.firing=true;else if(p.x>180||p.y<360)this.fire()});
  this.input.on("pointerup",()=>{this.firing=false;this.joyActive=false;this.joystickKnob.setPosition(90,H-90)});
  this.input.on("pointermove",(p:Phaser.Input.Pointer)=>{if(this.joyActive)this.updateJoystick(p)});
  this.input.keyboard!.on("keydown-ONE",()=>this.selectWeapon(0));this.input.keyboard!.on("keydown-TWO",()=>this.selectWeapon(1));this.input.keyboard!.on("keydown-THREE",()=>this.selectWeapon(2));
  this.input.keyboard!.on("keydown-P",()=>{if(!this.dead)this.paused=!this.paused});
 }
 setupMobileControls(){
  this.joystickBase=this.add.circle(90,H-90,58,0x17304a,.65).setStrokeStyle(2,0x69f7ff,.6).setDepth(10).setInteractive();
  this.joystickKnob=this.add.circle(90,H-90,25,0x69e7ff,.75).setDepth(11);
  this.fireButton=this.add.circle(W-85,H-85,58,0xff4d6d,.75).setStrokeStyle(2,0xffffff,.7).setDepth(10).setInteractive();
  this.add.text(W-85,H-85,"FIRE",{fontSize:"15px",fontStyle:"bold",color:"#fff"}).setOrigin(.5).setDepth(11);
  this.joystickBase.on("pointerdown",(p:Phaser.Input.Pointer)=>{this.joyActive=true;this.updateJoystick(p)});
  this.fireButton.on("pointerdown",()=>{this.firing=true;this.fire()});
 }
 updateJoystick(p:Phaser.Input.Pointer){const dx=p.x-90,dy=p.y-(H-90),len=Math.hypot(dx,dy)||1,max=40,s=Math.min(1,max/len);this.joyX=dx/max;this.joyY=dy/max;this.joystickKnob.setPosition(90+dx*s,H-90+dy*s)}
 selectWeapon(i:number){if(this.wave<weapons[i].unlock){this.showBanner(`🔒 ${weapons[i].name} unlocks at wave ${weapons[i].unlock}`);return}this.weapon=i;this.showBanner(`⚡ ${weapons[i].name} equipped`)}
 showBanner(t:string){this.banner.setText(t).setAlpha(1);this.tweens.killTweensOf(this.banner);this.tweens.add({targets:this.banner,alpha:0,delay:900,duration:450})}
 spawn(kind:Kind){
  let x=Phaser.Math.Between(0,W),y=Phaser.Math.Between(0,H);const side=Phaser.Math.Between(0,3);if(side===0)x=-30;if(side===1)x=W+30;if(side===2)y=-30;if(side===3)y=H+30;
  const r=kind==="boss"?40:kind==="tank"?25:kind==="runner"?13:17,c=kind==="boss"?0xff2857:kind==="tank"?0xff8614:kind==="runner"?0xff4d9d:0xff526b;
  const e=this.add.circle(x,y,r,c).setStrokeStyle(2,0xffffff) as Phaser.GameObjects.Arc;
  (e as any).kind=kind;(e as any).hp=kind==="boss"?1000:kind==="tank"?180:kind==="runner"?45:70;(e as any).speed=kind==="boss"?45:kind==="tank"?55:kind==="runner"?150:85;this.enemies.add(e);
 }
 dropPickup(x:number,y:number){const kinds:Power[]=["heal","rapid","damage"];const k=kinds[Phaser.Math.Between(0,2)],colors={heal:0x50e890,rapid:0x69e7ff,damage:0xff5c8a};const p=this.add.circle(x,y,12,colors[k]).setStrokeStyle(2,0xffffff) as Phaser.GameObjects.Arc;(p as any).power=k;this.pickups.add(p)}
 fire(){const w=weapons[this.weapon],now=this.time.now,rate=now<this.rapidUntil?w.rate*.45:w.rate;if(now-this.lastShot<rate)return;this.lastShot=now;const p=this.input.activePointer,a=Phaser.Math.Angle.Between(this.player.x,this.player.y,p.worldX,p.worldY);for(let i=0;i<w.pellets;i++){const ang=a+Phaser.Math.FloatBetween(-w.spread,w.spread),b=this.add.circle(this.player.x,this.player.y,5,w.color);(b as any).vx=Math.cos(ang)*w.speed;(b as any).vy=Math.sin(ang)*w.speed;(b as any).damage=w.damage*(now<this.damageBoostUntil?1.7:1);this.bullets.add(b)}}
 update(_:number,dt:number){
  if(this.dead||this.paused)return;let dx=0,dy=0;if(this.cursors.left.isDown||this.keys.A.isDown)dx--;if(this.cursors.right.isDown||this.keys.D.isDown)dx++;if(this.cursors.up.isDown||this.keys.W.isDown)dy--;if(this.cursors.down.isDown||this.keys.S.isDown)dy++;if(this.joyActive){dx=this.joyX;dy=this.joyY}
  const l=Math.hypot(dx,dy)||1;this.player.x=Phaser.Math.Clamp(this.player.x+dx/l*260*dt/1000,20,W-20);this.player.y=Phaser.Math.Clamp(this.player.y+dy/l*260*dt/1000,70,H-70);if(this.input.activePointer.isDown||this.firing)this.fire();
  this.spawnTimer-=dt;if(this.spawnTimer<=0){const n=Math.min(1+Math.floor(this.wave/2),5);for(let i=0;i<n;i++)this.spawn(this.wave>=4&&Math.random()<.12?"tank":Math.random()<.22?"runner":"grunt");this.spawnTimer=Math.max(250,950-this.wave*30)}
  if(this.wave%5===0&&!this.boss){this.spawn("boss");this.boss=true;this.showBanner("👑 BOSS WAVE")}
  this.pickupTimer-=dt;if(this.pickupTimer<=0){this.dropPickup(Phaser.Math.Between(100,W-100),Phaser.Math.Between(130,H-130));this.pickupTimer=12000}
  for(const b of [...this.bullets]){b.x+=(b as any).vx*dt/1000;b.y+=(b as any).vy*dt/1000;if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30){b.destroy();this.bullets.delete(b);continue}for(const e of [...this.enemies])if(e.active&&Phaser.Math.Distance.Between(b.x,b.y,e.x,e.y)<e.width/2+5){(e as any).hp-=(b as any).damage;b.destroy();this.bullets.delete(b);if((e as any).hp<=0){const k=(e as any).kind as Kind;this.score+=k==="boss"?1000:k==="tank"?250:k==="runner"?120:80;this.xp+=k==="boss"?100:k==="tank"?25:10;this.coins+=k==="boss"?50:k==="tank"?12:4;if(Math.random()<.12)this.dropPickup(e.x,e.y);e.destroy();this.enemies.delete(e);if(k==="boss"){this.boss=false;this.showBanner("🏆 BOSS DEFEATED +50 COINS")}}break}}
  for(const e of [...this.enemies]){const a=Phaser.Math.Angle.Between(e.x,e.y,this.player.x,this.player.y);e.x+=Math.cos(a)*(e as any).speed*dt/1000;e.y+=Math.sin(a)*(e as any).speed*dt/1000;if(Phaser.Math.Distance.Between(e.x,e.y,this.player.x,this.player.y)<e.width/2+18){this.hp-=(e as any).kind==="boss"?25:10;e.destroy();this.enemies.delete(e)}}
  for(const p of [...this.pickups])if(Phaser.Math.Distance.Between(p.x,p.y,this.player.x,this.player.y)<32){const k=(p as any).power as Power;if(k==="heal"){this.hp=Math.min(100,this.hp+30);this.showBanner("💚 +30 HP")}if(k==="rapid"){this.rapidUntil=this.time.now+7000;this.showBanner("⚡ RAPID FIRE 7s")}if(k==="damage"){this.damageBoostUntil=this.time.now+7000;this.showBanner("🔥 DAMAGE BOOST 7s")}p.destroy();this.pickups.delete(p)}
  const nextWave=1+Math.floor(this.score/1000);if(nextWave>this.wave){this.wave=nextWave;this.hp=Math.min(100,this.hp+15);this.showBanner(`🌊 WAVE ${this.wave} • +15 HP`)}
  this.hpText.setText("HP "+Math.max(0,Math.ceil(this.hp)));this.scoreText.setText("SCORE "+this.score);this.xpText.setText("XP "+this.xp);this.coinText.setText("COINS "+this.coins);this.waveText.setText("WAVE "+this.wave);this.weaponText.setText(weapons[this.weapon].name);if(this.hp<=0)this.end();
 }
 end(){this.dead=true;this.add.rectangle(W/2,H/2,W,H,0x000000,.78).setDepth(20);this.add.text(W/2,H/2-55,"GAME OVER",{fontSize:"52px",fontStyle:"bold",color:"#ff5c7a"}).setOrigin(.5).setDepth(21);this.add.text(W/2,H/2+10,`Score ${this.score} • Wave ${this.wave}\nCoins ${this.coins} • XP ${this.xp}\nTap / click to restart`,{fontSize:"20px",align:"center",color:"#fff"}).setOrigin(.5).setDepth(21)}
}
new Phaser.Game({type:Phaser.AUTO,width:W,height:H,parent:"game",backgroundColor:"#08111f",scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:GameScene});