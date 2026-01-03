-- CreateTable
CREATE TABLE "adjpositions" (
    "synsetid" INTEGER NOT NULL,
    "wordid" INTEGER NOT NULL,
    "position" VARCHAR(2) NOT NULL,

    CONSTRAINT "adjpositions_pkey" PRIMARY KEY ("synsetid","wordid")
);

-- CreateTable
CREATE TABLE "adjpositiontypes" (
    "position" VARCHAR(2) NOT NULL,
    "positionname" VARCHAR(24) NOT NULL,

    CONSTRAINT "adjpositiontypes_pkey" PRIMARY KEY ("position")
);

-- CreateTable
CREATE TABLE "casedwords" (
    "casedwordid" INTEGER NOT NULL,
    "wordid" INTEGER NOT NULL,
    "cased" VARCHAR(80) NOT NULL,

    CONSTRAINT "casedwords_pkey" PRIMARY KEY ("casedwordid")
);

-- CreateTable
CREATE TABLE "challenge_completions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "challenge_id" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_challenges" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "sense_ids" INTEGER[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_difficulty_presets" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "display_name" VARCHAR(50) NOT NULL,
    "word_count" INTEGER NOT NULL,
    "time_limit" INTEGER NOT NULL,
    "difficulty_band" INTEGER,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "game_difficulty_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lexdomains" (
    "lexdomainid" INTEGER NOT NULL,
    "lexdomainname" VARCHAR(40) NOT NULL,
    "lexdomain" VARCHAR(32),
    "pos" VARCHAR(1),

    CONSTRAINT "lexdomains_pkey" PRIMARY KEY ("lexdomainid")
);

-- CreateTable
CREATE TABLE "category_groups" (
    "id" SERIAL NOT NULL,
    "group_key" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(10),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_group_mappings" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "lexdomain_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_group_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lexlinks" (
    "synset1id" INTEGER NOT NULL,
    "word1id" INTEGER NOT NULL,
    "synset2id" INTEGER NOT NULL,
    "word2id" INTEGER NOT NULL,
    "linkid" INTEGER NOT NULL,

    CONSTRAINT "lexlinks_pkey" PRIMARY KEY ("word1id","synset1id","word2id","synset2id","linkid")
);

-- CreateTable
CREATE TABLE "linktypes" (
    "linkid" INTEGER NOT NULL,
    "link" VARCHAR(50),
    "recurses" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "linktypes_pkey" PRIMARY KEY ("linkid")
);

-- CreateTable
CREATE TABLE "morphmaps" (
    "wordid" INTEGER NOT NULL,
    "pos" VARCHAR(1) NOT NULL,
    "morphid" INTEGER NOT NULL,

    CONSTRAINT "morphmaps_pkey" PRIMARY KEY ("morphid","pos","wordid")
);

-- CreateTable
CREATE TABLE "morphs" (
    "morphid" INTEGER NOT NULL,
    "morph" VARCHAR(70) NOT NULL,

    CONSTRAINT "morphs_pkey" PRIMARY KEY ("morphid")
);

-- CreateTable
CREATE TABLE "multiplayer_matches" (
    "id" SERIAL NOT NULL,
    "player1_id" INTEGER NOT NULL,
    "player2_id" INTEGER NOT NULL,
    "winner_id" INTEGER,
    "player1_score" INTEGER NOT NULL DEFAULT 0,
    "player2_score" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "multiplayer_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "provider_id" VARCHAR(255) NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postypes" (
    "pos" VARCHAR(1) NOT NULL,
    "posname" VARCHAR(20) NOT NULL,

    CONSTRAINT "postypes_pkey" PRIMARY KEY ("pos")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "samples" (
    "synsetid" INTEGER NOT NULL,
    "sampleid" INTEGER NOT NULL,
    "sample" TEXT NOT NULL,

    CONSTRAINT "samples_pkey" PRIMARY KEY ("synsetid","sampleid")
);

-- CreateTable
CREATE TABLE "semlinks" (
    "synset1id" INTEGER NOT NULL,
    "synset2id" INTEGER NOT NULL,
    "linkid" INTEGER NOT NULL,

    CONSTRAINT "semlinks_pkey" PRIMARY KEY ("synset1id","synset2id","linkid")
);

-- CreateTable
CREATE TABLE "senses" (
    "senseid" INTEGER NOT NULL,
    "wordid" INTEGER NOT NULL,
    "synsetid" INTEGER NOT NULL,
    "casedwordid" INTEGER,
    "lexid" INTEGER,
    "tagcount" INTEGER,
    "sensenum" INTEGER,
    "sensekey" VARCHAR(100),

    CONSTRAINT "senses_pkey" PRIMARY KEY ("senseid")
);

-- CreateTable
CREATE TABLE "synsets" (
    "synsetid" INTEGER NOT NULL,
    "pos" VARCHAR(1) NOT NULL,
    "definition" TEXT NOT NULL,
    "lexdomainid" INTEGER NOT NULL,

    CONSTRAINT "synsets_pkey" PRIMARY KEY ("synsetid")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "default_difficulty" VARCHAR(20) NOT NULL DEFAULT 'adaptive',
    "word_length_filter" VARCHAR(20) NOT NULL DEFAULT 'all',
    "allow_obscure_words" BOOLEAN NOT NULL DEFAULT true,
    "category_preferences" JSONB,
    "category_mode" VARCHAR(20) DEFAULT 'simple',
    "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
    "haptic_feedback_enabled" BOOLEAN NOT NULL DEFAULT true,
    "adaptive_difficulty_data" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(100),
    "profile_picture" VARCHAR(500),
    "email_verified" BOOLEAN DEFAULT false,
    "verification_token" VARCHAR(255),
    "reset_password_token" VARCHAR(255),
    "reset_password_expires" TIMESTAMP(6),
    "last_login" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vframemaps" (
    "synsetid" INTEGER NOT NULL,
    "wordid" INTEGER NOT NULL,
    "frameid" INTEGER NOT NULL,

    CONSTRAINT "vframemaps_pkey" PRIMARY KEY ("synsetid","wordid","frameid")
);

-- CreateTable
CREATE TABLE "vframes" (
    "frameid" INTEGER NOT NULL,
    "frame" VARCHAR(50),

    CONSTRAINT "vframes_pkey" PRIMARY KEY ("frameid")
);

-- CreateTable
CREATE TABLE "vframesentencemaps" (
    "synsetid" INTEGER NOT NULL,
    "wordid" INTEGER NOT NULL,
    "sentenceid" INTEGER NOT NULL,

    CONSTRAINT "vframesentencemaps_pkey" PRIMARY KEY ("synsetid","wordid","sentenceid")
);

-- CreateTable
CREATE TABLE "vframesentences" (
    "sentenceid" INTEGER NOT NULL,
    "sentence" TEXT,

    CONSTRAINT "vframesentences_pkey" PRIMARY KEY ("sentenceid")
);

-- CreateTable
CREATE TABLE "wordigo_difficulty" (
    "senseid" INTEGER NOT NULL,
    "word_syllable_count" INTEGER,
    "word_in_definition" BOOLEAN DEFAULT false,
    "def_avg_read_score" DOUBLE PRECISION,
    "def_num_chars" INTEGER,
    "def_avg_read_score_band" INTEGER,
    "def_num_chars_band" INTEGER,

    CONSTRAINT "wordigo_difficulty_pkey" PRIMARY KEY ("senseid")
);

-- CreateTable
CREATE TABLE "wordigo_difficulty_calculated" (
    "senseid" INTEGER NOT NULL,
    "wordid" INTEGER NOT NULL,
    "synsetid" INTEGER NOT NULL,
    "lemma" VARCHAR(80),
    "word_length" INTEGER,
    "corpus_frequency" INTEGER,
    "def_char_count" INTEGER,
    "def_word_count" INTEGER,
    "sense_count" INTEGER,
    "lexdomain_category" VARCHAR(32),
    "connectivity_score" INTEGER,
    "hierarchy_depth" INTEGER,
    "word_complexity_score" DECIMAL(5,2),
    "frequency_score" DECIMAL(5,2),
    "definition_complexity_score" DECIMAL(5,2),
    "sense_ambiguity_score" DECIMAL(5,2),
    "domain_difficulty_score" DECIMAL(5,2),
    "connectivity_difficulty_score" DECIMAL(5,2),
    "hierarchy_difficulty_score" DECIMAL(5,2),
    "overall_difficulty_score" DECIMAL(6,2),
    "difficulty_band" INTEGER,
    "word_in_definition" BOOLEAN,
    "avg_word_length_in_def" DECIMAL(5,2),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wordigo_difficulty_calculated_pkey" PRIMARY KEY ("senseid")
);

-- CreateTable
CREATE TABLE "wordigo_games" (
    "id" SERIAL NOT NULL,
    "user_ID" INTEGER,
    "php_session_ID" VARCHAR(255),
    "difficulty" VARCHAR(20) NOT NULL,
    "total_words" INTEGER NOT NULL,
    "time_limit" INTEGER NOT NULL,
    "words_completed" INTEGER NOT NULL DEFAULT 0,
    "correct_words" INTEGER NOT NULL DEFAULT 0,
    "final_score" INTEGER,
    "time_remaining" INTEGER,
    "gameStatus" VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    "failReason" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "timer_enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "wordigo_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wordigo_history" (
    "wordigo_history_ID" SERIAL NOT NULL,
    "wordigo_game_ID" INTEGER,
    "senseid" INTEGER NOT NULL,
    "senseid_false" INTEGER NOT NULL,
    "senseid_selected" INTEGER,
    "hp_flag" INTEGER NOT NULL DEFAULT 0,
    "def_order" INTEGER NOT NULL,
    "user_ID" INTEGER,
    "php_session_ID" VARCHAR(255),
    "wordigo_tts" INTEGER,
    "wordigo_tas" INTEGER,
    "wordigo_result" INTEGER,
    "create_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wrong_sense_ids" JSONB,

    CONSTRAINT "wordigo_history_pkey" PRIMARY KEY ("wordigo_history_ID")
);

-- CreateTable
CREATE TABLE "words" (
    "wordid" INTEGER NOT NULL,
    "lemma" VARCHAR(80) NOT NULL,

    CONSTRAINT "words_pkey" PRIMARY KEY ("wordid")
);

-- CreateIndex
CREATE INDEX "casedwords_wordid_idx" ON "casedwords"("wordid");

-- CreateIndex
CREATE INDEX "challenge_completions_challenge_id_idx" ON "challenge_completions"("challenge_id");

-- CreateIndex
CREATE INDEX "challenge_completions_user_id_idx" ON "challenge_completions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "challenge_completions_user_id_challenge_id_key" ON "challenge_completions"("user_id", "challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_challenges_date_key" ON "daily_challenges"("date");

-- CreateIndex
CREATE INDEX "daily_challenges_date_idx" ON "daily_challenges"("date");

-- CreateIndex
CREATE UNIQUE INDEX "game_difficulty_presets_name_key" ON "game_difficulty_presets"("name");

-- CreateIndex
CREATE INDEX "game_difficulty_presets_name_idx" ON "game_difficulty_presets"("name");

-- CreateIndex
CREATE INDEX "lexdomains_lexdomainname_idx" ON "lexdomains"("lexdomainname");

-- CreateIndex
CREATE UNIQUE INDEX "category_groups_group_key_key" ON "category_groups"("group_key");

-- CreateIndex
CREATE INDEX "category_groups_group_key_idx" ON "category_groups"("group_key");

-- CreateIndex
CREATE INDEX "category_groups_sort_order_idx" ON "category_groups"("sort_order");

-- CreateIndex
CREATE INDEX "category_group_mappings_group_id_idx" ON "category_group_mappings"("group_id");

-- CreateIndex
CREATE INDEX "category_group_mappings_lexdomain_id_idx" ON "category_group_mappings"("lexdomain_id");

-- CreateIndex
CREATE UNIQUE INDEX "category_group_mappings_group_id_lexdomain_id_key" ON "category_group_mappings"("group_id", "lexdomain_id");

-- CreateIndex
CREATE INDEX "lexlinks_word1id_idx" ON "lexlinks"("word1id");

-- CreateIndex
CREATE INDEX "lexlinks_word2id_idx" ON "lexlinks"("word2id");

-- CreateIndex
CREATE INDEX "morphmaps_wordid_idx" ON "morphmaps"("wordid");

-- CreateIndex
CREATE INDEX "multiplayer_matches_player1_id_idx" ON "multiplayer_matches"("player1_id");

-- CreateIndex
CREATE INDEX "multiplayer_matches_player2_id_idx" ON "multiplayer_matches"("player2_id");

-- CreateIndex
CREATE INDEX "multiplayer_matches_status_idx" ON "multiplayer_matches"("status");

-- CreateIndex
CREATE INDEX "idx_oauth_accounts_provider" ON "oauth_accounts"("provider");

-- CreateIndex
CREATE INDEX "idx_oauth_accounts_user_id" ON "oauth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_accounts_provider_provider_id_key" ON "oauth_accounts"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "semlinks_synset1id_idx" ON "semlinks"("synset1id");

-- CreateIndex
CREATE INDEX "semlinks_synset2id_idx" ON "semlinks"("synset2id");

-- CreateIndex
CREATE INDEX "senses_casedwordid_idx" ON "senses"("casedwordid");

-- CreateIndex
CREATE INDEX "senses_synsetid_idx" ON "senses"("synsetid");

-- CreateIndex
CREATE INDEX "senses_wordid_idx" ON "senses"("wordid");

-- CreateIndex
CREATE INDEX "synsets_lexdomainid_idx" ON "synsets"("lexdomainid");

-- CreateIndex
CREATE INDEX "synsets_pos_idx" ON "synsets"("pos");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_preferences_user_id" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_verification_token_key" ON "users"("verification_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_reset_password_token_key" ON "users"("reset_password_token");

-- CreateIndex
CREATE INDEX "idx_users_reset_password_token" ON "users"("reset_password_token");

-- CreateIndex
CREATE INDEX "idx_users_verification_token" ON "users"("verification_token");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "wordigo_difficulty_def_avg_read_score_band_idx" ON "wordigo_difficulty"("def_avg_read_score_band");

-- CreateIndex
CREATE INDEX "wordigo_difficulty_def_num_chars_band_idx" ON "wordigo_difficulty"("def_num_chars_band");

-- CreateIndex
CREATE INDEX "idx_difficulty_band" ON "wordigo_difficulty_calculated"("difficulty_band");

-- CreateIndex
CREATE INDEX "idx_overall_score" ON "wordigo_difficulty_calculated"("overall_difficulty_score");

-- CreateIndex
CREATE INDEX "idx_synsetid" ON "wordigo_difficulty_calculated"("synsetid");

-- CreateIndex
CREATE INDEX "idx_wordid" ON "wordigo_difficulty_calculated"("wordid");

-- CreateIndex
CREATE INDEX "wordigo_games_created_at_idx" ON "wordigo_games"("created_at");

-- CreateIndex
CREATE INDEX "wordigo_games_gameStatus_idx" ON "wordigo_games"("gameStatus");

-- CreateIndex
CREATE INDEX "wordigo_games_php_session_ID_idx" ON "wordigo_games"("php_session_ID");

-- CreateIndex
CREATE INDEX "wordigo_games_user_ID_idx" ON "wordigo_games"("user_ID");

-- CreateIndex
CREATE INDEX "wordigo_history_create_ts_idx" ON "wordigo_history"("create_ts");

-- CreateIndex
CREATE INDEX "wordigo_history_user_ID_idx" ON "wordigo_history"("user_ID");

-- CreateIndex
CREATE INDEX "wordigo_history_wordigo_game_ID_idx" ON "wordigo_history"("wordigo_game_ID");

-- CreateIndex
CREATE INDEX "words_lemma_idx" ON "words"("lemma");

-- AddForeignKey
ALTER TABLE "adjpositions" ADD CONSTRAINT "adjpositions_synsetid_fkey" FOREIGN KEY ("synsetid") REFERENCES "synsets"("synsetid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adjpositions" ADD CONSTRAINT "adjpositions_wordid_fkey" FOREIGN KEY ("wordid") REFERENCES "words"("wordid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casedwords" ADD CONSTRAINT "casedwords_wordid_fkey" FOREIGN KEY ("wordid") REFERENCES "words"("wordid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_group_mappings" ADD CONSTRAINT "category_group_mappings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "category_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_group_mappings" ADD CONSTRAINT "category_group_mappings_lexdomain_id_fkey" FOREIGN KEY ("lexdomain_id") REFERENCES "lexdomains"("lexdomainid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lexlinks" ADD CONSTRAINT "lexlinks_linkid_fkey" FOREIGN KEY ("linkid") REFERENCES "linktypes"("linkid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lexlinks" ADD CONSTRAINT "lexlinks_word1id_fkey" FOREIGN KEY ("word1id") REFERENCES "words"("wordid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lexlinks" ADD CONSTRAINT "lexlinks_word2id_fkey" FOREIGN KEY ("word2id") REFERENCES "words"("wordid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morphmaps" ADD CONSTRAINT "morphmaps_morphid_fkey" FOREIGN KEY ("morphid") REFERENCES "morphs"("morphid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "morphmaps" ADD CONSTRAINT "morphmaps_wordid_fkey" FOREIGN KEY ("wordid") REFERENCES "words"("wordid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "fk_oauth_accounts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_synsetid_fkey" FOREIGN KEY ("synsetid") REFERENCES "synsets"("synsetid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semlinks" ADD CONSTRAINT "semlinks_linkid_fkey" FOREIGN KEY ("linkid") REFERENCES "linktypes"("linkid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semlinks" ADD CONSTRAINT "semlinks_synset1id_fkey" FOREIGN KEY ("synset1id") REFERENCES "synsets"("synsetid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "semlinks" ADD CONSTRAINT "semlinks_synset2id_fkey" FOREIGN KEY ("synset2id") REFERENCES "synsets"("synsetid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "senses" ADD CONSTRAINT "senses_casedwordid_fkey" FOREIGN KEY ("casedwordid") REFERENCES "casedwords"("casedwordid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "senses" ADD CONSTRAINT "senses_synsetid_fkey" FOREIGN KEY ("synsetid") REFERENCES "synsets"("synsetid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "senses" ADD CONSTRAINT "senses_wordid_fkey" FOREIGN KEY ("wordid") REFERENCES "words"("wordid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "synsets" ADD CONSTRAINT "synsets_lexdomainid_fkey" FOREIGN KEY ("lexdomainid") REFERENCES "lexdomains"("lexdomainid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "fk_user_preferences_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vframemaps" ADD CONSTRAINT "vframemaps_frameid_fkey" FOREIGN KEY ("frameid") REFERENCES "vframes"("frameid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vframemaps" ADD CONSTRAINT "vframemaps_synsetid_fkey" FOREIGN KEY ("synsetid") REFERENCES "synsets"("synsetid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vframemaps" ADD CONSTRAINT "vframemaps_wordid_fkey" FOREIGN KEY ("wordid") REFERENCES "words"("wordid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vframesentencemaps" ADD CONSTRAINT "vframesentencemaps_sentenceid_fkey" FOREIGN KEY ("sentenceid") REFERENCES "vframesentences"("sentenceid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vframesentencemaps" ADD CONSTRAINT "vframesentencemaps_synsetid_fkey" FOREIGN KEY ("synsetid") REFERENCES "synsets"("synsetid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vframesentencemaps" ADD CONSTRAINT "vframesentencemaps_wordid_fkey" FOREIGN KEY ("wordid") REFERENCES "words"("wordid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordigo_difficulty" ADD CONSTRAINT "wordigo_difficulty_senseid_fkey" FOREIGN KEY ("senseid") REFERENCES "senses"("senseid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordigo_difficulty_calculated" ADD CONSTRAINT "wordigo_difficulty_calculated_senseid_fkey" FOREIGN KEY ("senseid") REFERENCES "senses"("senseid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordigo_games" ADD CONSTRAINT "wordigo_games_user_ID_fkey" FOREIGN KEY ("user_ID") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordigo_history" ADD CONSTRAINT "wordigo_history_senseid_false_fkey" FOREIGN KEY ("senseid_false") REFERENCES "senses"("senseid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordigo_history" ADD CONSTRAINT "wordigo_history_senseid_fkey" FOREIGN KEY ("senseid") REFERENCES "senses"("senseid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordigo_history" ADD CONSTRAINT "wordigo_history_senseid_selected_fkey" FOREIGN KEY ("senseid_selected") REFERENCES "senses"("senseid") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wordigo_history" ADD CONSTRAINT "wordigo_history_user_ID_fkey" FOREIGN KEY ("user_ID") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

