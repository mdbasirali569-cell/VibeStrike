import Phaser from "phaser";
export type ArenaObstacle={x:number;y:number;width:number;height:number};
export class ArenaSystem {
  obstacles:ArenaObstacle[]=[];
  constructor(private scene:Phaser.Scene){this.build();}
  build(){
    this.obstacles=[
      {x:220,y:190,width:150,height:28},{x:590,y:190,width:150,height:28},
      {x:220,y:360,width:150,height:28},{x:590,y:360,width:150,height:28},
      {x:450,y:245,width:60,height:50}
    ];
    for(const o of this.obstacles){
      this.scene.add.rectangle(o.x,o.y,o.width,o.height,0x142c46,.95).setStrokeStyle(2,0x3d718f,.8);
    }
  }
  blocked(x:number,y:number,r=18){return this.obstacles.some(o=>x+r>o.x-o.width/2&&x-r<o.x+o.width/2&&y+r>o.y-o.height/2&&y-r<o.y+o.height/2)}
}
