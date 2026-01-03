/**
 * Category Group Service
 *
 * Handles operations for the two-tier category system:
 * - Simple Mode: 15 consolidated category groups
 * - Advanced Mode: Individual lexdomains (42 categories)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type CategoryMode = 'simple' | 'advanced';

export interface CategoryGroup {
  id: number;
  groupKey: string;
  displayName: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  lexdomainCount: number;
  senseCount?: number;
}

export interface CategoryGroupWithDomains extends CategoryGroup {
  lexdomains: Array<{
    lexdomainId: number;
    lexdomainName: string;
  }>;
}

export interface LexdomainCategory {
  lexdomainId: number;
  lexdomainName: string;
  displayName: string;
  pos: string | null;
  senseCount?: number;
}

/**
 * Get all category groups for Simple Mode
 */
export async function getCategoryGroups(
  includeCounts: boolean = false
): Promise<CategoryGroup[]> {
  const groups = await prisma.$queryRaw<Array<{
    id: number;
    group_key: string;
    display_name: string;
    description: string | null;
    icon: string | null;
    sort_order: number;
    lexdomain_count: bigint;
  }>>`
    SELECT
      cg.id,
      cg.group_key,
      cg.display_name,
      cg.description,
      cg.icon,
      cg.sort_order,
      COUNT(cgm.lexdomain_id) as lexdomain_count
    FROM category_groups cg
    LEFT JOIN category_group_mappings cgm ON cg.id = cgm.group_id
    WHERE cg.is_active = true
    GROUP BY cg.id, cg.group_key, cg.display_name, cg.description, cg.icon, cg.sort_order
    ORDER BY cg.sort_order
  `;

  const result: CategoryGroup[] = groups.map(g => ({
    id: g.id,
    groupKey: g.group_key,
    displayName: g.display_name,
    description: g.description,
    icon: g.icon,
    sortOrder: g.sort_order,
    lexdomainCount: Number(g.lexdomain_count)
  }));

  // Optionally include sense counts
  if (includeCounts) {
    for (const group of result) {
      const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT se.senseid) as count
        FROM category_group_mappings cgm
        JOIN synsets sy ON sy.lexdomainid = cgm.lexdomain_id
        JOIN senses se ON se.synsetid = sy.synsetid
        WHERE cgm.group_id = ${group.id}
      `;
      group.senseCount = Number(countResult[0].count);
    }
  }

  return result;
}

/**
 * Get a specific category group with its lexdomains
 */
export async function getCategoryGroupById(
  groupId: number
): Promise<CategoryGroupWithDomains | null> {
  const groups = await prisma.$queryRaw<Array<{
    id: number;
    group_key: string;
    display_name: string;
    description: string | null;
    icon: string | null;
    sort_order: number;
  }>>`
    SELECT id, group_key, display_name, description, icon, sort_order
    FROM category_groups
    WHERE id = ${groupId} AND is_active = true
  `;

  if (groups.length === 0) {
    return null;
  }

  const group = groups[0];

  // Get associated lexdomains
  const lexdomains = await prisma.$queryRaw<Array<{
    lexdomainid: number;
    lexdomainname: string;
  }>>`
    SELECT l.lexdomainid, l.lexdomainname
    FROM lexdomains l
    JOIN category_group_mappings cgm ON l.lexdomainid = cgm.lexdomain_id
    WHERE cgm.group_id = ${groupId}
    ORDER BY l.lexdomainname
  `;

  return {
    id: group.id,
    groupKey: group.group_key,
    displayName: group.display_name,
    description: group.description,
    icon: group.icon,
    sortOrder: group.sort_order,
    lexdomainCount: lexdomains.length,
    lexdomains: lexdomains.map(l => ({
      lexdomainId: l.lexdomainid,
      lexdomainName: l.lexdomainname
    }))
  };
}

/**
 * Get category group by key
 */
export async function getCategoryGroupByKey(
  groupKey: string
): Promise<CategoryGroupWithDomains | null> {
  const groups = await prisma.$queryRaw<Array<{ id: number }>>`
    SELECT id FROM category_groups WHERE group_key = ${groupKey} AND is_active = true
  `;

  if (groups.length === 0) {
    return null;
  }

  return getCategoryGroupById(groups[0].id);
}

/**
 * Expand category group keys to lexdomain IDs
 * Used when user selects Simple Mode categories
 */
export async function expandGroupKeysToLexdomainIds(
  groupKeys: string[]
): Promise<number[]> {
  if (groupKeys.length === 0) {
    return [];
  }

  const result = await prisma.$queryRaw<Array<{ lexdomain_id: number }>>`
    SELECT DISTINCT cgm.lexdomain_id
    FROM category_group_mappings cgm
    JOIN category_groups cg ON cgm.group_id = cg.id
    WHERE cg.group_key = ANY(${groupKeys}::text[])
      AND cg.is_active = true
  `;

  return result.map(r => r.lexdomain_id);
}

/**
 * Expand category group keys to lexdomain names
 * Used for word selection filtering
 */
export async function expandGroupKeysToLexdomainNames(
  groupKeys: string[]
): Promise<string[]> {
  if (groupKeys.length === 0) {
    return [];
  }

  const result = await prisma.$queryRaw<Array<{ lexdomainname: string }>>`
    SELECT DISTINCT l.lexdomainname
    FROM category_group_mappings cgm
    JOIN category_groups cg ON cgm.group_id = cg.id
    JOIN lexdomains l ON cgm.lexdomain_id = l.lexdomainid
    WHERE cg.group_key = ANY(${groupKeys}::text[])
      AND cg.is_active = true
  `;

  return result.map(r => r.lexdomainname);
}

/**
 * Get all lexdomains for Advanced Mode
 * Excludes technical categories (linkdef, tops, ppl)
 */
export async function getAdvancedModeCategories(
  includeCounts: boolean = false
): Promise<LexdomainCategory[]> {
  // Exclude technical categories: noun.tops, noun.linkdef, adj.ppl
  const domains = await prisma.$queryRaw<Array<{
    lexdomainid: number;
    lexdomainname: string;
    pos: string | null;
  }>>`
    SELECT lexdomainid, lexdomainname, pos
    FROM lexdomains
    WHERE lexdomainid NOT IN (3, 24, 44)
    ORDER BY lexdomainname
  `;

  const result: LexdomainCategory[] = domains.map(d => ({
    lexdomainId: d.lexdomainid,
    lexdomainName: d.lexdomainname,
    displayName: formatLexdomainDisplayName(d.lexdomainname),
    pos: d.pos
  }));

  // Optionally include sense counts
  if (includeCounts) {
    for (const domain of result) {
      const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT se.senseid) as count
        FROM synsets sy
        JOIN senses se ON se.synsetid = sy.synsetid
        WHERE sy.lexdomainid = ${domain.lexdomainId}
      `;
      domain.senseCount = Number(countResult[0].count);
    }
  }

  return result;
}

