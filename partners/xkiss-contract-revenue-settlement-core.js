export const XKISS_CONTRACT_REVENUE_SETTLEMENT={section:"16.9",status:"GREEN_CLOSED",failClosed:true,productionActivationAllowed:false,backendRequired:true,settlementProviderRequired:true,noFrontendPayoutAuthorization:true};
export function validateSettlementInstruction(input={}){
  const contract=typeof input.contractId==="string"&&input.contractId.length>0;
  const amount=typeof input.amount==="number"&&Number.isFinite(input.amount)&&input.amount>=0;
  return {ok:contract&&amount,contractId:contract?input.contractId:null,amount:amount?input.amount:null,settlementAllowed:false,failClosed:true};
}