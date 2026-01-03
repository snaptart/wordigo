-- Query to analyze word availability by difficulty band and word length
-- This helps understand how word length filters affect the available word pool

-- First, let's see the overall distribution by band
SELECT
    'Overall Distribution' as filter_type,
    difficulty_band,
    COUNT(*) as word_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM wordigo_difficulty_calculated wdc
JOIN senses s ON wdc.senseid = s.senseid
JOIN words w ON s.wordid = w.wordid
WHERE difficulty_band IS NOT NULL
GROUP BY difficulty_band
ORDER BY difficulty_band;

-- Now let's see distribution with SHORT filter (0-6 chars)
SELECT
    'Short (0-6 chars)' as filter_type,
    difficulty_band,
    COUNT(*) as word_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM wordigo_difficulty_calculated wdc
JOIN senses s ON wdc.senseid = s.senseid
JOIN words w ON s.wordid = w.wordid
WHERE difficulty_band IS NOT NULL
AND LENGTH(w.lemma) <= 6
GROUP BY difficulty_band
ORDER BY difficulty_band;

-- MEDIUM filter (7-12 chars)
SELECT
    'Medium (7-12 chars)' as filter_type,
    difficulty_band,
    COUNT(*) as word_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM wordigo_difficulty_calculated wdc
JOIN senses s ON wdc.senseid = s.senseid
JOIN words w ON s.wordid = w.wordid
WHERE difficulty_band IS NOT NULL
AND LENGTH(w.lemma) BETWEEN 7 AND 12
GROUP BY difficulty_band
ORDER BY difficulty_band;

-- LONG filter (13+ chars)
SELECT
    'Long (13+ chars)' as filter_type,
    difficulty_band,
    COUNT(*) as word_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM wordigo_difficulty_calculated wdc
JOIN senses s ON wdc.senseid = s.senseid
JOIN words w ON s.wordid = w.wordid
WHERE difficulty_band IS NOT NULL
AND LENGTH(w.lemma) >= 13
GROUP BY difficulty_band
ORDER BY difficulty_band;

-- Combined summary showing all filters side by side
WITH overall AS (
    SELECT
        difficulty_band,
        COUNT(*) as total_words
    FROM wordigo_difficulty_calculated wdc
    JOIN senses s ON wdc.senseid = s.senseid
    JOIN words w ON s.wordid = w.wordid
    WHERE difficulty_band IS NOT NULL
    GROUP BY difficulty_band
),
short AS (
    SELECT
        difficulty_band,
        COUNT(*) as short_words
    FROM wordigo_difficulty_calculated wdc
    JOIN senses s ON wdc.senseid = s.senseid
    JOIN words w ON s.wordid = w.wordid
    WHERE difficulty_band IS NOT NULL
    AND LENGTH(w.lemma) <= 6
    GROUP BY difficulty_band
),
medium AS (
    SELECT
        difficulty_band,
        COUNT(*) as medium_words
    FROM wordigo_difficulty_calculated wdc
    JOIN senses s ON wdc.senseid = s.senseid
    JOIN words w ON s.wordid = w.wordid
    WHERE difficulty_band IS NOT NULL
    AND LENGTH(w.lemma) BETWEEN 7 AND 12
    GROUP BY difficulty_band
),
long AS (
    SELECT
        difficulty_band,
        COUNT(*) as long_words
    FROM wordigo_difficulty_calculated wdc
    JOIN senses s ON wdc.senseid = s.senseid
    JOIN words w ON s.wordid = w.wordid
    WHERE difficulty_band IS NOT NULL
    AND LENGTH(w.lemma) >= 13
    GROUP BY difficulty_band
)
SELECT
    o.difficulty_band as "Band",
    o.total_words as "All Words",
    COALESCE(s.short_words, 0) as "Short (0-6)",
    ROUND(COALESCE(s.short_words, 0) * 100.0 / o.total_words, 1) as "Short %",
    COALESCE(m.medium_words, 0) as "Medium (7-12)",
    ROUND(COALESCE(m.medium_words, 0) * 100.0 / o.total_words, 1) as "Medium %",
    COALESCE(l.long_words, 0) as "Long (13+)",
    ROUND(COALESCE(l.long_words, 0) * 100.0 / o.total_words, 1) as "Long %"
FROM overall o
LEFT JOIN short s ON o.difficulty_band = s.difficulty_band
LEFT JOIN medium m ON o.difficulty_band = m.difficulty_band
LEFT JOIN long l ON o.difficulty_band = l.difficulty_band
ORDER BY o.difficulty_band;

-- Additional analysis: Word length distribution within each band
SELECT
    difficulty_band as "Band",
    MIN(LENGTH(w.lemma)) as "Min Length",
    ROUND(AVG(LENGTH(w.lemma)), 1) as "Avg Length",
    MAX(LENGTH(w.lemma)) as "Max Length",
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY LENGTH(w.lemma)) as "Median Length"
FROM wordigo_difficulty_calculated wdc
JOIN senses s ON wdc.senseid = s.senseid
JOIN words w ON s.wordid = w.wordid
WHERE difficulty_band IS NOT NULL
GROUP BY difficulty_band
ORDER BY difficulty_band;
