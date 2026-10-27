const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../ufo-crazygames/js/crazy-sdk.js'),'utf8');
function fixture({enabled=true,environment='local',failure=false}={}){
 let now=0,id=0,callbacks,settingsListener;const timers=new Map(),events=[],calls=[];
 const sdk={environment,init:async()=>{if(failure)throw Error('offline');},game:{settings:{muteAudio:false},
  loadingStart:()=>calls.push('loadingStart'),loadingStop:()=>calls.push('loadingStop'),gameplayStart:()=>calls.push('gameplayStart'),
  gameplayStop:()=>calls.push('gameplayStop'),happytime:()=>calls.push('happytime'),addSettingsChangeListener:fn=>settingsListener=fn},
  ad:{requestAd:async(type,cb)=>{calls.push(type);callbacks=cb;}}};
 const window={UFO_CRAZY_CONFIG:{monetizationEnabled:enabled,rewardedCooldownSeconds:120},CrazyGames:{SDK:sdk},location:{protocol:'https:'},
  dispatchEvent:e=>events.push(e),setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id)};
 const document={createElement:()=>({addEventListener(type,fn){this[type]=fn;}}),head:{append:script=>queueMicrotask(()=>script.load())}};
 class CustomEvent{constructor(type,{detail}){this.type=type;this.detail=detail;}}
 vm.runInNewContext(source,{window,document,CustomEvent,performance:{now:()=>now}});
 return{window,calls,events,bridge:window.ufoRunCrazy,callbacks:()=>callbacks,
  mute:value=>settingsListener({muteAudio:value}),advance:ms=>{now+=ms;for(const [id,t]of timers)if(t.at<=now){timers.delete(id);t.fn();}}};
}
test('SDK sends one loading pair and deduplicates gameplay states',async()=>{
 const f=fixture();assert(await f.bridge.initialize());f.bridge.loadingFinished();f.bridge.loadingFinished();
 f.bridge.gameplay(true);f.bridge.gameplay(true);f.bridge.gameplay(false);assert.deepEqual(f.calls,['loadingStart','loadingStop','gameplayStart','gameplayStop']);
});
test('Late SDK initialization replays already loaded and playing state in order',async()=>{
 const f=fixture();f.bridge.loadingFinished();f.bridge.gameplay(true);assert(await f.bridge.initialize());assert.deepEqual(f.calls,['loadingStart','loadingStop','gameplayStart']);
});
test('Basic Launch never requests ads or invents rewards',async()=>{
 const f=fixture({enabled:false});await f.bridge.initialize();assert.equal(await f.window.ufoRunShowRewardedAd({placement:'shop-coins'}),false);
 assert.equal(await f.bridge.showMidgame(),false);assert.equal(f.bridge.isAvailable(),false);assert(!f.calls.includes('rewarded'));
});
test('Reward uses completion callback, rejects overlap and settles once despite duplicate callbacks',async()=>{
 const f=fixture();await f.bridge.initialize();let settled=false;
 const result=f.window.ufoRunShowRewardedAd({placement:'continue'}).then(v=>{settled=true;return v;});
 await Promise.resolve();await Promise.resolve();assert.equal(settled,false);assert(f.bridge.isAdPending());
 assert.equal(await f.window.ufoRunShowRewardedAd({placement:'shop-coins'}),false);
 f.callbacks().adStarted();assert(f.bridge.isAdActive());f.advance(20000);assert.equal(settled,false);
 f.callbacks().adFinished();f.callbacks().adError({});assert.equal(await result,true);assert.equal(f.bridge.rewardedWaitSeconds(),120);
 assert.equal(await f.window.ufoRunShowRewardedAd({placement:'shop-coins'}),false);f.advance(120000);assert.equal(f.bridge.rewardedWaitSeconds(),0);
});
test('No fill and request timeout grant nothing; invalid placements are ignored',async()=>{
 const f=fixture();await f.bridge.initialize();assert.equal(await f.window.ufoRunShowRewardedAd({placement:'fake'}),false);
 const failure=f.window.ufoRunShowRewardedAd({placement:'continue'});f.callbacks().adError({code:'unfilled'});assert.equal(await failure,false);
 assert.equal(f.bridge.rewardedWaitSeconds(),0);const timeout=f.window.ufoRunShowRewardedAd({placement:'shop-coins'});f.advance(12000);
 assert.equal(await timeout,false);assert.equal(f.bridge.isAvailable(),false);f.callbacks().adFinished();assert.equal(f.bridge.rewardedWaitSeconds(),0);
});
test('Platform disabling Basic ads is respected and platform mute is propagated',async()=>{
 const f=fixture();await f.bridge.initialize();f.mute(true);assert(f.bridge.isMuted());assert(f.events.some(e=>e.type==='ufo-crazy-audio'&&e.detail.muted));
 const ad=f.window.ufoRunShowRewardedAd({placement:'continue'});f.callbacks().adError({code:'adsDisabledBasicLaunch'});assert.equal(await ad,false);assert.equal(f.bridge.isAvailable(),false);
});
test('Unavailable SDK and disabled environments keep gameplay bridge usable',async()=>{
 for(const config of [{failure:true},{environment:'disabled'}]){const f=fixture(config);assert.equal(await f.bridge.initialize(),false);
  f.bridge.gameplay(true);f.bridge.loadingFinished();assert.equal(await f.bridge.showMidgame(),false);}
});
