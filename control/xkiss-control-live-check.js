import fs from "node:fs";
import path from "node:path";
import {XKISS_DESIRED_STATE} from "./xkiss-control-desired-state.js";
const exists=p=>fs.existsSync(path.resolve(process.cwd(),p));
async function checkUrl(url){try{const r=await fetch(url,{redirect:"follow"});const body=await r.text();return {url,ok:r.ok,status:r.status,bytes:body.length};}catch(error){return {url,ok:false,status:0,error:String(error)}}}
export async function runLiveControlCheck(){const files=XKISS_DESIRED_STATE.requiredFiles.map(file=>({file,ok:exists(file)}));const [pages,workerHealth]=await Promise.all([checkUrl(XKISS_DESIRED_STATE.liveChecks.pages),checkUrl(XKISS_DESIRED_STATE.liveChecks.workerHealth)]);const ok=files.every(x=>x.ok)&&pages.ok&&workerHealth.ok;return {ok,section:"18",files,pages,workerHealth,failClosed:true,productionActivationAllowed:false};}