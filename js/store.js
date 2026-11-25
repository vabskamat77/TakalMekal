import {quiz} from './config.js';
export const defaults=()=>({version:1,teams:[...quiz.teams],scores:Array.from({length:4},()=>[0,0,0,0]),screen:'home',round:1,team:0,mode:'direct',timer:{duration:10,remaining:10000,end:null}});
const db=new Promise((resolve,reject)=>{const r=indexedDB.open('takal-mekal-local-v2',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
export async function load(){const d=await db;return new Promise((resolve,reject)=>{const r=d.transaction('state').objectStore('state').get('quiz');r.onsuccess=()=>resolve(r.result??defaults());r.onerror=()=>reject(r.error);});}
export async function save(s){const d=await db;return new Promise((resolve,reject)=>{const t=d.transaction('state','readwrite');t.objectStore('state').put(s,'quiz');t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
export const channel=new BroadcastChannel('takal-mekal-v2');
export const remaining=t=>Math.max(0,t.end===null?t.remaining:t.end-Date.now());
export const seconds=t=>Math.ceil(remaining(t)/1000);
export function validate(s){if(!s||s.version!==1||!Array.isArray(s.teams)||s.teams.length!==4||!s.teams.every(x=>typeof x==='string'&&x.trim()&&x.length<=80)||!Array.isArray(s.scores)||s.scores.length!==4||!s.scores.every(r=>Array.isArray(r)&&r.length===4&&r.every(Number.isSafeInteger))||!['home','round','scores'].includes(s.screen)||![1,2,3,4].includes(s.round)||![0,1,2,3].includes(s.team)||!['direct','passed','rapid'].includes(s.mode)||!s.timer||![5,10,60].includes(s.timer.duration)||!Number.isFinite(s.timer.remaining)||s.timer.remaining<0||s.timer.remaining>s.timer.duration*1000||!(s.timer.end===null||Number.isFinite(s.timer.end)))throw Error('Invalid Step 2 backup');return s;}
export function freshTimer(duration){return {duration,remaining:duration*1000,end:null};}
