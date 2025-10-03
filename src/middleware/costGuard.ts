import type { NextApiRequest, NextApiResponse } from 'next';
import { creditService } from '../server/services/creditService';

export function withCostGuard(handler:(req:NextApiRequest,res:NextApiResponse)=>Promise<any>, meters:{type:string, estimate:(req:NextApiRequest)=>number}[]){
  return async function(req: NextApiRequest, res: NextApiResponse){
    const token:any = (req as any).auth || null;
    const tenantId = token?.tenant_id;
    const est = meters.map(m=>({type:m.type, estimate:Number(m.estimate(req))||0}));
    const ok = await creditService.canAfford(tenantId, est);
    if(!ok){
      return res.status(402).json({ error:'PAYMENT_REQUIRED', requiredMeters: est, prepayUrl:`/api/tenant/billing/prepay?meters=${est.map(x=>x.type+':'+x.estimate).join(',')}` });
    }
    return handler(req,res);
  }
}
