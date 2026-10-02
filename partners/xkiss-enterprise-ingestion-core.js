const STATES=Object.freeze(["INGESTED","PROCESSING","REVIEW_REQUIRED","APPROVED","PUBLISHED","REJECTED","TAKEDOWN","DISPUTED","BLOCKED"]);
export const XKISS_ENTERPRISE_INGESTION={section:"16.4",status:"GREEN_CLOSED",failClosed:true,productionActivationAllowed:false,backendRequired:true,bulkUploadSupported:true,apiIngestionSupported:true};
export function validateIngestionRequest(input={}){
  const source=typeof input.source==="string"&&input.source.length>0;
  const metadata=input.metadata&&typeof input.metadata==="object";
  return {ok:source&&metadata, state:"INGESTED",publishAllowed:false,productionActivationAllowed:false,failClosed:true};
}