/**
 * Get categories based on mode
 */
export async function getCategoriesByMode(
  mode: CategoryMode,
  includeCounts: boolean = false
): Promise<CategoryGroup[] | LexdomainCategory[]> {
  if (mode === 'simple') {
    return getCategoryGroups(includeCounts);
  } else {
    return getAdvancedModeCategories(includeCounts);
  }
}

/**
 * Convert category preferences from any format to lexdomain names
 * Handles both simple mode (group keys) and advanced mode (lexdomain names)
 */
export async function normalizeCategoryPreferences(
  preferences: string[],
  mode: CategoryMode
): Promise<string[]> {
  if (preferences.length === 0) {
    return [];
  }

  if (mode === 'simple') {
    // Assume these are group keys, expand them
    return expandGroupKeysToLexdomainNames(preferences);
  } else {
    // These are already lexdomain names, return as-is
    return preferences;
  }
}

/**
 * Format lexdomain name for display
 * Matches the existing formatting in userPreferencesService
 */
function formatLexdomainDisplayName(lexdomainName: string): string {
  const categoryMap: Record<string, string> = {
    'noun.Tops': 'General',
    'noun.act': 'Actions & Events',
    'noun.animal': 'Animals',
    'noun.artifact': 'Objects & Artifacts',
    'noun.attribute': 'Attributes & Properties',
    'noun.body': 'Body & Anatomy',
    'noun.cognition': 'Knowledge & Thought',
    'noun.communication': 'Communication',
    'noun.event': 'Events & Occurrences',
    'noun.feeling': 'Feelings & Emotions',
    'noun.food': 'Food & Drink',
    'noun.group': 'Groups & Collections',
    'noun.location': 'Places & Locations',
    'noun.motive': 'Motives & Intentions',
    'noun.object': 'Objects',
    'noun.person': 'People',
    'noun.phenomenon': 'Natural Phenomena',
    'noun.plant': 'Plants & Vegetation',
    'noun.possession': 'Possessions & Property',
    'noun.process': 'Processes',
    'noun.quantity': 'Quantities & Measures',
    'noun.relation': 'Relations',
    'noun.shape': 'Shapes & Forms',
    'noun.state': 'States & Conditions',
    'noun.substance': 'Substances & Materials',
    'noun.time': 'Time',
    'verb.body': 'Body Actions',
    'verb.change': 'Changes',
    'verb.cognition': 'Mental Actions',
    'verb.communication': 'Communication Actions',
    'verb.competition': 'Competition & Sports',
    'verb.consumption': 'Consumption',
    'verb.contact': 'Contact & Touch',
    'verb.creation': 'Creation',
    'verb.emotion': 'Emotional Actions',
    'verb.motion': 'Movement',
    'verb.perception': 'Perception',
    'verb.possession': 'Possession',
    'verb.social': 'Social Actions',
    'verb.stative': 'States of Being',
    'verb.weather': 'Weather',
    'adj.all': 'Descriptive (Adjectives)',
    'adv.all': 'Modifiers (Adverbs)'
  };

  return categoryMap[lexdomainName] || lexdomainName;
}

export default {
  getCategoryGroups,
  getCategoryGroupById,
  getCategoryGroupByKey,
  expandGroupKeysToLexdomainIds,
  expandGroupKeysToLexdomainNames,
  getAdvancedModeCategories,
  getCategoriesByMode,
  normalizeCategoryPreferences
};
