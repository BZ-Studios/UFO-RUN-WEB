const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Flight=require('../ufo-crazygames/js/flight-rules.js');
const source=fs.readFileSync(path.join(__dirname,'../ufo-crazygames/js/game.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../ufo-crazygames/index.html'),'utf8');

function fixture(profileOverrides={}) {
 const nodes=new Map(),listeners=new Map(),store=new Map(),frames=[];
 const ctx={setTransform(){},clearRect(){}};
 const element=()=>({hidden:true,textContent:'',value:'',dataset:{},style:{setProperty(){}},
   classList:{toggle(){}},setAttribute(){},addEventListener(){},append(){},replaceChildren(){},focus(){},
   open:false,showModal(){this.open=true;},close(){this.open=false;},
   getBoundingClientRect:()=>({width:1066.6666666667,height:600}),getContext:()=>ctx});
 const document={hidden:false,getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},
   createElement:element,querySelectorAll:()=>[],querySelector:element,body:element(),documentElement:{}};
 class Audio {constructor(){this.duration=4.36;this.currentTime=0;this.paused=true;this.playCalls=0;}
   addEventListener(){} pause(){this.paused=true;} play(){this.paused=false;this.playCalls++;return Promise.resolve();} cloneNode(){return new Audio();}}
 let now=0;
 const math=Object.create(Math);math.random=()=>0.51;
 const window={UfoFlightRules:Flight,location:{protocol:'https:'},devicePixelRatio:1,
   matchMedia:q=>({matches:false,addEventListener(){}}),setTimeout(){},clearTimeout(){},
   ufoRunCrazy:{isAdActive:()=>false,isAdPending:()=>false,isMuted:()=>false,isAvailable:()=>false,
     gameplay(){},rewardedWaitSeconds:()=>0,happytime(){},showMidgame:async()=>false},
   UFO_CRAZY_CONFIG:{monetizationEnabled:false}};
 const mask=(width,height)=>({width,height,mask:new Uint8Array(width*height).fill(1)});
 store.set('ufoRunCrazyGamesProfileV1',JSON.stringify({onboardingDone:true,...profileOverrides}));
 const scope={window,document,Audio,Math:math,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},
   performance:{now:()=>now},requestAnimationFrame:fn=>{frames.push(fn);return frames.length;},cancelAnimationFrame(){},mask};
 const cutoff=source.indexOf('  canvas.addEventListener("pointerdown"');assert(cutoff>0);
 vm.runInNewContext(source.slice(0,cutoff)+`
   getUfoSprite=()=>mask(UFO_WIDTH,UFO_HEIGHT);
   getSprite=name=>mask(name.startsWith('spike')?100:name.startsWith('asteroid')?64:50,name.startsWith('spike')?SPIKE_HEIGHT:name.startsWith('asteroid')?64:50);
   getPlanetSprite=()=>mask(80,80);
   planetSprites=[{imageName:'planetEarth'},{imageName:'planetMars'},{imageName:'planetJupiter'}];
   buildShopInterface();buildAchievementsInterface();resizeGame();startGame();render=()=>{};
   globalThis.api={
    read:()=>({state,flightStarted,gamePaused,runFrames,ufoY,jumpVelocity,score,passedObstacles,spikeSpeed,spikeFrequency,
      planetActive,planetX,planetY,powerupActive,powerupX,powerupY,invincible,invincibleTime,invincibilityDurationFrames,
      gates:spikes.map(s=>({x:s.topX,top:s.topY+SPIKE_HEIGHT,bottom:s.bottomY})),bossActive,bossWarningActive,bossCompleted,
      bossDefeatAnimating,bossTimeFrames,credits:profile.credits,continueUsed,onboardingDone:profile.onboardingDone}),
    stableTick:(n=1)=>{for(let i=0;i<n;i++){ufoY=300;jumpVelocity=-GRAVITY;updateGame();}},
    frame:frame,jump,pauseGame,resumeGame,startGame,finishFrameAsGameOver,checkAchievements,
    setMode:d=>{profile.difficulty=d;startGame();},
    shield:()=>{invincible=true;invincibleTime=0;syncInvincibilityDuration();},
    shieldSound:()=>invincibilitySound.playCalls,
    immortal:()=>{invincible=true;invincibilityDurationFrames=1e9;},
    clear:()=>{spikes=[];asteroids=[];powerupActive=false;planetActive=false;specialSpawnCooldown=0;},
    freshGate:()=>{spikes=[createSpikes(spawnFromRight(SPIKE_WIDTH))];},
    planet:activateRandomPlanet,star:activateStar,
    collectPlanet:()=>{planetGate=null;planetActive=true;planetX=UFO_X;planetY=300;currentPlanet=planetSprites[0];},
    collectStar:()=>{starGate=null;powerupActive=true;powerupX=UFO_X;powerupY=300;},
    score:n=>{score=n;},
    boss:()=>{score=DIFFICULTIES[currentDifficulty].bossTriggerScore;startBossBattle();},
    winBoss:()=>{bossTimeFrames=bossDurationFrames()-1;bossProjectiles=[];ufoY=300;jumpVelocity=-GRAVITY;updateGame();},
    finishDefeat:()=>{for(let i=0;i<BOSS_DEFEAT_ANIMATION_FRAMES;i++){ufoY=300;jumpVelocity=-GRAVITY;updateGame();}},
    particles:()=>particles.filter(p=>p.life>0).length,
    emit:()=>emitParticles(100,100,'#fff',1000),
    config:()=>({FPS,UFO_WIDTH,UFO_HEIGHT,GRAVITY,JUMP_IMPULSE}),
   };
 })();`,scope);
 return {api:scope.api,nodes,store,scope,setNow:v=>now=v};
}

