"use strict";
// ============================================================
// Preference Service — CRUD + versioning for user preferences
// ============================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPreferences = getUserPreferences;
exports.getPreference = getPreference;
exports.createPreference = createPreference;
exports.updatePreference = updatePreference;
exports.archivePreference = archivePreference;
exports.deletePreference = deletePreference;
exports.getPreferenceHistory = getPreferenceHistory;
exports.createSuggestion = createSuggestion;
exports.getPendingSuggestions = getPendingSuggestions;
exports.resolveSuggestion = resolveSuggestion;
const supabase_1 = require("../db/supabase");
const shared_1 = require("@humanapi/shared");
const db = () => (0, supabase_1.getSupabase)();
// -----------------------------------------------------------
// Get all preferences for a user
// -----------------------------------------------------------
async function getUserPreferences(userId, category, status) {
    let query = db().from('preferences').select('*').eq('user_id', userId);
    if (category)
        query = query.eq('category', category);
    if (status)
        query = query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
// -----------------------------------------------------------
// Get a single preference
// -----------------------------------------------------------
async function getPreference(id) {
    const { data, error } = await db().from('preferences').select('*').eq('id', id).single();
    if (error)
        return null;
    return data;
}
// -----------------------------------------------------------
// Create a preference (with initial version)
// -----------------------------------------------------------
async function createPreference(userId, category, key, value, source, confidence = 1.0, importance = 'MEDIUM', status = shared_1.PreferenceStatus.ACTIVE) {
    const { data, error } = await db()
        .from('preferences')
        .upsert({
        user_id: userId,
        category,
        key,
        value,
        source,
        confidence,
        importance,
        status,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,category,key' })
        .select()
        .single();
    if (error)
        throw error;
    // Create initial version
    await db().from('preference_versions').insert({
        preference_id: data.id,
        value,
        source,
        changed_by: source === shared_1.PreferenceSource.AI_INFERRED ? 'ai' : 'user',
    });
    return data;
}
// -----------------------------------------------------------
// Update a preference (with version tracking)
// -----------------------------------------------------------
async function updatePreference(id, updates) {
    const { data, error } = await db()
        .from('preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    // Create version entry if value changed
    if (updates.value !== undefined) {
        await db().from('preference_versions').insert({
            preference_id: id,
            value: updates.value,
            source: updates.source || data.source,
            changed_by: updates.source === shared_1.PreferenceSource.AI_INFERRED ? 'ai' : 'user',
        });
    }
    return data;
}
// -----------------------------------------------------------
// Delete (archive) a preference
// -----------------------------------------------------------
async function archivePreference(id) {
    await db()
        .from('preferences')
        .update({ status: shared_1.PreferenceStatus.ARCHIVED, updated_at: new Date().toISOString() })
        .eq('id', id);
}
// -----------------------------------------------------------
// Delete a preference permanently
// -----------------------------------------------------------
async function deletePreference(id) {
    await db().from('preferences').delete().eq('id', id);
}
// -----------------------------------------------------------
// Get preference version history
// -----------------------------------------------------------
async function getPreferenceHistory(preferenceId) {
    const { data, error } = await db()
        .from('preference_versions')
        .select('*')
        .eq('preference_id', preferenceId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
// -----------------------------------------------------------
// Preference Suggestions
// -----------------------------------------------------------
async function createSuggestion(userId, category, key, proposedValue, reason, confidence, source) {
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
    if (error)
        throw error;
    return data;
}
async function getPendingSuggestions(userId) {
    const { data, error } = await db()
        .from('preference_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', shared_1.SuggestionStatus.PENDING)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
async function resolveSuggestion(id, status) {
    await db()
        .from('preference_suggestions')
        .update({ status, resolved_at: new Date().toISOString() })
        .eq('id', id);
}
