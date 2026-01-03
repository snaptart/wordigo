# WordNet 3.1 Database Schema Summary

This document provides a complete analysis of the WordNet 3.1 database schema extracted from `wordnet_3_1.sql`. The focus is on the core WordNet tables (excluding custom wordigo_* tables).

---

## Table 1: adjpositions
**Purpose**: Maps adjectives to their positions relative to nouns (attributive, predicate, immediate predicate)

**Columns**:
- `synsetid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `wordid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `position` - enum('a','p','ip') NOT NULL

**Primary Key**: (synsetid, wordid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 2: adjpositiontypes
**Purpose**: Lookup table for adjective position types (attributive 'a', predicate 'p', immediate predicate 'ip')

**Columns**:
- `position` - enum('a','p','ip') NOT NULL
- `positionname` - varchar(24) NOT NULL

**Primary Key**: (position)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 3: casedwords
**Purpose**: Stores properly-cased versions of words (for display purposes)

**Columns**:
- `casedwordid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `wordid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `cased` - varchar(80) CHARACTER SET utf8mb3 COLLATE utf8mb3_bin NOT NULL (case-sensitive)

**Primary Key**: (casedwordid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci (utf8mb3_bin for cased column)

---

## Table 4: lexdomains
**Purpose**: Lexical domain classification (semantic categories like "noun.person", "verb.motion", etc.)

**Columns**:
- `lexdomainid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0
- `lexdomainname` - varchar(32) DEFAULT NULL
- `lexdomain` - varchar(32) DEFAULT NULL
- `pos` - enum('n','v','a','r','s') DEFAULT NULL (Part of Speech: noun, verb, adjective, adverb, satellite-adjective)

**Primary Key**: (lexdomainid)

**Indexes**:
- KEY `lexdomainname` (`lexdomainname`) USING HASH

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 5: lexlinks
**Purpose**: Lexical relationships between word senses (synonymy, antonymy, similarity, etc.)

**Columns**:
- `synset1id` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `word1id` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `synset2id` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `word2id` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `linkid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0 (references linktypes table)

**Primary Key**: (word1id, synset1id, word2id, synset2id, linkid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 6: linktypes
**Purpose**: Types of lexical relationships (similar, antonym, etc.)

**Columns**:
- `linkid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0
- `link` - varchar(50) DEFAULT NULL
- `recurses` - tinyint(1) NOT NULL DEFAULT 0

**Primary Key**: (linkid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 7: morphmaps
**Purpose**: Maps words to their morphological forms (base forms)

**Columns**:
- `wordid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `pos` - enum('n','v','a','r','s') NOT NULL DEFAULT 'n'
- `morphid` - int(10) UNSIGNED NOT NULL DEFAULT 0

**Primary Key**: (morphid, pos, wordid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 8: morphs
**Purpose**: Stores morphological forms (base/lemma forms of words)

**Columns**:
- `morphid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `morph` - varchar(70) NOT NULL

**Primary Key**: (morphid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 9: postypes
**Purpose**: Lookup table for part-of-speech categories

**Columns**:
- `pos` - enum('n','v','a','r','s') NOT NULL
- `posname` - varchar(20) NOT NULL

**Primary Key**: (pos)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 10: samples
**Purpose**: Example sentences demonstrating usage of word senses

**Columns**:
- `synsetid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `sampleid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0
- `sample` - mediumtext NOT NULL

**Primary Key**: (synsetid, sampleid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 11: semlinks
**Purpose**: Semantic relationships between synsets (hypernym, hyponym, meronym, holonym, etc.)

**Columns**:
- `synset1id` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `synset2id` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `linkid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0 (references linktypes table)

**Primary Key**: (synset1id, synset2id, linkid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 12: senses
**Purpose**: Word senses (meanings) and their mappings to synsets and word forms

**Columns**:
- `wordid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `casedwordid` - int(10) UNSIGNED DEFAULT NULL
- `synsetid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `senseid` - int(10) UNSIGNED DEFAULT NULL
- `sensenum` - smallint(5) UNSIGNED NOT NULL DEFAULT 0 (sense number for a given word)
- `lexid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0
- `tagcount` - int(10) UNSIGNED DEFAULT NULL (frequency of this sense in corpus)
- `sensekey` - varchar(100) DEFAULT NULL (unique identifier for sense)

**Primary Key**: (wordid, synsetid)

**Indexes**:
- KEY `synsetid` (`synsetid`)
- KEY `casedwordid` (`casedwordid`) USING HASH
- KEY `senseid` (`senseid`) USING BTREE

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 13: synsets
**Purpose**: Core table - represents sets of synonyms (concepts/meanings)

**Columns**:
- `synsetid` - int(10) UNSIGNED NOT NULL DEFAULT 0 (unique concept identifier)
- `pos` - enum('n','v','a','r','s') NOT NULL
- `lexdomainid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0
- `definition` - mediumtext DEFAULT NULL

**Primary Key**: (synsetid)

**Indexes**:
- KEY `lexdomainid` (`lexdomainid`)
- KEY `synsetid` (`synsetid`) USING BTREE

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 14: vframemaps
**Purpose**: Maps word senses to verb frames (syntactic patterns for verbs)

**Columns**:
- `synsetid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `wordid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `frameid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0

**Primary Key**: (synsetid, wordid, frameid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 15: vframes
**Purpose**: Verb frame descriptions (syntactic templates)

**Columns**:
- `frameid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0
- `frame` - varchar(50) DEFAULT NULL

**Primary Key**: (frameid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 16: vframesentencemaps
**Purpose**: Maps word senses to example sentences for verb frames

**Columns**:
- `synsetid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `wordid` - int(10) UNSIGNED NOT NULL DEFAULT 0
- `sentenceid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0

**Primary Key**: (synsetid, wordid, sentenceid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 17: vframesentences
**Purpose**: Example sentences for verb frames

**Columns**:
- `sentenceid` - smallint(5) UNSIGNED NOT NULL DEFAULT 0
- `sentence` - mediumtext DEFAULT NULL

**Primary Key**: (sentenceid)

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Table 18: words
**Purpose**: Core table - stores lemmas (base word forms)

**Columns**:
- `wordid` - int(10) UNSIGNED NOT NULL DEFAULT 0 (unique word identifier)
- `lemma` - varchar(80) NOT NULL

**Primary Key**: (wordid)

**Indexes**:
- KEY `wordid` (`wordid`) USING BTREE

**Engine**: MyISAM
**Charset**: utf8mb3_general_ci

---

## Custom Tables (Wordigo Extensions)

### wordigo_difficulty
**Purpose**: Difficulty metrics for word senses (readability and syllable analysis)

**Columns**:
- `senseid` - int(11) NOT NULL
- `word_syllable_count` - int(11) DEFAULT NULL
- `word_in_definition` - int(11) DEFAULT 0
- `def_avg_read_score` - int(11) DEFAULT NULL
- `def_num_chars` - int(11) DEFAULT NULL
- `def_avg_read_score_band` - int(11) DEFAULT NULL
- `def_num_chars_band` - int(11) DEFAULT NULL

**Primary Key**: (senseid)
**Index**: KEY `sense_id` (`senseid`) USING BTREE

**Engine**: InnoDB
**Charset**: latin1_swedish_ci

---

### wordigo_history
**Purpose**: User interaction logging for the Wordigo learning game

**Columns**:
- `wordigo_history_ID` - int(20) NOT NULL (auto-increment)
- `hp_flag` - tinyint(4) DEFAULT NULL (home page flag)
- `senseid` - int(10) DEFAULT NULL (the correct word sense)
- `senseid_false` - int(10) DEFAULT NULL (incorrect choice)
- `senseid_selected` - int(10) DEFAULT 0 (user's selection)
- `def_order` - tinyint(4) DEFAULT NULL (position of true definition)
- `user_ID` - int(20) DEFAULT NULL
- `php_session_ID` - varchar(32) DEFAULT NULL
- `wordigo_game_ID` - int(20) DEFAULT NULL
- `wordigo_result` - smallint(6) DEFAULT 0 (0=Unanswered, 1-3=strikes, 4=correct)
- `wordigo_tts` - int(10) DEFAULT NULL (Time to Select - allotted)
- `wordigo_tas` - int(10) DEFAULT NULL (Time at Select - actual user time)
- `create_ts` - datetime DEFAULT '0000-00-00 00:00:00'
- `update_ts` - timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()

**Primary Key**: (wordigo_history_ID)
**Indexes**:
- KEY `wordigo_history_ID` (`wordigo_history_ID`) USING BTREE
- KEY `wordigo_game_ID` (`wordigo_game_ID`) USING BTREE

**Engine**: InnoDB
**Charset**: utf8mb3_general_ci

---

## Key Relationships and Notes

### Core Data Flow
1. **words** (wordid) → **senses** (wordid) → **synsets** (synsetid)
   - Each word can have multiple senses (meanings)
   - Each sense maps to a synset (concept/definition)

2. **synsets** → **lexdomains** (lexdomainid)
   - Synsets are categorized into semantic domains

3. **semlinks** connects synsets together
   - Represents semantic relationships (hypernym, hyponym, etc.)

4. **lexlinks** connects word senses together
   - Represents lexical relationships between words

### Verb-Specific Features
- **vframes**: Syntactic templates for verbs
- **vframemaps**: Map word senses to verb frames
- **vframesentences**: Example sentences for verb frames
- **vframesentencemaps**: Connect senses to example sentences

### Adjective Features
- **adjpositions**: Position of adjectives relative to nouns
- **adjpositiontypes**: Lookup for position types

### Morphology
- **morphs**: Base/lemma forms of words
- **morphmaps**: Map inflected words to their base forms

### Data Types Used
- **UNSIGNED INT(10)**: For IDs (synsetid, wordid) - up to 4.2 billion values
- **SMALLINT(5) UNSIGNED**: For smaller IDs (sampleid, frameid, linkid)
- **ENUM**: For categorical values (pos, position, wordigo_result)
- **VARCHAR**: For text with known max length
- **MEDIUMTEXT**: For longer text (definitions, sentences, samples)
- **TINYINT**: For flags/small numbers

### Default Engine
- Most tables use **MyISAM** for speed (no foreign key constraints)
- Custom tables use **InnoDB** for transactions and referential integrity

### Database Size Characteristics
- File size: 48.5 MB
- Primarily read-only WordNet data with custom extensions
- Total of 18 tables (16 WordNet core + 2 Wordigo custom)
