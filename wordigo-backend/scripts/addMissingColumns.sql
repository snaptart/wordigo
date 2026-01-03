-- SQL Migration to add missing columns and tables to PostgreSQL
-- Run this BEFORE running the data migration script

-- 1. Add missing columns to existing tables

-- Add pos column to synsets (nullable first, will populate later)
ALTER TABLE synsets ADD COLUMN IF NOT EXISTS pos VARCHAR(1);

-- Add lexdomain and pos columns to lexdomains
ALTER TABLE lexdomains ADD COLUMN IF NOT EXISTS lexdomain VARCHAR(32);
ALTER TABLE lexdomains ADD COLUMN IF NOT EXISTS pos VARCHAR(1);

-- Add wordid column to casedwords (nullable first, will populate later)
ALTER TABLE casedwords ADD COLUMN IF NOT EXISTS wordid INTEGER;

-- 2. Create new tables

-- Link types
CREATE TABLE IF NOT EXISTS linktypes (
  linkid SMALLINT PRIMARY KEY,
  link VARCHAR(50),
  recurses BOOLEAN NOT NULL DEFAULT FALSE
);

-- Lexical links
CREATE TABLE IF NOT EXISTS lexlinks (
  synset1id INTEGER NOT NULL,
  word1id INTEGER NOT NULL,
  synset2id INTEGER NOT NULL,
  word2id INTEGER NOT NULL,
  linkid SMALLINT NOT NULL,
  PRIMARY KEY (word1id, synset1id, word2id, synset2id, linkid)
);
CREATE INDEX IF NOT EXISTS idx_lexlinks_word1id ON lexlinks(word1id);
CREATE INDEX IF NOT EXISTS idx_lexlinks_word2id ON lexlinks(word2id);

-- Semantic links
CREATE TABLE IF NOT EXISTS semlinks (
  synset1id INTEGER NOT NULL,
  synset2id INTEGER NOT NULL,
  linkid SMALLINT NOT NULL,
  PRIMARY KEY (synset1id, synset2id, linkid)
);
CREATE INDEX IF NOT EXISTS idx_semlinks_synset1id ON semlinks(synset1id);
CREATE INDEX IF NOT EXISTS idx_semlinks_synset2id ON semlinks(synset2id);

-- Samples
CREATE TABLE IF NOT EXISTS samples (
  synsetid INTEGER NOT NULL,
  sampleid SMALLINT NOT NULL,
  sample TEXT NOT NULL,
  PRIMARY KEY (synsetid, sampleid)
);

-- Morphs
CREATE TABLE IF NOT EXISTS morphs (
  morphid INTEGER PRIMARY KEY,
  morph VARCHAR(70) NOT NULL
);

-- Morph maps
CREATE TABLE IF NOT EXISTS morphmaps (
  wordid INTEGER NOT NULL,
  pos VARCHAR(1) NOT NULL,
  morphid INTEGER NOT NULL,
  PRIMARY KEY (morphid, pos, wordid)
);
CREATE INDEX IF NOT EXISTS idx_morphmaps_wordid ON morphmaps(wordid);

-- POS types
CREATE TABLE IF NOT EXISTS postypes (
  pos VARCHAR(1) PRIMARY KEY,
  posname VARCHAR(20) NOT NULL
);

-- Adjective positions
CREATE TABLE IF NOT EXISTS adjpositions (
  synsetid INTEGER NOT NULL,
  wordid INTEGER NOT NULL,
  position VARCHAR(2) NOT NULL,
  PRIMARY KEY (synsetid, wordid)
);

-- Adjective position types
CREATE TABLE IF NOT EXISTS adjpositiontypes (
  position VARCHAR(2) PRIMARY KEY,
  positionname VARCHAR(24) NOT NULL
);

-- Verb frames
CREATE TABLE IF NOT EXISTS vframes (
  frameid SMALLINT PRIMARY KEY,
  frame VARCHAR(50)
);

-- Verb frame maps
CREATE TABLE IF NOT EXISTS vframemaps (
  synsetid INTEGER NOT NULL,
  wordid INTEGER NOT NULL,
  frameid SMALLINT NOT NULL,
  PRIMARY KEY (synsetid, wordid, frameid)
);

-- Verb frame sentences
CREATE TABLE IF NOT EXISTS vframesentences (
  sentenceid SMALLINT PRIMARY KEY,
  sentence TEXT
);

-- Verb frame sentence maps
CREATE TABLE IF NOT EXISTS vframesentencemaps (
  synsetid INTEGER NOT NULL,
  wordid INTEGER NOT NULL,
  sentenceid SMALLINT NOT NULL,
  PRIMARY KEY (synsetid, wordid, sentenceid)
);

-- 3. Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_lexdomains_lexdomainname ON lexdomains(lexdomainname);
CREATE INDEX IF NOT EXISTS idx_synsets_pos ON synsets(pos);
CREATE INDEX IF NOT EXISTS idx_casedwords_wordid ON casedwords(wordid);

COMMIT;
