import "./style.css";

const songs=[
 {title:"Midnight Drive",artist:"VibeStrike",cover:"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80"},
 {title:"Neon Dreams",artist:"Nova",cover:"https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&q=80"},
 {title:"Afterglow",artist:"The Waves",cover:"https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80"},
 {title:"Lost in Sound",artist:"Aero",cover:"https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&q=80"}
];

let current=0, playing=false;
const app=document.querySelector("#app");

app.innerHTML=`
<div class="shell">
 <aside class="sidebar">
  <div class="brand"><span>V</span> VibeStrike</div>
  <nav>
   <button class="active">⌂ <b>Home</b></button>
   <button>⌕ <b>Search</b></button>
   <button>♥ <b>Your Library</b></button>
  </nav>
  <div class="side-title">Your playlists</div>
  <button class="playlist">＋ Create playlist</button>
  <button class="playlist">Liked Songs</button>
 </aside>
 <main>
  <header><div class="mobile-brand">VibeStrike</div><div class="search">⌕ <input placeholder="Search songs, artists, albums"></div><button class="profile">Sign in</button></header>
  <section class="hero">
   <div><p class="eyebrow">YOUR MUSIC, YOUR VIBE</p><h1>Listen without limits.</h1><p class="sub">Discover songs, build playlists and enjoy a smooth music experience.</p><button class="primary" id="playHero">▶ Start listening</button></div>
  </section>
  <section><div class="section-head"><h2>Trending now</h2><button>See all</button></div><div class="grid" id="grid"></div></section>
  <section><div class="section-head"><h2>Made for you</h2></div><div class="rows" id="rows"></div></section>
 </main>
 <footer class="player">
  <div class="track"><img id="cover" src=""><div><strong id="title"></strong><small id="artist"></small></div></div>
  <div class="controls"><button id="prev">◀</button><button class="play" id="play">▶</button><button id="next">▶</button><div class="bar"><span id="progress"></span></div></div>
  <div class="player-right">♡ &nbsp; 🔊</div>
 </footer>
</div>`;

const grid=document.querySelector("#grid"), rows=document.querySelector("#rows");
grid.innerHTML=songs.map((s,i)=>`<article class="card" data-i="${i}"><img src="${s.cover}"><button class="card-play">▶</button><h3>${s.title}</h3><p>${s.artist}</p></article>`).join("");
rows.innerHTML=songs.map((s,i)=>`<button class="row" data-i="${i}"><img src="${s.cover}"><span><b>${s.title}</b><small>${s.artist}</small></span><em>•••</em></button>`).join("");

function load(i){current=(i+songs.length)%songs.length;const s=songs[current];document.querySelector("#cover").src=s.cover;document.querySelector("#title").textContent=s.title;document.querySelector("#artist").textContent=s.artist;}
function toggle(){playing=!playing;document.querySelector("#play").textContent=playing?"❚❚":"▶";document.querySelector("#playHero").textContent=playing?"❚❚ Playing":"▶ Start listening";}
document.querySelectorAll("[data-i]").forEach(x=>x.onclick=()=>{load(+x.dataset.i);if(!playing)toggle()});
document.querySelector("#play").onclick=toggle;
document.querySelector("#playHero").onclick=toggle;
document.querySelector("#next").onclick=()=>{load(current+1);playing=true;document.querySelector("#play").textContent="❚❚"};
document.querySelector("#prev").onclick=()=>{load(current-1);playing=true;document.querySelector("#play").textContent="❚❚"};
load(0);
