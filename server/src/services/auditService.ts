import { supabase } from '../lib/supabase';
import { v4 as uuid } from 'uuid';

export const logAudit = async (
  actor_id: string | null,
  action: string,
  entity_type: string,
  entity_id: string,
  details: any = {}
) => {
  try {
    const isDemoAdmin = actor_id === 'admin-demo-id';
    const finalActorId = isDemoAdmin ? null : actor_id;
    if (isDemoAdmin) {
      details.actor_name = 'Demo Admin';
    }

    const { error } = await supabase.from('audits').insert({
      id: uuid(),
      actor_id: finalActorId,
      action,
      entity_type,
      entity_id,
      details,
    });
    if (error) {
      console.error('Audit insert error:', error.message, error.details);
    }
  } catch (error) {
    console.error('Audit log failed:', error);
  }
};
