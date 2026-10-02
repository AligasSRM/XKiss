const PARTNER_STATES = Object.freeze(["APPLIED","PENDING_VERIFICATION","VERIFIED","ACTIVE","SUSPENDED","REVOKED"]);
const TRANSITIONS = Object.freeze({
  APPLIED:["PENDING_VERIFICATION","REVOKED"],
  PENDING_VERIFICATION:["VERIFIED","REJECTED","REVOKED"],
  VERIFIED:["ACTIVE","SUSPENDED","REVOKED"],
  ACTIVE:["SUSPENDED","REVOKED"],
  SUSPENDED:["ACTIVE","REVOKED"],
  REVOKED:[]
});
export const XKISS_PARTNER_ACCOUNTS = Object.freeze({
  section:"16.1", name:"Partner & Company Accounts", status:"GREEN_CLOSED",
  failClosed:true, productionActivationAllowed:false, backendRequired:true,
  states:PARTNER_STATES, frontendCannotAuthorize:true, secretsBackendOnly:true
});
export function validatePartnerStateTransition(from,to){
  return PARTNER_STATES.includes(from) && PARTNER_STATES.includes(to) && (from===to || TRANSITIONS[from]?.includes(to)===true);
}
export function validatePartnerAccount(input={}){
  const required=["organizationId","legalName","accountType","country","contactEmail"];
  const complete=required.every(k=>typeof input[k]==="string"&&input[k].trim().length>0);
  const state=input.state||"APPLIED";
  return {ok:complete&&PARTNER_STATES.includes(state), failClosed:true, productionActivationAllowed:false, state};
}