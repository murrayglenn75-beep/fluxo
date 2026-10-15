import {createHmac,timingSafeEqual} from 'node:crypto';

/**
 * Example sandbox transport verifier. The secret is supplied only by a trusted
 * server configuration; never from a browser, webhook payload or public env.
 * Real providers require their own documented signature protocol.
 */
export function verifySandboxProviderWebhook(
 rawBody:Buffer,
 suppliedSignature:string,
 secret:Buffer,
 expected:{eventId:string;operationId:string;maxAgeSeconds:number},
 nowMs=Date.now()
):{eventId:string;operationId:string;payload:unknown}{
 if(secret.length<32||!Number.isFinite(nowMs)||!Number.isSafeInteger(expected.maxAgeSeconds)||
    expected.maxAgeSeconds<1||expected.maxAgeSeconds>600)throw new Error('invalid_verification_config');
 if(!/^[a-f0-9]{64}$/.test(suppliedSignature))throw new Error('invalid_signature');
 const actual=createHmac('sha256',secret).update(rawBody).digest();
 const supplied=Buffer.from(suppliedSignature,'hex');
 if(supplied.length!==actual.length||!timingSafeEqual(supplied,actual))
   throw new Error('invalid_signature');
 let data:unknown;
 try{data=JSON.parse(rawBody.toString('utf8'))}catch{throw new Error('invalid_provider_payload')}
 if(!data||typeof data!=='object')throw new Error('invalid_provider_payload');
 const obj=data as Record<string,unknown>;
 if(obj.eventId!==expected.eventId||obj.operationId!==expected.operationId||
    typeof obj.timestamp!=='string')throw new Error('provider_identity_mismatch');
 const at=Date.parse(obj.timestamp);
 if(!Number.isFinite(at)||at>nowMs+30_000||nowMs-at>expected.maxAgeSeconds*1000)
   throw new Error('stale_provider_evidence');
 // A durable UNIQUE(provider,eventId) check is still required to prevent
 // replay across workers or server restarts.
 return {eventId:expected.eventId,operationId:expected.operationId,payload:data};
}
