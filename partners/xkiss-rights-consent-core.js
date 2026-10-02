const RIGHTS=Object.freeze(["OWNED","LICENSED","DISTRIBUTED","UNKNOWN"]);
export const XKISS_RIGHTS_CONSENT={section:"16.3",status:"GREEN_CLOSED",failClosed:true,productionActivationAllowed:false,backendOwned:true,publicationRequiresRights:true};
export function validateRightsRecord(input={}){
  const rights=typeof input.rightsBasis==="string"?input.rightsBasis:"UNKNOWN";
  const consent=input.consentRecorded===true;
  const documented=["OWNED","LICENSED","DISTRIBUTED"].includes(rights);
  return {ok:true,rightsBasis:rights,consentRecorded:consent,publicationAllowed:documented&&consent,failClosed:!(documented&&consent)};
}