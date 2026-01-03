-- Migration: Add Category Groups for Two-Tier System
-- Created: 2025-12-31
-- Purpose: Create tables for simple/advanced category grouping

-- Create category_groups table
CREATE TABLE IF NOT EXISTS category_groups (
    id SERIAL PRIMARY KEY,
    group_key VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_category_groups_group_key ON category_groups(group_key);
CREATE INDEX idx_category_groups_sort_order ON category_groups(sort_order);

-- Create category_group_mappings table
CREATE TABLE IF NOT EXISTS category_group_mappings (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL,
    lexdomain_id INTEGER NOT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES category_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (lexdomain_id) REFERENCES lexdomains(lexdomainid) ON DELETE CASCADE,
    UNIQUE(group_id, lexdomain_id)
);

CREATE INDEX idx_category_group_mappings_group_id ON category_group_mappings(group_id);
CREATE INDEX idx_category_group_mappings_lexdomain_id ON category_group_mappings(lexdomain_id);

-- Insert Simple Mode category groups (15 categories)
INSERT INTO category_groups (group_key, display_name, description, icon, sort_order) VALUES
('people_society', 'People & Society', 'Human beings, social groups, and social interactions', '👥', 1),
('nature_living', 'Nature & Living Things', 'Plants, animals, and natural phenomena', '🌿', 2),
('objects_things', 'Objects & Things', 'Physical objects, artifacts, and manufactured items', '🔧', 3),
('actions_events', 'Actions & Events', 'Activities, happenings, and processes', '⚡', 4),
('communication', 'Communication & Expression', 'Language, speech, and communicative acts', '💬', 5),
('movement_physical', 'Movement & Physical Action', 'Physical motion, contact, and bodily changes', '🏃', 6),
('thinking_knowledge', 'Thinking & Knowledge', 'Mental processes, cognition, and perception', '🧠', 7),
('materials_substances', 'Materials & Substances', 'Physical substances, materials, and food', '🧪', 8),
('body_health', 'Body & Health', 'Human anatomy and body parts', '❤️', 9),
('places_locations', 'Places & Locations', 'Geographic locations and spatial concepts', '📍', 10),
('qualities_attributes', 'Qualities & Attributes', 'Properties, characteristics, and feelings', '✨', 11),
('states_conditions', 'States & Conditions', 'Situations, circumstances, and states of being', '🔄', 12),
('time_quantity', 'Time & Quantity', 'Temporal concepts and numerical measures', '⏰', 13),
('creation_ownership', 'Creation, Ownership & Possession', 'Making, owning, and using resources', '🎨', 14),
('descriptive_words', 'Descriptive Words', 'Adjectives and adverbs that modify meaning', '📝', 15);

-- Insert mappings for each category group
-- Note: lexdomainid values from the lexdomains table

-- People & Society (noun.person=18, noun.group=14, verb.social=41)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'people_society'), 18),
((SELECT id FROM category_groups WHERE group_key = 'people_society'), 14),
((SELECT id FROM category_groups WHERE group_key = 'people_society'), 41);

-- Nature & Living Things (noun.plant=20, noun.animal=5, noun.phenomenon=19)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'nature_living'), 20),
((SELECT id FROM category_groups WHERE group_key = 'nature_living'), 5),
((SELECT id FROM category_groups WHERE group_key = 'nature_living'), 19);

-- Objects & Things (noun.artifact=6, noun.object=17)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'objects_things'), 6),
((SELECT id FROM category_groups WHERE group_key = 'objects_things'), 17);

-- Actions & Events (noun.act=4, noun.event=11, noun.process=22)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'actions_events'), 4),
((SELECT id FROM category_groups WHERE group_key = 'actions_events'), 11),
((SELECT id FROM category_groups WHERE group_key = 'actions_events'), 22);

-- Communication & Expression (noun.communication=10, verb.communication=32)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'communication'), 10),
((SELECT id FROM category_groups WHERE group_key = 'communication'), 32);

-- Movement & Physical Action (verb.change=30, verb.contact=35, verb.motion=38, verb.body=29)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'movement_physical'), 30),
((SELECT id FROM category_groups WHERE group_key = 'movement_physical'), 35),
((SELECT id FROM category_groups WHERE group_key = 'movement_physical'), 38),
((SELECT id FROM category_groups WHERE group_key = 'movement_physical'), 29);

-- Thinking & Knowledge (noun.cognition=9, verb.cognition=31, verb.perception=39)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'thinking_knowledge'), 9),
((SELECT id FROM category_groups WHERE group_key = 'thinking_knowledge'), 31),
((SELECT id FROM category_groups WHERE group_key = 'thinking_knowledge'), 39);

-- Materials & Substances (noun.substance=27, noun.food=13)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'materials_substances'), 27),
((SELECT id FROM category_groups WHERE group_key = 'materials_substances'), 13);

-- Body & Health (noun.body=8)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'body_health'), 8);

-- Places & Locations (noun.location=15)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'places_locations'), 15);

-- Qualities & Attributes (noun.attribute=7, noun.feeling=12)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'qualities_attributes'), 7),
((SELECT id FROM category_groups WHERE group_key = 'qualities_attributes'), 12);

-- States & Conditions (noun.state=26)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'states_conditions'), 26);

-- Time & Quantity (noun.quantity=23, noun.time=28)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'time_quantity'), 23),
((SELECT id FROM category_groups WHERE group_key = 'time_quantity'), 28);

-- Creation, Ownership & Possession (verb.creation=36, noun.possession=21, verb.possession=40, verb.consumption=34, verb.competition=33)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'creation_ownership'), 36),
((SELECT id FROM category_groups WHERE group_key = 'creation_ownership'), 21),
((SELECT id FROM category_groups WHERE group_key = 'creation_ownership'), 40),
((SELECT id FROM category_groups WHERE group_key = 'creation_ownership'), 34),
((SELECT id FROM category_groups WHERE group_key = 'creation_ownership'), 33);

-- Descriptive Words (adj.all=0, adj.pert=1, adv.all=2)
INSERT INTO category_group_mappings (group_id, lexdomain_id) VALUES
((SELECT id FROM category_groups WHERE group_key = 'descriptive_words'), 0),
((SELECT id FROM category_groups WHERE group_key = 'descriptive_words'), 1),
((SELECT id FROM category_groups WHERE group_key = 'descriptive_words'), 2);

-- Add comment
COMMENT ON TABLE category_groups IS 'Stores simplified category groups for user-friendly word filtering';
COMMENT ON TABLE category_group_mappings IS 'Maps category groups to lexdomains for two-tier category system';
