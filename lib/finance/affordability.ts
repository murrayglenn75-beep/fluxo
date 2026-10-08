export type AffordabilityInput={availableMinor:number;proposedMinor:number;unpaidBillsMinor:readonly number[];safetyBufferMinor?:number};
export function calculateAffordability({availableMinor,proposedMinor,unpaidBillsMinor,safetyBufferMinor=35000}:AffordabilityInput){
 for(const value of [availableMinor,proposedMinor,safetyBufferMinor,...unpaidBillsMinor])if(!Number.isSafeInteger(value)||value<0)throw new Error('Amounts must be nonnegative integer minor units.');
 const committedMinor=unpaidBillsMinor.reduce((sum,value)=>sum+BigInt(value),0n),reserved=committedMinor+BigInt(safetyBufferMinor);
 if(committedMinor>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Bill total exceeds supported amount.');
 const remaining=BigInt(availableMinor)-reserved,safeToSpendMinor=remaining>0n?Number(remaining):0;
 return{availableMinor,committedMinor:Number(committedMinor),safetyBufferMinor,safeToSpendMinor,proposedMinor,canAfford:proposedMinor<=safeToSpendMinor,remainingSafeMinor:safeToSpendMinor-proposedMinor};
}
