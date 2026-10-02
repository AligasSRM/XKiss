export const XKISS_MEDIA_PROCESSING_DELIVERY={section:"16.5",status:"GREEN_CLOSED",failClosed:true,productionActivationAllowed:false,backendRequired:true,processingProviderRequired:true,protectedDeliveryRequired:true};
export function validateMediaProcessingStatus(input={}){
  const processing=["NOT_STARTED","QUEUED","PROCESSING","READY","FAILED"].includes(input.status);
  const delivery=["UNAVAILABLE","PROTECTED_READY"].includes(input.delivery||"UNAVAILABLE");
  return {ok:processing&&delivery,processingStatus:input.status||"NOT_STARTED",delivery:input.delivery||"UNAVAILABLE",publishAllowed:input.status==="READY"&&input.delivery==="PROTECTED_READY"&&false,failClosed:true};
}