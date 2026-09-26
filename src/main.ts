import Phaser from "phaser";
import "./style.css";
import { CombatVFX } from "./game/CombatVFX";
import { BossSystem } from "./game/BossSystem";

const W=960,H=540;
const weapons=[
  {name:"PULSE",damage:22,rate:180,speed:650,spread:.02,pellets:1,color:0x69f7ff,unlock:0},
  {name:"BLASTER",damage:15,rate:330,speed:620,spread:.18,pellets:5,color:0xffd166,unlock:3},
  {name:"NOVA",damage:75,rate:620,speed:540,spread:.04,pellets:1,color:0xff5c8a,unlock:7}
] as const;
type Kind="grunt"|"runner"|"tank"|"boss";
type Power="heal"|"rapid"|"damage";

class GameScene extends Phaser.Scene{
  player!:Phaser.GameObjects.Arc;
  cursors!:Phaser.Types.Input.Keyboard.CursorKeys;
  keys:any;
  enemies=new Set<Phaser.GameObjects.Container>();
  bullets=new Set<Phaser.GameObjects.Arc>();
  pickups=new Set<Phaser.GameObjects.Arc>();
  vfx!:CombatVFX;
  bossSystem:BossSystem|null=null;

  hp=100;score=0;wave=1;weapon=0;lastShot=0;spawnTimer=0;pickupTimer=0;
  boss=false;dead=false;paused=false;coins=0;xp=0;rapidUntil=0;damageBoostUntil=0;
  damageLevel=0;fireLevel=0;
  joystickBase!:Phaser.GameObjects.Arc;
  joystickKnob!:Phaser.GameObjects.Arc;
  fireButton!:Phaser.GameObjects.Arc;
  fireGlow!:Phaser.GameObjects.Arc;
  pauseButton!:Phaser.GameObjects.Text;
  banner!:Phaser.GameObjects.Text;
  joyActive=false;joyX=0;joyY=0;firing=false;
  menu!:HTMLDivElement;
  scoreText!:Phaser.GameObjects.Text;hpText!:Phaser.GameObjects.Text;
  waveText!:Phaser.GameObjects.Text;weaponText!:Phaser.GameObjects.Text;
  xpText!:Phaser.GameObjects.Text;coinText!:Phaser.GameObjects.Text;

  constructor(){super("game")}

  create(){
    this.vfx=new CombatVFX(this);
    this.add.grid(W/2,H/2,W,H,40,40,0x0d2035,.3,0x173b58,.22);
    this.player=this.add.circle(W/2,H/2,18,0x69e7ff).setStrokeStyle(3,0xffffff);
    this.cursors=this.input.keyboard!.createCursorKeys();
    this.keys=this.input.keyboard!.addKeys("W,A,S,D,ONE,TWO,THREE,P,B");

    this.scoreText=this.add.text(18,14,"SCORE 0",{fontSize:"19px",color:"#fff"});
    this.hpText=this.add.text(18,41,"HP 100",{fontSize:"17px",color:"#69f7ff"});
    this.xpText=this.add.text(18,66,"XP 0",{fontSize:"15px",color:"#bda7ff"});
    this.coinText=this.add.text(18,88,"COINS 0",{fontSize:"15px",color:"#ffd166"});
    this.waveText=this.add.text(W-145,14,"WAVE 1",{fontSize:"19px",color:"#fff"});
    this.weaponText=this.add.text(W-145,41,"PULSE",{fontSize:"17px",color:"#ffd166"});

    this.pauseButton=this.add.text(W/2,H-20,"PAUSE",{fontSize:"14px",color:"#fff",backgroundColor:"#172a40",padding:{x:10,y:5}})
      .setOrigin(.5).setInteractive();
    this.pauseButton.on("pointerdown",()=>{if(!this.dead)this.paused=!this.paused});

    this.banner=this.add.text(W/2,78,"",{fontSize:"18px",fontStyle:"bold",color:"#fff",backgroundColor:"#10243a",padding:{x:12,y:6}})
      .setOrigin(.5).setAlpha(0).setDepth(30);

    this.setupMobileControls();
    this.setupMenu();

    this.input.on("pointerdown",(p:Phaser.Input.Pointer)=>{
      if(this.dead){this.scene.restart();return}
      if(p.x>W-190&&p.y>H-190){this.firing=true;this.fire()}
      else if(p.x>180||p.y<350)this.fire();
    });
    this.input.on("pointerup",()=>{
      this.firing=false;
      this.joyActive=false;
      this.joystickKnob.setPosition(90,H-90);
      this.joystickKnob.setScale(1);
    });
    this.input.on("pointermove",(p:Phaser.Input.Pointer)=>{if(this.joyActive)this.updateJoystick(p)});
    this.input.keyboard!.on("keydown-ONE",()=>this.selectWeapon(0));
    this.input.keyboard!.on("keydown-TWO",()=>this.selectWeapon(1));
    this.input.keyboard!.on("keydown-THREE",()=>this.selectWeapon(2));
    this.input.keyboard!.on("keydown-P",()=>{if(!this.dead)this.paused=!this.paused});
    this.input.keyboard!.on("keydown-B",()=>this.toggleMenu());
  }

