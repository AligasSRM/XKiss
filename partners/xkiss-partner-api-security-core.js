const SCOPES=Object.freeze(["partner.read","partner.content.write","partner.analytics.read","partner.audit.read"]);
export const XKISS_PARTNER_API_SECURITY={section:"16.10",status:"GREEN_CLOSED",failClosed:true,productionActivationAllowed:false,backendRequired:true,scopedCredentials:true,rotationRequired:true,revocationSupported:true};
export function validateApiCredential(input={}){
  const scopes=Array.isArray(input.scopes)&&input.scopes.length>0&&input.scopes.every(s=>SCOPES.includes(s));
  const backendIssued=input.issuedByBackend===true;
  return {ok:scopes&&backendIssued,scopes:scopes?input.scopes:[],active:false,productionUseAllowed:false,failClosed:true};
}