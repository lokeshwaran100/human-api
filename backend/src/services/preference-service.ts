// ============================================================
// Preference Service — CRUD + versioning for user preferences
// ============================================================

import { getSupabase } from '../db/supabase';
import {
  Preference,
  PreferenceSource,
  PreferenceStatus,
  PreferenceVersion,
  PreferenceSuggestion,
  SuggestionStatus,
} from '@humanapi/shared';

const db = () => getSupabase();

// -----------------------------------------------------------
// Get all preferences for a user
// -----------------------------------------------------------
export async function getUserPreferences(
  userId: string,
  category?: string,
  status?: PreferenceStatus
): Promise<Preference[]> {
  let query = db().from('preferences').select('*').eq('user_id', userId);

  if (category) query = query.eq('category', category);
  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// -----------------------------------------------------------
// Get a single preference
// -----------------------------------------------------------
export async function getPreference(id: string): Promise<Preference | null> {
  const { data, error } = await db().from('preferences').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

// -----------------------------------------------------------
// Create a preference (with initial version)
// -----------------------------------------------------------
export async function createPreference(
  userId: string,
  category: string,
  key: string,
  value: any,
  source: PreferenceSource,
  confidence: number = 1.0,
  importance: string = 'MEDIUM',
  status: PreferenceStatus = PreferenceStatus.ACTIVE
): Promise<Preference> {
  const { data, error } = await db()
    .from('preferences')
    .upsert(
      {
        user_id: userId,
        category,
        key,
        value,
        source,
        confidence,
        importance,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,category,key' }
    )
    .select()
    .single();

  if (error) throw error;

  // Create initial version
  await db().from('preference_versions').insert({
    preference_id: data.id,
    value,
    source,
    changed_by: source === PreferenceSource.AI_INFERRED ? 'ai' : 'user',
  });

  return data;
}

// -----------------------------------------------------------
// Update a preference (with version tracking)
// -----------------------------------------------------------
export async function updatePreference(
  id: string,
  updates: Partial<Pick<Preference, 'value' | 'source' | 'confidence' | 'importance' | 'status'>>
): Promise<Preference> {
  const { data, error } = await db()
    .from('preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Create version entry if value changed
  if (updates.value !== undefined) {
    await db().from('preference_versions').insert({
      preference_id: id,
      value: updates.value,
      source: updates.source || data.source,
      changed_by: updates.source === PreferenceSource.AI_INFERRED ? 'ai' : 'user',
    });
  }

  return data;
}

// -----------------------------------------------------------
// Delete (archive) a preference
// -----------------------------------------------------------
export async function archivePreference(id: string): Promise<void> {
  await db()
    .from('preferences')
    .update({ status: PreferenceStatus.ARCHIVED, updated_at: new Date().toISOString() })
    .eq('id', id);
}

// -----------------------------------------------------------
// Delete a preference permanently
// -----------------------------------------------------------
export async function deletePreference(id: string): Promise<void> {
  await db().from('preferences').delete().eq('id', id);
}

// -----------------------------------------------------------
// Get preference version history
// -----------------------------------------------------------
export async function getPreferenceHistory(preferenceId: string): Promise<PreferenceVersion[]> {
  const { data, error } = await db()
    .from('preference_versions')
    .select('*')
    .eq('preference_id', preferenceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// -----------------------------------------------------------
// Preference Suggestions
// -----------------------------------------------------------
export async function createSuggestion(
  userId: string,
  category: string,
  key: string,
  proposedValue: any,
  reason: string,
  confidence: number,
  source: PreferenceSource
): Promise<PreferenceSuggestion> {
  const { data, error } = await db()
    .from('preference_suggestions')
    .insert({
      user_id: userId,
      category,
      key,
      proposed_value: proposedValue,
      reason,
      confidence,
      source,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPendingSuggestions(userId: string): Promise<PreferenceSuggestion[]> {
  const { data, error } = await db()
    .from('preference_suggestions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', SuggestionStatus.PENDING)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function resolveSuggestion(
  id: string,
  status: SuggestionStatus
): Promise<void> {
  await db()
    .from('preference_suggestions')
    .update({ status, resolved_at: new Date().toISOString() })
    .eq('id', id);
}
