const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
function startServer(root=path.resolve(__dirname,'../../ufo-crazygames'),port=0){
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.ttf':'font/ttf'};
  return new Promise(resolve=>{
    const server=http.createServer((request,response)=>{
      const u=new URL(request.url,'http://localhost');
      if(u.pathname==='/__frame'){
        response.setHeader('Content-Type','text/html');
        return response.end('<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body,iframe{margin:0;width:100%;height:100%;overflow:hidden;border:0;display:block}</style><iframe title="UFO RUN" sandbox="allow-scripts allow-same-origin" src="http://127.0.0.1:'+server.address().port+'/"></iframe></html>');
      }
      let relative;
      try{relative=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';}catch{response.writeHead(400);return response.end();}
      const file=path.resolve(root,relative);
      if(!file.startsWith(path.resolve(root)+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){response.writeHead(404);return response.end('Not found');}
      const size=fs.statSync(file).size;
      response.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
      response.setHeader('Cache-Control','no-store');response.setHeader('Accept-Ranges','bytes');
      const range=request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      if(range){const start=+range[1],end=Math.min(range[2]?+range[2]:size-1,size-1);
        if(start>end||start>=size){response.writeHead(416);return response.end();}
        response.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(response);
      }else{response.setHeader('Content-Length',size);fs.createReadStream(file).pipe(response);}
    });
    server.listen(port,'127.0.0.1',()=>resolve(server));
  });
}
module.exports={startServer};
if(require.main===module)startServer(process.argv[2]?path.resolve(process.argv[2]):undefined,Number(process.argv[3])||4173).then(server=>console.log('UFO RUN http://127.0.0.1:'+server.address().port));
