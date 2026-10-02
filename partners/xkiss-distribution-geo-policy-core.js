export const XKISS_DISTRIBUTION_GEO_POLICY={section:"16.7",status:"GREEN_CLOSED",failClosed:true,productionActivationAllowed:false,backendRequired:true,geoEnforcementRequired:true};
export function evaluateGeoPolicy({country,allowList=[],denyList=[]}={}){
  if(typeof country!=="string") return {allowed:false,reason:"country_required",failClosed:true};
  if(denyList.includes(country)) return {allowed:false,reason:"deny_list",failClosed:true};
  if(allowList.length&&!allowList.includes(country)) return {allowed:false,reason:"not_in_allow_list",failClosed:true};
  return {allowed:true,reason:"policy_match",failClosed:false};
}