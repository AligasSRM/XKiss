export const XKISS_MODULE_RECOVERY_RULES=Object.freeze({
  stage:"15.30",name:"Module Self-Healing & Auto-Recovery",coreControlled:true,failClosed:true,
  maxAttempts:1,maxHistory:100,
  statuses:["RECOVERED","FAILED","SKIPPED"]
});
export function validateRecoveryRequest(r){
  if(!r||typeof r!=="object")return{ok:false,error:"invalid-request"};
  if(typeof r.module!=="string"||!/^[A-Za-z0-9._-]{1,80}$/.test(r.module))return{ok:false,error:"invalid-module"};
  return{ok:true};
}