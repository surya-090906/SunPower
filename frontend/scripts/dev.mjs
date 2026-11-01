import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const frontend=fileURLToPath(new URL('../',import.meta.url));
const repo=resolve(frontend,'..');
const backendPort=Number(process.env.DJANGO_PORT || 8000);
const frontendPort=Number(process.env.VITE_PORT || 5173);
const origin=`http://127.0.0.1:${backendPort}`;
const frontendOrigin=`http://127.0.0.1:${frontendPort}`;
const virtualPython=resolve(repo,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
const python=process.env.PYTHON || (existsSync(virtualPython)?virtualPython:'python');
let django,vite,closing=false;

async function available(port) {
 return new Promise(resolve=>{
  const probe=net.createServer();
  probe.once('error',()=>resolve(false));
  probe.listen(port,'127.0.0.1',()=>probe.close(()=>resolve(true)));
 });
}
async function close(code=0) {
 if(closing)return;closing=true;
 await vite?.close();
 django?.kill('SIGTERM');
 process.exitCode=code;
}
process.once('SIGINT',()=>close());
process.once('SIGTERM',()=>close());
try {
 for(const [port,name] of [[backendPort,'Django'],[frontendPort,'Vite']]) {
  if(!Number.isInteger(port)||port<1||port>65535)throw Error(`${name} port is invalid.`);
  if(!await available(port))throw Error(`${name} port ${port} is already in use. Set DJANGO_PORT or VITE_PORT to an unused port.`);
 }
 process.env.DJANGO_ORIGIN=origin;
 django=spawn(python,['-u','manage.py','runserver',`127.0.0.1:${backendPort}`,'--noreload'],{
  cwd:repo,stdio:'inherit',windowsHide:true,env:process.env,
 });
 django.once('error',error=>{console.error(`Cannot start Django: ${error.message}`);close(1);});
 django.once('exit',code=>{if(!closing){console.error(`Django exited (${code}).`);close(code || 1);}});
 vite=await createServer({root:frontend,configFile:resolve(frontend,'vite.config.js'),server:{host:'127.0.0.1',port:frontendPort,strictPort:true}});
 await vite.listen();
 console.log(`\nSunPower React + Django: ${frontendOrigin}\nBackend: ${origin}\n`);
}catch(error){console.error(error.message);await close(1);}
