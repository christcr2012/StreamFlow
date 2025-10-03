import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../lib/auth';
import { auditService } from '../lib/auditService';

export function withAudience(expected: 'provider'|'tenant'|'portal', handler:(req:NextApiRequest,res:NextApiResponse)=>Promise<any>){
  return async function(req: NextApiRequest, res: NextApiResponse){
    try{
      const token:any = await verifyToken(req);
      const actual = token?.aud || 'unknown';
      const tenantId = token?.tenant_id || null;
      const ok = (expected===actual) && ((expected!=='tenant') || !!tenantId);
      if(!ok){
        await auditService.logBinderEvent({ action:'audience_reject', expected, actual, tenantId, path:req.url, ts: Date.now() });
        return res.status(403).json({ error:'FORBIDDEN', reason:'AUDIENCE_MISMATCH', expected, actual });
      }
      return handler(req,res);
    }catch(e){
      await auditService.logBinderEvent({ action:'audience_error', error:String(e), path:req.url, ts: Date.now() });
      return res.status(401).json({ error:'UNAUTHORIZED' });
    }
  }
}
