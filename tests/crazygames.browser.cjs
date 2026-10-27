// Development-only visual/interaction QA. Never included in the portal ZIP.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let playwright;
try{playwright=require(process.env.PLAYWRIGHT_MODULE||'playwright');}
catch{playwright=require('C:/Users/luisz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');}
const {startServer}=require('../tools/crazygames/serve.cjs');
const root=path.resolve(process.env.CRAZY_GAME_ROOT||path.join(__dirname,'../ufo-crazygames'));
const output=path.resolve(process.env.CRAZY_QA_OUTPUT||path.join(__dirname,'../publishing/crazygames/qa-v2'));
const source=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const results=[];
const record=(name,data={})=>{results.push({name,...data});console.log('PASS',name,JSON.stringify(data));};
const sdkStub=`window.__sdkEvents=[];window.__adCalls=[];
window.CrazyGames={SDK:{environment:'local',init:async()=>{},game:{settings:{muteAudio:false},
 loadingStart(){__sdkEvents.push('loadingStart');},loadingStop(){__sdkEvents.push('loadingStop');},
 gameplayStart(){__sdkEvents.push('gameplayStart');},gameplayStop(){__sdkEvents.push('gameplayStop');},
 happytime(){__sdkEvents.push('happytime');},addSettingsChangeListener(fn){window.__mute=fn;}},
 ad:{requestAd:async(type,cb)=>{__adCalls.push(type);window.__adCallbacks=cb;}}}};`;
const probe=`window.__cgQA={read:()=>({state,score,runFrames,gamePaused,flightStarted,ufoY,jumpVelocity,UFO_X,UFO_WIDTH,UFO_HEIGHT,WIDTH,HEIGHT,
 gates:spikes.map(s=>({x:s.topX,top:s.topY+SPIKE_HEIGHT,bottom:s.bottomY})),speed:spikeSpeed,
 planetActive,planetX,planetY,starActive:powerupActive,starX:powerupX,starY:powerupY,invincible,
 bossActive,bossWarningActive,bossCompleted,bossDefeatAnimating,bossTimeFrames,
 projectiles:bossProjectiles.map(p=>({...p})),credits:profile.credits,tutorialVisible,continueUsed,adRequestPending,
 audioPlaying:[backgroundMusic,invincibilitySound,deathSound,...activeEffects].some(a=>!a.paused)}),
 shield:()=>{invincible=true;invincibleTime=0;syncInvincibilityDuration();},
 die:finishFrameAsGameOver,
 eligibleContinue:()=>{gamesStarted=3;score=10;finishFrameAsGameOver();},
 score:n=>{score=n;},
 boss:()=>{score=DIFFICULTIES[currentDifficulty].bossTriggerScore;startBossBattle();},
 win:()=>{bossProjectiles=[];bossTimeFrames=bossDurationFrames()-1;ufoY=300;jumpVelocity=-GRAVITY;updateGame();},
 cleanup:()=>{for(let n=0;n<BOSS_DEFEAT_ANIMATION_FRAMES;n++){ufoY=300;jumpVelocity=-GRAVITY;updateGame();}},
 };`;