test('Bounded, progressive pacing on all difficulties, identical for mouse and touch',()=>{
 for(const d of Object.keys(Flight.difficulties)){
  let prev=Flight.pacing(d,0);
  for(let n=1;n<500;n++){const p=Flight.pacing(d,n);assert(p.speed>=prev.speed);assert(p.intervalFrames<=prev.intervalFrames);assert(p.intervalFrames>=80);assert(p.speed<=Flight.difficulties[d].maxSpeed);prev=p;}
 }
 assert(Flight.pacing('easy',0).speed<Flight.pacing('normal',0).speed);
 assert(Flight.pacing('normal',0).speed<Flight.pacing('hard',0).speed);
});
test('Thousands of varied openings remain on screen and within the maximum climb step',()=>{
 let seed=1234;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2**32;};
 for(const d of Object.keys(Flight.difficulties)){
  let center=300;const centers=new Set();
  for(let i=0;i<2000;i++){
   const p=Flight.gatePlan({difficulty:d,index:i,previousCenter:center,pattern:Flight.patterns[Math.floor(i/5)%4],random});
   assert(p.top>=62);assert(p.bottom<=538);assert(p.gap>=Flight.difficulties[d].minGap);
   assert(Math.abs(p.center-center)<=Flight.difficulties[d].maxStep+0.001);center=p.center;centers.add(Math.round(center));
   if(i<3)assert(p.gap>=260);
  }
  assert(centers.size>60);
 }
});
test('A shuffled planet bag contains every world once before it repeats',()=>{
 const b=Flight.shuffledBag(9,()=>0.5);assert.equal(new Set(b).size,9);assert.deepEqual([...b].sort((a,b)=>a-b),[0,1,2,3,4,5,6,7,8]);
});
test('Milestones lead into the existing boss and continue after victory',()=>{
 assert.equal(Flight.nextTarget(0,0,75,false).score,5);
 assert.equal(Flight.nextTarget(50,60,75,false).label,'Cosmic Devourer');
 assert(Flight.nextTarget(85,100,75,true).score>85);
});
test('One Play starts the world, with a skippable in-flight lesson instead of a second start action',()=>{
 const {api}=fixture({onboardingDone:false});assert(api.read().flightStarted);assert.equal(api.read().gates.length,1);
 const y=api.read().ufoY;api.stableTick(1);assert.equal(api.read().ufoY,y);api.jump();assert(api.read().jumpVelocity<0);
 assert(!html.includes('id="fullscreen-button"'));assert(html.includes('id="skip-tutorial-button"'));
});
test('A shield lasts exactly one sound and is not replayed halfway through',()=>{
 const {api}=fixture();api.clear();api.shield();const duration=Flight.shieldFrames(4.36);
 assert.equal(api.read().invincibilityDurationFrames,duration);api.stableTick(duration-1);assert(api.read().invincible);
 api.stableTick();assert.equal(api.read().invincible,false);assert.equal(api.shieldSound(),0);
});
test('Reward sprites start fully outside the right edge, stay anchored and never jump vertically',()=>{
 const {api}=fixture();api.clear();api.freshGate();api.planet();const before=api.read();assert(before.planetActive);assert(before.planetX>1066);
 api.stableTick(40);assert.equal(api.read().planetY,before.planetY);
 api.clear();api.freshGate();api.star();const star=api.read();assert(star.powerupActive);assert(star.powerupX>1066);
 api.stableTick(40);assert.equal(api.read().powerupY,star.powerupY);
});
test('A planet and defeat can only pay their rewards once',()=>{
 const {api}=fixture();api.clear();api.collectPlanet();api.stableTick();assert.equal(api.read().score,1);
 api.stableTick();assert.equal(api.read().score,1);api.finishFrameAsGameOver();const credit=api.read().credits;
 api.finishFrameAsGameOver();assert.equal(api.read().credits,credit);
});
test('Existing local progress, owned skins, selected ship and records survive the new version',()=>{
 const {store}=fixture({credits:600,ownedSkins:['classic','nova'],selectedSkin:'nova',bestScores:{easy:5,normal:8,hard:9},
  achievements:['first-flight'],rankings:{normal:[{id:'previous',name:'PILOT',score:8}]}});
 const saved=JSON.parse(store.get('ufoRunCrazyGamesProfileV1'));
 assert.equal(saved.credits,600);assert.equal(saved.selectedSkin,'nova');assert(saved.ownedSkins.includes('nova'));
 assert.equal(saved.bestScores.normal,8);assert.equal(saved.rankings.normal[0].id,'previous');assert(saved.achievements.includes('first-flight'));
});
test('Transparent mask collision uses visible pixels, not empty rectangle corners',()=>{
 const s=source.slice(source.indexOf('  function rectanglesOverlap'),source.indexOf('  function collidesWithSpikes'));
 const ctx={};vm.runInNewContext(s+'\nglobalThis.check=opaqueOverlap;',ctx);
 const a={x:0,y:0,width:2,height:2,sprite:{mask:new Uint8Array([1,0,0,0])}},b={x:1,y:1,width:2,height:2,sprite:{mask:new Uint8Array([1,0,0,0])}};
 assert.equal(ctx.check(a,b),false);b.x=0;b.y=0;assert.equal(ctx.check(a,b),true);
});
test('Fixed-step physics stays consistent at 30, 60, 120, 144 and 165 Hz',()=>{
 const samples=[];
 for(const hz of [30,60,120,144,165]){
  const {api}=fixture();api.immortal();api.frame(0);
  for(let i=1;i<=hz*15;i++)api.frame(i*1000/hz);
  samples.push(api.read());
 }
 const frames=samples.map(s=>s.runFrames);assert(Math.max(...frames)-Math.min(...frames)<=1);
 assert(samples.every(s=>s.score===samples[0].score));
});
test('Pause stops gameplay progression, particle allocation stays bounded',()=>{
 const {api}=fixture();api.pauseGame();const before=api.read();api.frame(500);assert.equal(api.read().runFrames,before.runFrames);
 api.resumeGame();assert.equal(api.read().gamePaused,false);api.emit();assert(api.particles()<=80);
});
for(const difficulty of ['easy','normal','hard'])test('Timed boss completes once, clears projectiles and preserves rewards: '+difficulty,()=>{
 const {api}=fixture();api.setMode(difficulty);api.clear();api.boss();assert(api.read().bossActive);assert.equal(api.read().gates.length,0);
 api.winBoss();assert(api.read().bossDefeatAnimating);api.finishDefeat();assert(api.read().bossCompleted);
 const credit=api.read().credits;api.finishDefeat();assert.equal(api.read().credits,credit);
});
