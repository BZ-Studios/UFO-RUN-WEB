// Mechanical sprite baking only: preserves the original game's crop/size.
// Needs Sharp as a development tool; there are no runtime dependencies.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'src');
const dest = path.join(root, 'ufo-crazygames/src');
const planets = [
  ['Mercurio',146,54,813,1096], ['Venus',210,53,749,851], ['Tierra',132,53,1060,1145],
  ['Marte',97,212,1111,968], ['Jupiter',210,54,628,916], ['Saturno',198,53,815,779],
  ['Urano',146,53,1064,1097], ['Neptuno',97,53,1111,1127], ['Pluton',425,383,422,380],
];
async function alphaBounds(file) {
  const {data,info} = await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left=info.width, right=-1, top=info.height, bottom=-1;
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>100) {
    left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(right<left) throw new Error('Empty asteroid image: '+file);
  return {left,top,width:right-left+1,height:bottom-top+1};
}
(async()=>{
  if(!process.argv.includes('--write')) throw new Error('Pass --write to update only CrazyGames assets');
  for(const [name,left,top,width,height] of planets) {
    const file=path.join(source,'planetas',name+'.png');
    const scale=Math.min(80/width,80/height);
    const w=Math.max(1,Math.round(width*scale)),h=Math.max(1,Math.round(height*scale));
    const input=await sharp(file).extract({left,top,width,height}).resize(w,h,{kernel:'nearest'}).png().toBuffer();
    await sharp({create:{width:80,height:80,channels:4,background:'#00000000'}})
      .composite([{input,left:Math.floor((80-w)/2),top:Math.floor((80-h)/2)}])
      .png({compressionLevel:9}).toFile(path.join(dest,'planetas',name+'.png'));
  }
  for(const name of ['Asteroide','asteroide_2']) {
    const file=path.join(source,'Obstaculos',name+'.png');
    await sharp(file).extract(await alphaBounds(file)).resize(64,64,{fit:'fill',kernel:'nearest'})
      .png({compressionLevel:9}).toFile(path.join(dest,'Obstaculos',name+'.png'));
  }
  for(const [file,width] of [['Logo_bz.png',360],['boss_cosmico.png',920]]) {
    await sharp(path.join(source,file)).resize({width,kernel:'nearest',withoutEnlargement:true})
      .png({compressionLevel:9}).toFile(path.join(dest,file));
  }
  console.log('Prepared 9 planets, 2 asteroids, studio logo and boss without changing other editions.');
})().catch(error=>{console.error(error);process.exitCode=1;});