function chromePath(){
 if(process.env.CRAZY_BROWSER)return process.env.CRAZY_BROWSER;
 const candidates=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
 return candidates.find(p=>fs.existsSync(p));
}
async function pageFixture(browser,{width=907,height=510,mobile=false,full=false,blocked=false,late=false,storageBlocked=false,real=false,instrumented=true}={}){
 const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});
 if(storageBlocked)await context.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError');}}));
 if(full)await context.route('**/js/crazy-config.js',r=>r.fulfill({contentType:'text/javascript',body:'window.UFO_CRAZY_CONFIG={monetizationEnabled:true,rewardedCooldownSeconds:120};'}));
 let release;const pending=new Promise(r=>release=r);
 if(!real)await context.route('https://sdk.crazygames.com/crazygames-sdk-v3.js',async r=>{
   if(blocked)return r.abort();if(late)await pending;
   return r.fulfill({contentType:'text/javascript',body:sdkStub});
 });
 if(instrumented)await context.route('**/js/game.js',r=>r.fulfill({contentType:'text/javascript',body:source.replace('  canvas.addEventListener("pointerdown"',probe+'\n  canvas.addEventListener("pointerdown"')}));
 const page=await context.newPage(),errors=[],bad=[],consoleErrors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url());});
 page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
 return{context,page,errors,bad,consoleErrors,release};
}
async function menu(page){await page.locator('#play-button').waitFor({state:'visible',timeout:30000});}
async function visibleBounds(page,ids){
 const bad=await page.evaluate(ids=>ids.flatMap(id=>{const e=document.getElementById(id);if(!e||e.hidden)return[];const r=e.getBoundingClientRect();return r.left<-.5||r.top<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5?[{id,x:r.x,y:r.y,w:r.width,h:r.height,viewport:[innerWidth,innerHeight]}]:[];}),ids);
 assert.deepEqual(bad,[],'Clipped UI: '+JSON.stringify(bad));
 assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
}
async function launch(page){await page.locator('#play-button').click();assert((await page.evaluate(()=>window.__cgQA.read())).flightStarted);}
async function run(){
 fs.mkdirSync(output,{recursive:true});const server=await startServer(root),base='http://127.0.0.1:'+server.address().port;
 const browser=await playwright.chromium.launch({executablePath:chromePath(),headless:true});
 try{
 for(const [width,height,mobile]of[[907,510,false],[1216,684,false],[1077,606,false],[821,462,false],[1366,768,false],[1920,1080,false],[1536,864,false],[1280,720,false],[800,450,true],[1080,607,true],[568,320,true],[480,320,true]]){
  const f=await pageFixture(browser,{width,height,mobile});try{
   const start=Date.now();await f.page.goto(base);await menu(f.page);const menuMs=Date.now()-start;
   assert(!await f.page.locator('#intro-screen').isVisible());assert.equal(await f.page.locator('#fullscreen-button').count(),0);
   await visibleBounds(f.page,['play-button','shop-button','achievements-button','help-button','ranking-button','difficulty-description','equipped-preview','menu-goal']);
   const readable=await f.page.locator('#difficulty-description').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert(readable>=11);
   if([907,800,568,1920].includes(width))await f.page.screenshot({path:path.join(output,`menu-${width}x${height}.png`)});
   for(const [button,screen]of [['shop-button','shop-screen'],['help-button','help-screen'],['achievements-button','achievements-screen'],['ranking-button','ranking-screen']]){
    await f.page.locator('#'+button).click();await f.page.locator('#'+screen).waitFor({state:'visible'});await f.page.locator('#back-button').click();
   }
   await launch(f.page);await f.page.locator('#flight-tutorial').waitFor({state:'visible'});
   if([907,800].includes(width))await f.page.screenshot({path:path.join(output,`flight-${width}x${height}.png`)});
   await f.page.locator('#pause-button').click();await f.page.locator('#pause-dialog').waitFor({state:'visible'});
   const before=await f.page.evaluate(()=>window.__cgQA.read().runFrames);await f.page.waitForTimeout(100);
   assert.equal(await f.page.evaluate(()=>window.__cgQA.read().runFrames),before);
   await f.page.locator('#resume-button').click();await f.page.evaluate(()=>window.__cgQA.die());
   await f.page.locator('#gameover-screen').waitFor({state:'visible'});await visibleBounds(f.page,['restart-button','menu-button','death-hint']);
   if([907,800].includes(width))await f.page.screenshot({path:path.join(output,`result-${width}x${height}.png`)});
   await f.page.locator('#restart-button').click();assert((await f.page.evaluate(()=>window.__cgQA.read())).flightStarted);
   assert.deepEqual(f.errors,[]);assert.deepEqual(f.bad,[]);assert.deepEqual(f.consoleErrors,[]);
   record('One-click launch, readable layout, pause and immediate retry',{width,height,mobile,menuMs});
  }finally{await f.context.close();}
 }
 const rotate=await pageFixture(browser,{width:390,height:844,mobile:true});try{
  await rotate.page.goto(base);await rotate.page.locator('#rotate-screen').waitFor({state:'visible'});
  await rotate.page.setViewportSize({width:844,height:390});await menu(rotate.page);await launch(rotate.page);
  await rotate.page.locator('#pause-button').click();await rotate.page.setViewportSize({width:390,height:844});
  await rotate.page.locator('#rotate-screen').waitFor({state:'visible'});assert(!await rotate.page.locator('#pause-dialog').isVisible());
  const y=await rotate.page.evaluate(()=>window.__cgQA.read().ufoY);await rotate.page.waitForTimeout(150);assert.equal(await rotate.page.evaluate(()=>window.__cgQA.read().ufoY),y);
  await rotate.page.setViewportSize({width:844,height:390});await rotate.page.locator('#pause-dialog').waitFor({state:'visible'});await rotate.page.locator('#resume-button').click();
  assert.deepEqual(rotate.errors,[]);record('Portrait gate, state-preserving rotation, explicit resume');
 }finally{await rotate.context.close();}
 const late=await pageFixture(browser,{late:true});try{
  const start=Date.now();await late.page.goto(base,{waitUntil:'domcontentloaded'});await menu(late.page);assert(Date.now()-start<7000);
  await launch(late.page);late.release();await late.page.waitForFunction(()=>window.__sdkEvents?.includes('gameplayStart'));
  const events=await late.page.evaluate(()=>window.__sdkEvents);assert.deepEqual(events.slice(0,3),['loadingStart','loadingStop','gameplayStart']);
  assert.deepEqual(late.errors,[]);record('Slow SDK does not block ready assets; loading and playable state replay once');
 }finally{late.release();await late.context.close();}
 for(const options of [{blocked:true},{storageBlocked:true},{real:true}]){
  const f=await pageFixture(browser,options);try{
   await f.page.goto(base);await menu(f.page);await launch(f.page);assert.deepEqual(f.errors,[]);
   if(options.real){assert.equal(await f.page.evaluate(()=>window.ufoRunCrazy.initialize()),true);}
   record(options.real?'Official SDK v3 initializes on localhost (no real ads) made usable':options.blocked?'Blocked SDK fallback still playable':'Blocked local storage does not crash gameplay');
  }finally{await f.context.close();}
 }
 const iframe=await pageFixture(browser);try{
  await iframe.page.goto(base.replace('127.0.0.1','localhost')+'/__frame');const child=iframe.page.frames().find(f=>f.parentFrame());
  await menu(child);assert.equal(await child.evaluate(()=>document.fullscreenEnabled),false);await child.locator('#play-button').click();
  assert((await child.evaluate(()=>window.__cgQA.read())).flightStarted);record('Cross-origin iframe, no fullscreen permission required');
 }finally{await iframe.context.close();}
 const credits=await pageFixture(browser);try{
  await credits.page.goto(base);await menu(credits.page);await credits.page.locator('#help-button').click();await credits.page.locator('#credits-button').click();
  await credits.page.locator('#intro-screen').waitFor({state:'visible'});await credits.page.locator('#skip-intro-button').click();await menu(credits.page);record('Original studio presentation and credits remain available on demand');
 }finally{await credits.context.close();}
 const full=await pageFixture(browser,{full:true});try{
  await full.page.clock.install();await full.page.goto(base);await menu(full.page);await full.page.locator('#shop-button').click();
  const before=await full.page.evaluate(()=>window.__cgQA.read().credits);
  await full.page.locator('#coin-ad-button').click();await full.page.evaluate(()=>window.__adCallbacks.adError({code:'unfilled'}));
  assert.equal(await full.page.evaluate(()=>window.__cgQA.read().credits),before);
  for(let n=1;n<=10;n++){
   await full.page.locator('#coin-ad-button').click();await full.page.evaluate(()=>{__adCallbacks.adStarted();__adCallbacks.adFinished();});
   await full.page.waitForFunction(()=>!window.__cgQA.read().adRequestPending);assert.equal(await full.page.evaluate(()=>window.__cgQA.read().credits),before+50*n);
   await full.page.clock.fastForward(121000);
  }
  assert(await full.page.locator('#coin-ad-button').isDisabled());await full.page.locator('#back-button').click();await launch(full.page);
  await full.page.locator('#pause-button').click();await full.page.evaluate(()=>__mute({muteAudio:true}));assert(await full.page.locator('#sound-button').isDisabled());
  assert.equal(await full.page.evaluate(()=>window.__cgQA.read().audioPlaying),false);
  await full.page.evaluate(()=>__mute({muteAudio:false}));
  assert.equal(await full.page.evaluate(()=>window.__adCalls.filter(t=>t==='midgame').length),0);
  record('Full-launch mock regression: no fake rewards, 50 coins, daily cap 10, cooldown, platform mute, no preroll');
  await full.page.locator('#resume-button').click();await full.page.evaluate(()=>window.__cgQA.eligibleContinue());
  const coins=await full.page.evaluate(()=>window.__cgQA.read().credits);
  await full.page.locator('#continue-coins-button').click();assert(await full.page.locator('#pause-dialog').isVisible());
  assert.equal(await full.page.evaluate(()=>window.__cgQA.read().credits),coins-100);
  await full.page.locator('#resume-button').click();await full.page.evaluate(()=>window.__cgQA.die());
  assert(!await full.page.locator('#continue-ad-offer').isVisible());await full.page.locator('#restart-button').click();
  assert.equal(await full.page.evaluate(()=>window.__adCalls.filter(t=>t==='midgame').length),0);
  await full.page.evaluate(()=>window.__cgQA.eligibleContinue());
  await full.page.locator('#continue-ad-button').click();await full.page.evaluate(()=>__adCallbacks.adStarted());
  await full.page.evaluate(()=>__adCallbacks.adFinished());await full.page.locator('#pause-dialog').waitFor({state:'visible'});
  const continued=await full.page.evaluate(()=>window.__cgQA.read());assert(continued.continueUsed&&continued.gamePaused&&continued.invincible);
  assert.equal(continued.score,10);record('Paid and rewarded continues: one per run, preserved score, protection and explicit resume, no ad stacking');
 }finally{await full.context.close();}
 const focus=await pageFixture(browser);try{
  await focus.page.goto(base);await menu(focus.page);await launch(focus.page);
  const repeated=await focus.page.evaluate(()=>{const before=__cgQA.read().jumpVelocity;const event=new KeyboardEvent('keydown',{code:'Space',repeat:true,cancelable:true});window.dispatchEvent(event);return[before,__cgQA.read().jumpVelocity,event.defaultPrevented];});
  assert.equal(repeated[0],repeated[1]);
  assert.equal(repeated[2],true);
  await focus.page.evaluate(()=>window.dispatchEvent(new FocusEvent('blur')));await focus.page.locator('#pause-dialog').waitFor({state:'visible'});
  const frame=await focus.page.evaluate(()=>__cgQA.read().runFrames);await focus.page.waitForTimeout(120);
  assert.equal(await focus.page.evaluate(()=>__cgQA.read().runFrames),frame);assert.equal(await focus.page.evaluate(()=>__cgQA.read().audioPlaying),false);
  await focus.page.evaluate(()=>window.dispatchEvent(new FocusEvent('focus')));assert(await focus.page.locator('#pause-dialog').isVisible());
  await focus.page.locator('#resume-button').click();await focus.page.evaluate(()=>__cgQA.boss());await focus.page.screenshot({path:path.join(output,'boss-907x510.png')});
  await focus.page.evaluate(()=>{__cgQA.win();__cgQA.cleanup();});assert((await focus.page.evaluate(()=>__cgQA.read())).bossCompleted);
  assert(await focus.page.evaluate(()=>__sdkEvents.includes('happytime')));assert.deepEqual(focus.errors,[]);
  record('Key repeat, blur silence/freeze, focus stays paused; boss render, victory and happytime');
 }finally{await focus.context.close();}
 const broken=await pageFixture(browser);try{
  await broken.context.route('**/src/boss_cosmico.png',r=>r.abort());await broken.page.goto(base);await broken.page.locator('#retry-loading-button').waitFor({state:'visible'});
  assert(await broken.page.locator('#loading-progress').evaluate(e=>e.value<100));record('Asset error: honest incomplete progress with a retry action');
 }finally{await broken.context.close();}
 const missing=await pageFixture(browser);try{
  await missing.context.route('**/js/flight-rules.js',r=>r.abort());await missing.page.goto(base);
  await missing.page.locator('#retry-loading-button').waitFor({state:'visible'});
  assert.deepEqual(missing.errors,[]);assert(!await missing.page.locator('#play-button').isVisible());record('Missing gameplay script gives a retry action instead of a dead loading screen');
 }finally{await missing.context.close();}
 }finally{await browser.close();await new Promise(r=>server.close(r));}
 fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({testedAt:new Date().toISOString(),browser:chromePath(),root,results},null,2));
 console.log('ALL BROWSER CHECKS PASSED');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