  setupMenu(){
    const s=document.createElement("div");
    s.className="vs-menu";
    s.innerHTML='<div class="vs-card"><div class="vs-logo">VIBESTRIKE</div><div class="vs-sub">NEON SURVIVAL</div><button id="vs-resume">RESUME</button><button id="vs-upgrade">UPGRADES</button><div id="vs-shop" class="vs-shop"></div><div class="vs-tip">B = menu • P = pause • 1/2/3 = weapons</div></div>';
    document.body.appendChild(s);this.menu=s;
    (s.querySelector("#vs-resume") as HTMLButtonElement).onclick=()=>this.toggleMenu(false);
    (s.querySelector("#vs-upgrade") as HTMLButtonElement).onclick=()=>this.renderShop();
    this.renderShop();s.style.display="none";
  }

  renderShop(){
    const box=this.menu.querySelector("#vs-shop")!;
    box.innerHTML=`<div>🪙 ${this.coins} coins</div><button data-u="d">🔥 Damage +15% — ${25+this.damageLevel*25}</button><button data-u="f">⚡ Fire rate +10% — ${30+this.fireLevel*30}</button>`;
    box.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{
      const u=(b as HTMLElement).dataset.u!,cost=u==="d"?25+this.damageLevel*25:30+this.fireLevel*30;
      if(this.coins<cost){this.showBanner("🪙 Not enough coins");return}
      this.coins-=cost;if(u==="d")this.damageLevel++;else this.fireLevel++;
      this.renderShop();this.updateHud();this.beep(720,.08);
    }));
  }

  toggleMenu(force?:boolean){
    const show=force??this.menu.style.display==="none";
    this.menu.style.display=show?"flex":"none";this.paused=show;if(show)this.renderShop();
  }

  setupMobileControls(){
    // Larger, separated joystick with a premium layered look.
    this.joystickBase=this.add.circle(92,H-92,64,0x071827,.86).setStrokeStyle(3,0x69f7ff,.72).setDepth(10).setInteractive();
    this.add.circle(92,H-92,52,0x12324c,.45).setStrokeStyle(2,0x69f7ff,.25).setDepth(10);
    this.joystickKnob=this.add.circle(92,H-92,28,0x69e7ff,.9).setStrokeStyle(3,0xffffff,.8).setDepth(11);
    this.add.circle(92,H-92,11,0xffffff,.22).setDepth(12);

    // Larger fire button with press feedback and glow ring.
    this.fireGlow=this.add.circle(W-92,H-92,76,0xff4d6d,.08).setStrokeStyle(3,0xff6f8c,.35).setDepth(9);
    this.fireButton=this.add.circle(W-92,H-92,64,0xff3155,.92).setStrokeStyle(3,0xffffff,.8).setDepth(10).setInteractive();
    this.add.circle(W-92,H-92,48,0xff5270,.35).setDepth(10);
    this.add.text(W-92,H-99,"FIRE",{fontSize:"16px",fontStyle:"bold",color:"#fff"}).setOrigin(.5).setDepth(11);
    this.add.text(W-92,H-78,"AUTO / TAP",{fontSize:"9px",color:"#ffe8ed"}).setOrigin(.5).setDepth(11);

    this.joystickBase.on("pointerdown",(p:Phaser.Input.Pointer)=>{this.joyActive=true;this.updateJoystick(p)});
    this.fireButton.on("pointerdown",()=>{
      this.firing=true;this.fireButton.setScale(.9);this.fireGlow.setAlpha(.35);this.fire();
    });
    this.fireButton.on("pointerup",()=>{this.firing=false;this.fireButton.setScale(1);this.fireGlow.setAlpha(.08)});
    this.fireButton.on("pointerout",()=>{this.firing=false;this.fireButton.setScale(1);this.fireGlow.setAlpha(.08)});
  }

  updateJoystick(p:Phaser.Input.Pointer){
    const dx=p.x-92,dy=p.y-(H-92),len=Math.hypot(dx,dy)||1,max=44,s=Math.min(1,max/len);
    this.joyX=dx/max;this.joyY=dy/max;
    this.joystickKnob.setPosition(92+dx*s,H-92+dy*s);
  }

  selectWeapon(i:number){
    if(this.wave<weapons[i].unlock){this.showBanner(`🔒 ${weapons[i].name} unlocks at wave ${weapons[i].unlock}`);return}
    this.weapon=i;this.showBanner(`⚡ ${weapons[i].name} equipped`);this.beep(640,.07);
  }

  showBanner(t:string){
    this.banner.setText(t).setAlpha(1);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({targets:this.banner,alpha:0,delay:900,duration:450});
  }

  beep(freq:number,dur:number){
    try{
      const C=window.AudioContext||(window as any).webkitAudioContext;if(!C)return;
      const c=new C(),o=c.createOscillator(),g=c.createGain();
      o.frequency.value=freq;o.type="sine";g.gain.setValueAtTime(.035,c.currentTime);
      g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.connect(g);g.connect(c.destination);
      o.start();o.stop(c.currentTime+dur);
    }catch{}
  }

  makeAnimeEnemy(x:number,y:number,kind:Kind){
    const scale=kind==="boss"?2.0:kind==="tank"?1.35:kind==="runner"?.82:1;
    const c=this.add.container(x,y).setDepth(5);
    const g=this.add.graphics();
    const hair=kind==="boss"?0x24153d:kind==="tank"?0x173b58:kind==="runner"?0x5b1748:0x24305b;
    const suit=kind==="boss"?0xff2857:kind==="tank"?0xff8614:kind==="runner"?0xff4d9d:0x526bff;
    g.fillStyle(0x151a2d,1);g.fillRoundedRect(-18,-2,36,40,12);
    g.fillStyle(suit,1);g.fillRoundedRect(-16,5,32,31,9);
    g.fillStyle(0xffd0b5,1);g.fillCircle(0,-17,17);
    g.fillStyle(hair,1);g.fillCircle(0,-25,18);g.fillRect(-18,-25,36,12);
    g.fillStyle(0xffe5f2,1);g.fillCircle(-6,-16,4);g.fillCircle(6,-16,4);
    g.fillStyle(0x22243a,1);g.fillCircle(-6,-16,2);g.fillCircle(6,-16,2);
    g.lineStyle(2,0x5a243d,1);g.beginPath();g.arc(0,-10,6,.15,2.99);g.strokePath();
    g.fillStyle(0x69f7ff,.75);g.fillCircle(-20,18,4);g.fillCircle(20,18,4);
    if(kind==="boss"){g.lineStyle(3,0xffd166,1);g.beginPath();g.moveTo(-14,-38);g.lineTo(-7,-52);g.lineTo(0,-39);g.lineTo(7,-52);g.lineTo(14,-38);g.strokePath()}
    c.add(g);c.setScale(scale);c.setSize(42*scale,58*scale);
    (c as any).kind=kind;
    (c as any).hp=kind==="boss"?1000+this.wave*80:kind==="tank"?180:kind==="runner"?45:70;
    (c as any).speed=kind==="boss"?45:kind==="tank"?55:kind==="runner"?150:85;
    this.enemies.add(c);
    if(kind==="boss"){this.bossSystem=new BossSystem(this,(c as any).hp);this.showBanner("👑 ANIME BOSS ONLINE")}
  }

  spawn(kind:Kind){
    let x=Phaser.Math.Between(0,W),y=Phaser.Math.Between(0,H);
    const side=Phaser.Math.Between(0,3);
    if(side===0)x=-45;if(side===1)x=W+45;if(side===2)y=-60;if(side===3)y=H+60;
    this.makeAnimeEnemy(x,y,kind);
  }

  dropPickup(x:number,y:number){
    const ks:Power[]=["heal","rapid","damage"],k=ks[Phaser.Math.Between(0,2)];
    const cs={heal:0x50e890,rapid:0x69e7ff,damage:0xff5c8a};
    const p=this.add.circle(x,y,12,cs[k]).setStrokeStyle(2,0xffffff) as Phaser.GameObjects.Arc;
    (p as any).power=k;this.pickups.add(p);
  }

  fire(){
    const w=weapons[this.weapon],now=this.time.now;
    const rate=w.rate*(1-this.fireLevel*.1)*(now<this.rapidUntil?.45:1);
    if(now-this.lastShot<rate)return;
    this.lastShot=now;this.beep(220+this.weapon*100,.045);
    this.vfx.muzzle(this.player.x,this.player.y,w.color);
    const p=this.input.activePointer;
    const a=Phaser.Math.Angle.Between(this.player.x,this.player.y,p.worldX,p.worldY);
    for(let i=0;i<w.pellets;i++){
      const ang=a+Phaser.Math.FloatBetween(-w.spread,w.spread);
      const b=this.add.circle(this.player.x,this.player.y,5,w.color);
      (b as any).vx=Math.cos(ang)*w.speed;(b as any).vy=Math.sin(ang)*w.speed;
      (b as any).damage=w.damage*(1+this.damageLevel*.15)*(now<this.damageBoostUntil?1.7:1);
      this.bullets.add(b);
    }
  }

  update(_:number,dt:number){
    if(this.dead||this.paused)return;
    let dx=0,dy=0;
    if(this.cursors.left.isDown||this.keys.A.isDown)dx--;
    if(this.cursors.right.isDown||this.keys.D.isDown)dx++;
    if(this.cursors.up.isDown||this.keys.W.isDown)dy--;
    if(this.cursors.down.isDown||this.keys.S.isDown)dy++;
    if(this.joyActive){dx=this.joyX;dy=this.joyY}
    const l=Math.hypot(dx,dy)||1;
    this.player.x=Phaser.Math.Clamp(this.player.x+dx/l*260*dt/1000,20,W-20);
    this.player.y=Phaser.Math.Clamp(this.player.y+dy/l*260*dt/1000,70,H-70);
    if(this.input.activePointer.isDown||this.firing)this.fire();

    this.spawnTimer-=dt;
    if(this.spawnTimer<=0){
      const n=Math.min(1+Math.floor(this.wave/2),6);
      for(let i=0;i<n;i++)this.spawn(this.wave>=4&&Math.random()<.14?"tank":Math.random()<.22?"runner":"grunt");
      this.spawnTimer=Math.max(250,950-this.wave*30);
    }
    if(this.wave%5===0&&!this.boss){this.spawn("boss");this.boss=true;this.showBanner("👑 ANIME BOSS WAVE");this.beep(110,.25)}

    this.pickupTimer-=dt;
    if(this.pickupTimer<=0){this.dropPickup(Phaser.Math.Between(100,W-100),Phaser.Math.Between(130,H-130));this.pickupTimer=12000}

    for(const b of [...this.bullets]){
      b.x+=(b as any).vx*dt/1000;b.y+=(b as any).vy*dt/1000;
      if(b.x<-30||b.x>W+30||b.y<-30||b.y>H+30){b.destroy();this.bullets.delete(b);continue}
      for(const e of [...this.enemies]){
        if(e.active&&Phaser.Math.Distance.Between(b.x,b.y,e.x,e.y)<Math.max(e.width,e.height)/2+5){
          (e as any).hp-=(b as any).damage;this.vfx.hit(b.x,b.y,weapons[this.weapon].color);
          b.destroy();this.bullets.delete(b);
          if((e as any).kind==="boss"&&this.bossSystem){this.bossSystem.damage((b as any).damage);(e as any).hp=this.bossSystem.hp;if(this.bossSystem.phase>1)this.showBanner(`👑 BOSS PHASE ${this.bossSystem.phase}`)}
          if((e as any).hp<=0){
            const k=(e as any).kind as Kind;
            this.score+=k==="boss"?1000:k==="tank"?250:k==="runner"?120:80;
            this.xp+=k==="boss"?100:k==="tank"?25:10;this.coins+=k==="boss"?50:k==="tank"?12:4;
            if(Math.random()<.14)this.dropPickup(e.x,e.y);
            this.vfx.explosion(e.x,e.y,k==="boss"?0xff2857:weapons[this.weapon].color);
            e.destroy();this.enemies.delete(e);this.beep(480,.04);
            if(k==="boss"){this.boss=false;this.bossSystem=null;this.showBanner("🏆 ANIME BOSS DEFEATED +50 COINS");this.beep(880,.18)}
          }
          break;
        }
      }
    }

    for(const e of [...this.enemies]){
      const a=Phaser.Math.Angle.Between(e.x,e.y,this.player.x,this.player.y);
      e.x+=Math.cos(a)*(e as any).speed*dt/1000;e.y+=Math.sin(a)*(e as any).speed*dt/1000;
      if(Phaser.Math.Distance.Between(e.x,e.y,this.player.x,this.player.y)<Math.max(e.width,e.height)/2+18){
        this.hp-=(e as any).kind==="boss"?25:10;this.vfx.hit(this.player.x,this.player.y,0xff5c7a);
        e.destroy();this.enemies.delete(e);this.beep(90,.09);
      }
    }

    for(const p of [...this.pickups])if(Phaser.Math.Distance.Between(p.x,p.y,this.player.x,this.player.y)<32){
      const k=(p as any).power as Power;
      if(k==="heal"){this.hp=Math.min(100,this.hp+30);this.showBanner("💚 +30 HP")}
      if(k==="rapid"){this.rapidUntil=this.time.now+7000;this.showBanner("⚡ RAPID FIRE 7s")}
      if(k==="damage"){this.damageBoostUntil=this.time.now+7000;this.showBanner("🔥 DAMAGE BOOST 7s")}
      p.destroy();this.pickups.delete(p);
    }

    const nw=1+Math.floor(this.score/1000);
    if(nw>this.wave){this.wave=nw;this.hp=Math.min(100,this.hp+15);this.showBanner(`🌊 WAVE ${this.wave} • +15 HP`);this.beep(760,.12)}
    this.updateHud();if(this.hp<=0)this.end();
  }

  updateHud(){
    this.hpText.setText("HP "+Math.max(0,Math.ceil(this.hp)));
    this.scoreText.setText("SCORE "+this.score);this.xpText.setText("XP "+this.xp);
    this.coinText.setText("COINS "+this.coins);this.waveText.setText("WAVE "+this.wave);
    this.weaponText.setText(weapons[this.weapon].name);
  }

  end(){
    this.dead=true;
    this.add.rectangle(W/2,H/2,W,H,0x000000,.8).setDepth(20);
    this.add.text(W/2,H/2-55,"GAME OVER",{fontSize:"52px",fontStyle:"bold",color:"#ff5c7a"}).setOrigin(.5).setDepth(21);
    this.add.text(W/2,H/2+10,`Score ${this.score} • Wave ${this.wave}\nCoins ${this.coins} • XP ${this.xp}\nTap / click to restart`,{fontSize:"20px",align:"center",color:"#fff"}).setOrigin(.5).setDepth(21);
  }
}

new Phaser.Game({
  type:Phaser.AUTO,width:W,height:H,parent:"game",backgroundColor:"#08111f",
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:GameScene
});
