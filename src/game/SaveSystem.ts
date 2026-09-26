export type SaveData={coins:number;xp:number;level:number;damageLevel:number;fireLevel:number;unlockedWeapons:number[];settings:{music:boolean;sfx:boolean;vibration:boolean}};
const KEY="vibestrike-save-v1";
export class SaveSystem{
  static defaults():SaveData{return {coins:0,xp:0,level:1,damageLevel:0,fireLevel:0,unlockedWeapons:[0],settings:{music:true,sfx:true,vibration:true}}}
  static load():SaveData{try{const raw=localStorage.getItem(KEY);if(!raw)return this.defaults();return {...this.defaults(),...JSON.parse(raw)}}catch{return this.defaults()}}
  static save(data:SaveData){try{localStorage.setItem(KEY,JSON.stringify(data))}catch{}}
  static reset(){try{localStorage.removeItem(KEY)}catch{}}
}
