export const runtime="nodejs";
export async function GET(){return Response.json({status:"ok",service:"fluxo",version:"1.0.0",providerMode:process.env.FLUXO_PROVIDER_MODE??"sandbox"})}
