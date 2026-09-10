// Service hours per guide: what reading a guide is worth toward volunteer
// hours. Admins set it on the Guides tab of /admin/hours; anyone can read it.

import { supabase } from './supabase';
import { RpcError } from './guideTime';

export interface GuideHoursRow {
  guide_slug: string;
  hours: number;
  note: string | null;
  updated_by: string | null;   // profile id of the admin who set it
  updated_at: string;
}

export const fetchGuideHours = async (): Promise<Map<string, GuideHoursRow>> => {
  const sb = supabase();
  const out = new Map<string, GuideHoursRow>();
  if (!sb) return out;
  const { data, error } = await sb
    .from('guide_hours')
    .select('guide_slug, hours, note, updated_by, updated_at');
  if (error) throw new RpcError(error.message, error.code ?? null);
  for (const r of (data ?? []) as GuideHoursRow[]) out.set(r.guide_slug, { ...r, hours: Number(r.hours) });
  return out;
};

// Set what a guide is worth, or clear it with null. Admin only under RLS.
export const setGuideHours = async (
  slug: string,
  hours: number | null,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'Supabase is not configured.' };
  const { error } = hours == null
    ? await sb.from('guide_hours').delete().eq('guide_slug', slug)
    : await sb.from('guide_hours').upsert({ guide_slug: slug, hours }, { onConflict: 'guide_slug' });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
};
