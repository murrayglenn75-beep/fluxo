// Read-side sandbox tools only. Payment proposals still use approved-payment.ts.
export const READ_ONLY_AI_TOOLS=['financial.snapshot','affordability.check'] as const;
export function assertReadOnlyTool(tool:string){
 if(!(READ_ONLY_AI_TOOLS as readonly string[]).includes(tool))throw new Error('Tool is outside the read-only AI boundary.');
}
