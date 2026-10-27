// Static production build: zero runtime dependencies, no backend or development files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const repo=path.resolve(__dirname,'../..'),source=path.join(repo,'ufo-crazygames');
const version=process.argv[2]||'2.0.0';
if(!/^\d+\.\d+\.\d+(?:-[a-z0-9]+)?$/.test(version))throw new Error('Invalid version');
const destination=path.join(repo,'publishing','crazygames','v'+version);
function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>{
 if(e.isSymbolicLink())throw new Error('Symlinks are not packaged');
 const file=path.join(folder,e.name);return e.isDirectory()?walk(file):[file];});}
const files=walk(source).sort(),names=new Set(files.map(f=>path.relative(source,f).replaceAll('\\','/')));
const allowed=/^(?:index\.html|css\/[\w-]+\.css|js\/[\w-]+\.js|src\/(?:[^/]+\/)*[^/]+\.(?:png|jpg|webp|mp3|ttf))$/;
let totalBytes=0;const entries=[];
for(const file of files){
 const name=path.relative(source,file).replaceAll('\\','/');if(!allowed.test(name))throw new Error('Unexpected production file: '+name);
 const bytes=fs.readFileSync(file);totalBytes+=bytes.length;
 if(/\.(?:js|html|css)$/.test(name)){
  const text=bytes.toString('utf8');if(/__cgQA|__flightRead|console\.log\(|\bdebugger\b/.test(text))throw new Error('Development probe in '+name);
  if(name.endsWith('.js'))new vm.Script(text,{filename:name});
  for(const match of text.matchAll(/["'(]((?:\.\.\/)?src\/[^"')]+)["')]/g)){
   const relative=path.posix.normalize(path.posix.join(path.posix.dirname(name),match[1]));
   // JS asset paths are relative to the document, while CSS paths are relative to CSS.
   const asset=name.endsWith('.css')?relative:match[1];
   if(!names.has(asset))throw new Error('Missing or incorrectly cased asset: '+asset+' in '+name);
  }
 }
 entries.push({path:name,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
if(!names.has('index.html')||files.length>1500||totalBytes>20_000_000)throw new Error('Portal/mobile file budget exceeded');
if(!/monetizationEnabled:\s*false/.test(fs.readFileSync(path.join(source,'js/crazy-config.js'),'utf8')))throw new Error('Release must remain Basic Launch');
// Rebuilding only overwrites the same known files; never deletes an arbitrary folder.
if(fs.existsSync(destination))for(const file of walk(destination)){
 if(!names.has(path.relative(destination,file).replaceAll('\\','/')))throw new Error('Unexpected existing output file; inspect manually: '+file);
}
for(const file of files){const out=path.join(destination,path.relative(source,file));fs.mkdirSync(path.dirname(out),{recursive:true});fs.copyFileSync(file,out);}
const manifest={version,builtAt:new Date().toISOString(),entry:'index.html',orientation:'landscape',basicLaunch:true,
 fileCount:files.length,totalBytes,files:entries};
fs.writeFileSync(path.join(repo,'publishing/crazygames',`manifest-v${version}.json`),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({destination,version,fileCount:files.length,totalBytes},null,2));
