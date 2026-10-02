const STATUSES=Object.freeze(["NOT_STARTED","PENDING","VERIFIED","REJECTED","EXPIRED"]);
export const XKISS_ORGANIZATION_VERIFICATION={section:"16.2",status:"GREEN_CLOSED",failClosed:true,productionActivationAllowed:false,backendRequired:true,providerRequired:true};
export function validateOrganizationVerification(result={}){
  const status=result.status||"NOT_STARTED";
  const verified=status==="VERIFIED";
  return {ok:STATUSES.includes(status), status, verified, publishAllowed:false, failClosed:!verified};
}