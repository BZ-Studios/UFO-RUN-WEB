// QA pilot sends only gameplay inputs. It never changes physics, score or protection.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/luisz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {startServer}=require('../tools/crazygames/serve.cjs');
const root=path.resolve(process.env.CRAZY_GAME_ROOT||path.join(__dirname,'../ufo-crazygames'));
const output=path.resolve(process.env.CRAZY_QA_OUTPUT||path.join(__dirname,'../publishing/crazygames/qa-v2'));
const source=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
const probe=`window.__flightRead=()=>({state,runFrames,score,ufoY,jumpVelocity,UFO_X,UFO_WIDTH,UFO_HEIGHT,WIDTH,HEIGHT,
 gates:spikes.map(s=>({x:s.topX,top:s.topY+SPIKE_HEIGHT,bottom:s.bottomY})),bossActive,bossCompleted,invincible,
 projectiles:bossProjectiles.map(p=>({...p})),particles:particles.filter(p=>p.life>0).length,cache:spriteCache.size,
 effects:activeEffects.size,deathReason});`;
async function run(){
 fs.mkdirSync(output,{recursive:true});const server=await startServer(root);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CRAZY_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const results=[];
 try{
  for(const [difficulty,mobile]of[['easy',false],['normal',true],['hard',false]]){
   const context=await browser.newContext({viewport:{width:mobile?800:907,height:mobile?450:510},hasTouch:mobile,isMobile:mobile});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await context.route('https://sdk.crazygames.com/**',r=>r.abort());
   await context.route('**/js/game.js',r=>r.fulfill({contentType:'text/javascript',body:source.replace('  canvas.addEventListener("pointerdown"',probe+'\n  canvas.addEventListener("pointerdown"')}));
   await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('#play-button').waitFor();
   await page.locator(`[data-difficulty="${difficulty}"]`).click();await page.clock.install();await page.locator('#play-button').click();
   await page.evaluate(mobile=>{
    window.__pilot=true;window.__samples=[];let lastBoost=-Infinity;
    function steer(now){
     const s=__flightRead();
     if(s.state==='playing'&&window.__pilot){
      const gate=s.gates.find(g=>g.x+100>s.UFO_X-8);
      let target=gate?(gate.top+gate.bottom)/2-s.UFO_HEIGHT/2:280;
      if(s.bossActive){
       target=280+Math.sin(s.runFrames/110)*105;
       const hit=s.projectiles.find(p=>p.x>s.UFO_X-20&&p.x<s.UFO_X+210&&Math.abs(p.y-s.ufoY)<65);
       if(hit)target=Math.max(90,Math.min(420,hit.y>280?hit.y-110:hit.y+100));
      }
      if(s.ufoY>target+7&&s.jumpVelocity>=-1.7&&now-lastBoost>80){
       if(mobile)document.getElementById('game').dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',bubbles:true,cancelable:true}));
       else window.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',bubbles:true,cancelable:true}));
       lastBoost=now;
      }
      if(s.runFrames%80<2)window.__samples.push({frames:s.runFrames,score:s.score,particles:s.particles,cache:s.cache,effects:s.effects});
     }
     requestAnimationFrame(steer);
    }requestAnimationFrame(steer);
   },mobile);
   // Run virtual time at normal RAF intervals, preserving every physics step.
   for(let second=0;second<105;second++){
    await page.clock.runFor(1000);
    if((await page.evaluate(()=>__flightRead())).state!=='playing')break;
   }
   const survived=await page.evaluate(()=>__flightRead());
   await page.screenshot({path:path.join(output,`playthrough-${difficulty}.png`)});
   assert(survived.score>=10,`${difficulty}: failed before ten gates: ${JSON.stringify(survived)}`);
   await page.evaluate(()=>window.__pilot=false);
   for(let second=0;second<12;second++){
    await page.clock.runFor(1000);if((await page.evaluate(()=>__flightRead())).state==='gameover')break;
   }
   const ended=await page.evaluate(()=>__flightRead());assert.equal(ended.state,'gameover');assert.deepEqual(errors,[]);
   assert(await page.locator('#restart-button').isVisible());
   const samples=await page.evaluate(()=>__samples);assert(samples.every(s=>s.particles<=80&&s.effects<10&&s.cache<70));
   results.push({difficulty,mobile,seconds:survived.runFrames/80,score:survived.score,bossCompleted:survived.bossCompleted,
    endReason:ended.deathReason,peakParticles:Math.max(...samples.map(s=>s.particles)),peakSpriteCache:Math.max(...samples.map(s=>s.cache)),
    sampleCount:samples.length});console.log('PASS natural-input playthrough',JSON.stringify(results.at(-1)));
   await context.close();
  }
  // Unmodified production code: real RAF timing, actual browser keyboard input.
  const context=await browser.newContext({viewport:{width:907,height:510}}),page=await context.newPage();
  await context.route('https://sdk.crazygames.com/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port);await page.locator('#play-button').click();
  await page.keyboard.press('Space');await page.keyboard.press('KeyP');assert(await page.locator('#pause-dialog').isVisible());
  await page.locator('#resume-button').click();
  const performanceData=await page.evaluate(()=>new Promise(resolve=>{
   const samples=[];let previous=performance.now();const began=previous;
   function sample(now){samples.push(now-previous);previous=now;if(now-began<1800)requestAnimationFrame(sample);
    else{samples.sort((a,b)=>a-b);resolve({rafFrames:samples.length,seconds:(now-began)/1000,p95FrameMs:samples[Math.floor(samples.length*.95)],heapBytes:performance.memory?.usedJSHeapSize||null});}}
   requestAnimationFrame(sample);
  }));
  results.push({unmodifiedSmoke:true,...performanceData});console.log('PASS unmodified production RAF smoke',JSON.stringify(performanceData));
  await context.close();
 }finally{await browser.close();await new Promise(r=>server.close(r));}
 fs.writeFileSync(path.join(output,'playthrough-results.json'),JSON.stringify({testedAt:new Date().toISOString(),root,results},null,2));
}
run().catch(e=>{console.error(e);process.exitCode=1;});
