const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),base=process.argv[2]||'d0ecd74d3a385bbf61d558d7d96ef823120770a6';
const output=path.join(root,'publishing/crazygames/qa-v2');fs.mkdirSync(output,{recursive:true});
const git=(...args)=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),...args],{cwd:root,encoding:'utf8'});
const tree=git('ls-tree','-r','-l',base,'--','ufo-crazygames');
const sizes=[...tree.matchAll(/\bblob [a-f0-9]+\s+(\d+)\t/g)].map(m=>+m[1]);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'publishing/crazygames/manifest-v2.0.0.json'),'utf8'));
const zip=path.join(root,'publishing/crazygames/ufo-run-crazygames-v2.0.0.zip');
const result={base,baselineFiles:sizes.length,baselineBytes:sizes.reduce((a,b)=>a+b,0),releaseFiles:manifest.fileCount,releaseBytes:manifest.totalBytes,
 zipBytes:fs.statSync(zip).size,zipSha256:crypto.createHash('sha256').update(fs.readFileSync(zip)).digest('hex')};
result.reductionPercent=+(100*(1-result.releaseBytes/result.baselineBytes)).toFixed(2);
if(process.env.CRAZY_PROTECTED_SNAPSHOT){
 const before=JSON.parse(fs.readFileSync(process.env.CRAZY_PROTECTED_SNAPSHOT,'utf8'));const changes=[];
 for(const [name,hash]of Object.entries(before)){
  const file=path.join(root,name);if(!fs.existsSync(file)||crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==hash)changes.push(name);
 }
 result.protectedFilesChecked=Object.keys(before).length;
 // APK work was already dirty and is being edited separately. Record drift;
 // do not revert it or mix it into the CrazyGames commit.
 result.apkSnapshotDifferences=changes.filter(name=>name.startsWith('apk/'));
 result.protectedFilesChanged=changes.filter(name=>!name.startsWith('apk/'));
 if(result.protectedFilesChanged.length)throw new Error('Web/GameDistribution files differ from starting snapshot: '+result.protectedFilesChanged.join(', '));
}
fs.writeFileSync(path.join(output,'package-audit.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
