-- ============================================================
-- 031_enhanced_seed_question_bank.sql
-- HAYAH QUESTION BANK — COMPREHENSIVE ENHANCED SEED
-- ============================================================
-- Sources: Gottman Sound Relationship House (love maps, fondness,
-- turning toward, shared meaning), Emotionally Focused Therapy
-- (Sue Johnson attachment patterns), Islamic pre-marriage
-- counseling (Imam Magid 100 Questions, Suhbah Institute 260,
-- Muslima Coaching prospective spouse framework), Esther Perel
-- (desire + mystery), PREPARE/ENRICH inventory domains.
--
-- This migration replaces all system questions and dares.
-- Idempotent: safe to re-run.
-- ~320 questions + 40 dares across the 12-category system.
-- ============================================================

-- Clean slate
DELETE FROM game_dares WHERE is_system = true;
DELETE FROM question_bank WHERE is_system = true;


-- ============================================================
-- SECTION 1: DEEP DIVE QUESTIONS (غوص)
-- Open-ended. For sitting across from each other and going deep.
-- ============================================================

-- ————————————————————————————————
-- FAITH (الإيمان والقيم)
-- Islamic spiritual alignment — the foundation
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
-- Light
('What is one Islamic value you want to be the cornerstone of our home?', 'faith', 'light', 'open', '{deep_dive,date_night}', true),
('How do you want us to spend Ramadan together?', 'faith', 'light', 'open', '{deep_dive,date_night}', true),
('What is your earliest memory of feeling connected to Allah?', 'faith', 'light', 'open', '{deep_dive}', true),
('Which surah or ayah brings you the most peace when you are anxious?', 'faith', 'light', 'open', '{deep_dive,date_night}', true),
('How important is it to you that we attend Friday prayer together?', 'faith', 'light', 'open', '{deep_dive}', true),
('What does your ideal Friday (Jumu''ah) look like as a family?', 'faith', 'light', 'open', '{deep_dive,date_night}', true),
-- Medium
('How do you envision our daily spiritual practice together after marriage?', 'faith', 'medium', 'open', '{deep_dive}', true),
('What does tawakkul look like in your daily life, practically?', 'faith', 'medium', 'open', '{deep_dive}', true),
('How do you want us to teach our children about Allah — through rules or through love?', 'faith', 'medium', 'open', '{deep_dive}', true),
('What role should an imam or Islamic scholar play in our marriage when we disagree?', 'faith', 'medium', 'open', '{deep_dive}', true),
('How do you reconcile cultural traditions from your family with Islamic teachings when they conflict?', 'faith', 'medium', 'open', '{deep_dive}', true),
('What does a good Muslim household look and feel like to you — describe a random evening.', 'faith', 'medium', 'open', '{deep_dive}', true),
('How do you approach the balance between deen and dunya in your career and ambitions?', 'faith', 'medium', 'open', '{deep_dive}', true),
-- Deep
('How would you handle it if our levels of religious practice diverged significantly over time?', 'faith', 'deep', 'open', '{deep_dive}', true),
('What does sabr truly look like in a marriage — and where does sabr end and enabling begin?', 'faith', 'deep', 'open', '{deep_dive}', true),
('Is there an aspect of Islamic practice that you struggle with privately?', 'faith', 'deep', 'open', '{deep_dive}', true),
('How has your relationship with Allah changed in the last five years, and where is it going?', 'faith', 'deep', 'open', '{deep_dive}', true),
('What would you do if our child questioned Islam or chose a different path?', 'faith', 'deep', 'open', '{deep_dive}', true),
('What does shukr mean to you on a day when everything is going wrong?', 'faith', 'deep', 'open', '{deep_dive}', true),
('What Islamic values are non-negotiable for you in our home?', 'faith', 'deep', 'open', '{deep_dive}', true),
('How should we handle differences in religious practice between us?', 'faith', 'deep', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- FINANCES (المال)
-- Gottman 19 Areas: Finances. PREPARE/ENRICH: Financial Management
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('Are you a saver or a spender — and how does that make you feel?', 'finances', 'light', 'open', '{deep_dive,date_night}', true),
('What was the financial culture in your family growing up?', 'finances', 'light', 'open', '{deep_dive}', true),
('What does financial security mean to you — a number, a lifestyle, or a feeling?', 'finances', 'medium', 'open', '{deep_dive}', true),
('How should we split expenses after marriage — joint account, separate, or a hybrid?', 'finances', 'medium', 'open', '{deep_dive}', true),
('What purchase amount should require a conversation before buying?', 'finances', 'medium', 'open', '{deep_dive,check_in}', true),
('What is your stance on halal income — where do you draw the line on permissible work?', 'finances', 'medium', 'open', '{deep_dive}', true),
('How do you feel about financial obligations to extended family — supporting parents, siblings?', 'finances', 'medium', 'open', '{deep_dive}', true),
('What financial goal do you want us to reach in our first year of marriage?', 'finances', 'medium', 'open', '{deep_dive}', true),
('How transparent should we be about individual spending — full visibility or personal allowances?', 'finances', 'medium', 'open', '{deep_dive}', true),
('What are your thoughts on saving vs. enjoying money now?', 'finances', 'medium', 'open', '{deep_dive}', true),
('How do you feel about debt — do you have any, and what is your plan for it?', 'finances', 'deep', 'open', '{deep_dive}', true),
('What would you do if one of us lost our income for an extended period?', 'finances', 'deep', 'open', '{deep_dive}', true),
('How do you feel about mahr — what it represents to you beyond the number?', 'finances', 'deep', 'open', '{deep_dive}', true),
('If we were on a tight budget and your family member asked for a significant loan, what would you do?', 'finances', 'deep', 'open', '{deep_dive}', true),
('What is your honest relationship with money right now — fears, habits, blind spots?', 'finances', 'deep', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- FAMILY (الأسرة والمستقبل)
-- Gottman Shared Meaning: Rituals, Roles, Goals, Symbols
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('Where do you see us living in five years?', 'family', 'light', 'open', '{deep_dive,date_night}', true),
('What traditions from your family do you want to bring into ours?', 'family', 'light', 'open', '{deep_dive,date_night}', true),
('What does ''home'' feel like to you?', 'family', 'light', 'open', '{deep_dive,date_night}', true),
('How many children do you want, and when do you want to start?', 'family', 'medium', 'open', '{deep_dive}', true),
('How involved do you want our parents to be in our daily married life?', 'family', 'medium', 'open', '{deep_dive}', true),
('Do you envision us living near family, or would you consider moving abroad?', 'family', 'medium', 'open', '{deep_dive}', true),
('How do you want to handle Eid, holidays, and family gatherings — whose family, how often?', 'family', 'medium', 'open', '{deep_dive}', true),
('What is your approach to raising children — gentle parenting, structured, or something else?', 'family', 'medium', 'open', '{deep_dive}', true),
('How do you feel about hiring help — babysitters, housekeepers — in our home?', 'family', 'medium', 'open', '{deep_dive}', true),
('How should we handle visits and boundaries with in-laws?', 'family', 'deep', 'open', '{deep_dive}', true),
('How would you handle a disagreement between me and your mother?', 'family', 'deep', 'open', '{deep_dive}', true),
('What is a non-negotiable boundary with in-laws for you?', 'family', 'deep', 'open', '{deep_dive}', true),
('If one of our parents needed to live with us due to illness, how would we handle that?', 'family', 'deep', 'open', '{deep_dive}', true),
('What does home mean to you — a place, a feeling, a person, or something else entirely?', 'family', 'deep', 'open', '{deep_dive}', true),
('How would you feel if we could not have children?', 'family', 'deep', 'open', '{deep_dive}', true),
('What kind of old couple do you want us to become?', 'family', 'deep', 'open', '{deep_dive,date_night}', true),
('How do you want to handle disagreements about parenting?', 'family', 'deep', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- INTIMACY (الحميمية والحدود)
-- EFT attachment: safe haven + secure base
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How do you prefer to receive affection — words, touch, acts of service, quality time, or gifts?', 'intimacy', 'light', 'open', '{deep_dive,date_night}', true),
('When you are stressed, do you want space or closeness?', 'intimacy', 'light', 'open', '{deep_dive,check_in}', true),
('How do you like to receive comfort when you''re upset?', 'intimacy', 'light', 'open', '{deep_dive}', true),
('What makes you feel most cherished?', 'intimacy', 'light', 'open', '{deep_dive,date_night}', true),
('What does emotional intimacy look like to you?', 'intimacy', 'medium', 'open', '{deep_dive}', true),
('What makes you feel most loved and desired?', 'intimacy', 'medium', 'open', '{deep_dive}', true),
('What is a boundary you need me to always respect, no matter what?', 'intimacy', 'medium', 'open', '{deep_dive}', true),
('How do you feel about public displays of affection — in front of family, friends, strangers?', 'intimacy', 'medium', 'open', '{deep_dive}', true),
('What physical boundaries are important to you before marriage?', 'intimacy', 'deep', 'open', '{deep_dive}', true),
('What does emotional safety in a relationship mean to you — describe it concretely?', 'intimacy', 'deep', 'open', '{deep_dive}', true),
('Is there something you are uncomfortable discussing that you know we need to talk about?', 'intimacy', 'deep', 'open', '{deep_dive}', true),
('How do you want us to navigate physical intimacy expectations after marriage?', 'intimacy', 'deep', 'open', '{deep_dive}', true),
('What is something about intimacy that you learned from your upbringing that you want to keep or change?', 'intimacy', 'deep', 'open', '{deep_dive}', true),
('When you feel emotionally distant from me, what is the first thing you need?', 'intimacy', 'deep', 'open', '{deep_dive}', true),
('How do you envision our intimate life after marriage?', 'intimacy', 'deep', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- COMMUNICATION (التواصل)
-- Gottman: Four Horsemen, Repair Attempts, Harsh Startup
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('What is one thing I could say to you more often?', 'communication', 'light', 'open', '{deep_dive,date_night}', true),
('Do you process things by talking them out or thinking alone first?', 'communication', 'light', 'open', '{deep_dive}', true),
('What''s your love language and how do you want me to speak it?', 'communication', 'light', 'open', '{deep_dive}', true),
('How do you want me to bring up something that is bothering me — directly, gently, in writing?', 'communication', 'medium', 'open', '{deep_dive}', true),
('What does a healthy argument look like to you — and what does an unhealthy one look like?', 'communication', 'medium', 'open', '{deep_dive}', true),
('How do you want us to repair after a fight — who reaches out first, how, when?', 'communication', 'medium', 'open', '{deep_dive}', true),
('How do you handle things when you''re angry?', 'communication', 'medium', 'open', '{deep_dive}', true),
('How do you prefer to resolve conflicts — in the moment or after cooling down?', 'communication', 'medium', 'open', '{deep_dive}', true),
('When you shut down in a conversation, what is actually happening inside you?', 'communication', 'deep', 'open', '{deep_dive}', true),
('What is something I do that unintentionally hurts you that you have not told me?', 'communication', 'deep', 'open', '{deep_dive}', true),
('When was the last time you felt truly heard by me — describe the moment?', 'communication', 'deep', 'open', '{deep_dive}', true),
('Do you feel safe being completely honest with me, even when the truth might hurt?', 'communication', 'deep', 'open', '{deep_dive}', true),
('What is the hardest thing for you to say out loud in any relationship?', 'communication', 'deep', 'open', '{deep_dive}', true),
('If I criticized you during an argument, how would you want me to say it differently?', 'communication', 'deep', 'open', '{deep_dive}', true),
('What topic do you think we avoid talking about?', 'communication', 'deep', 'open', '{deep_dive,check_in}', true),
('What''s something you wish people understood about you?', 'communication', 'deep', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- CONFLICT (حل الخلافات)
-- Gottman: Perpetual Problems, Gridlock, Compromise
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('When we disagree, do you need to resolve it immediately or sleep on it?', 'conflict', 'light', 'open', '{deep_dive}', true),
('What is a fight style you saw in your parents that you never want to repeat?', 'conflict', 'medium', 'open', '{deep_dive}', true),
('When you are angry, what do you need from me — silence, a hug, space, words?', 'conflict', 'medium', 'open', '{deep_dive}', true),
('How do you feel about involving a third party — imam, counselor, family — in our disputes?', 'conflict', 'medium', 'open', '{deep_dive}', true),
('Do you believe couples should never go to bed angry, or is it sometimes wiser to pause?', 'conflict', 'medium', 'open', '{deep_dive}', true),
('What is a dealbreaker for you — something that would make you consider ending the relationship?', 'conflict', 'deep', 'open', '{deep_dive}', true),
('How do you distinguish between a problem we can solve and a difference we need to accept?', 'conflict', 'deep', 'open', '{deep_dive}', true),
('What is the most unfair thing someone has said to you in a fight, and how did it affect you?', 'conflict', 'deep', 'open', '{deep_dive}', true),
('What does forgiveness actually look like to you — is it a decision, a process, or a feeling?', 'conflict', 'deep', 'open', '{deep_dive}', true),
('What would you do if you realized you were wrong but felt too proud to admit it?', 'conflict', 'deep', 'open', '{deep_dive}', true),
('What does forgiveness mean to you — and is there something you need to forgive right now?', 'conflict', 'deep', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- LIFESTYLE (أسلوب الحياة)
-- Gottman 19 Areas: Housework, Recreation, Environment
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('Describe your ideal ordinary Tuesday evening together after marriage.', 'lifestyle', 'light', 'open', '{deep_dive,date_night}', true),
('How clean does the house need to be for you to feel at peace?', 'lifestyle', 'light', 'open', '{deep_dive}', true),
('What does your ideal weekend look like?', 'lifestyle', 'light', 'open', '{deep_dive,date_night}', true),
('How do you feel about having pets?', 'lifestyle', 'light', 'open', '{deep_dive,date_night}', true),
('What is a small daily habit that would make you feel cared for?', 'lifestyle', 'light', 'open', '{deep_dive,date_night}', true),
('How much alone time do you need in a week to feel like yourself?', 'lifestyle', 'medium', 'open', '{deep_dive}', true),
('How do you feel about household chores — who does what, and how do we decide?', 'lifestyle', 'medium', 'open', '{deep_dive}', true),
('What is your stance on screen time and phones during our quality time together?', 'lifestyle', 'medium', 'open', '{deep_dive}', true),
('What type of social life do you want — frequent gatherings, small circles, or mostly just us?', 'lifestyle', 'medium', 'open', '{deep_dive}', true),
('How do you feel about travel — how often, what kind, how much should we budget for it?', 'lifestyle', 'medium', 'open', '{deep_dive}', true),
('If we both worked full-time, would you expect one of us to always cook?', 'lifestyle', 'medium', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- DREAMS (الأحلام والأهداف)
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('What skill or knowledge do you want to pursue in the next year?', 'dreams', 'light', 'open', '{deep_dive,date_night}', true),
('What is one thing on your bucket list you want us to do together?', 'dreams', 'light', 'open', '{deep_dive,date_night}', true),
('What do you want to be known for when you are old?', 'dreams', 'medium', 'open', '{deep_dive,date_night}', true),
('If money were irrelevant, what would your life look like?', 'dreams', 'medium', 'open', '{deep_dive,date_night}', true),
('Is there a career path you gave up on that still calls to you?', 'dreams', 'medium', 'open', '{deep_dive}', true),
('Where do you see us living in 10 years?', 'dreams', 'medium', 'open', '{deep_dive}', true),
('What career accomplishment would make you feel fulfilled?', 'dreams', 'medium', 'open', '{deep_dive}', true),
('What is your biggest life goal outside of marriage?', 'dreams', 'medium', 'open', '{deep_dive}', true),
('How do you want to grow as a person in the next five years, independent of us?', 'dreams', 'medium', 'open', '{deep_dive}', true),
('What is a dream you have never said out loud to anyone?', 'dreams', 'deep', 'open', '{deep_dive}', true),
('What does success look like to you — truly, not what society or family expects?', 'dreams', 'deep', 'open', '{deep_dive}', true),
('How do you balance ambition with contentment — is it possible to want more and be grateful?', 'dreams', 'deep', 'open', '{deep_dive}', true),
('What legacy do you want to leave — for your children, your community, the ummah?', 'dreams', 'deep', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- VULNERABILITY (الشجاعة في الضعف)
-- EFT: accessing underlying emotions, attachment injuries
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
-- Past experiences mapped here
('How would you describe your childhood in three words?', 'vulnerability', 'light', 'open', '{deep_dive,date_night}', true),
('What was the emotional climate of your home growing up?', 'vulnerability', 'medium', 'open', '{deep_dive}', true),
('How did your parents show love to each other — and how did that shape what you expect from us?', 'vulnerability', 'medium', 'open', '{deep_dive}', true),
('What did your parents get right about marriage, and what do you want to do differently?', 'vulnerability', 'medium', 'open', '{deep_dive}', true),
('What was your relationship with religion like as a child versus now?', 'vulnerability', 'medium', 'open', '{deep_dive}', true),
-- Core vulnerability
('What is your biggest fear about us?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What is something from your past that still shapes how you show up in relationships?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('When was the last time you cried, and what triggered it?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What are you most insecure about that I might not know?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What do you need from me that you have been afraid to ask for?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('When do you feel most alone, even when you are surrounded by people?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What is the most painful thing someone you loved has said to you?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('Do you carry any unresolved pain from a past relationship or friendship?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What part of yourself are you still trying to understand?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What would you want me to know about you if you knew I would never judge you for it?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What is the hardest thing you have ever gone through, and what did it teach you?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('Is there something from your upbringing you are actively trying to unlearn?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('Have you experienced loss that changed how you see life?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What is something you struggle with that you rarely share with others?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What makes you feel insecure in a relationship?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What past hurt do you not want repeated in our relationship?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
-- Deep existential (formerly "deep_dive" category)
('What are you most proud of about yourself that has nothing to do with achievements?', 'vulnerability', 'medium', 'open', '{deep_dive}', true),
('If you could change one thing about how you were raised, what would it be?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What is the loneliest you have ever felt, and what would have helped?', 'vulnerability', 'deep', 'open', '{deep_dive}', true),
('What is a truth about yourself that you resist accepting?', 'vulnerability', 'deep', 'open', '{deep_dive}', true);

-- ————————————————————————————————
-- LOVE (الحب) — Gratitude / Fondness / Admiration
-- Gottman: Fondness and Admiration System
-- ————————————————————————————————
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('What is your favorite memory of us so far?', 'love', 'light', 'open', '{deep_dive,date_night}', true),
('What quality in me are you most grateful for?', 'love', 'light', 'open', '{deep_dive,date_night}', true),
('Name three small things I do that make your day better.', 'love', 'light', 'open', '{deep_dive,date_night}', true),
('What is something I did recently that meant more to you than I realized?', 'love', 'light', 'open', '{deep_dive,date_night}', true),
('What is something I do that makes you feel proud to be with me?', 'love', 'light', 'open', '{deep_dive,date_night}', true),
('What song reminds you of us?', 'love', 'light', 'open', '{date_night}', true),
('What moment made you realize you wanted to be with me?', 'love', 'medium', 'open', '{deep_dive,date_night}', true),
('What do you admire about me that you have never told me?', 'love', 'medium', 'open', '{deep_dive,date_night}', true),
('What''s something about me that surprised you?', 'love', 'medium', 'open', '{date_night}', true),
('How has being with me changed you — for better and for worse?', 'love', 'deep', 'open', '{deep_dive}', true),
-- Existential love (formerly "deep_dive" category)
('What would you do if I fundamentally changed as a person over the next decade?', 'love', 'deep', 'open', '{deep_dive}', true),
('What do you think is the purpose of marriage beyond companionship?', 'love', 'deep', 'open', '{deep_dive}', true),
('What does it mean to you to truly know another person?', 'intimacy', 'deep', 'open', '{deep_dive}', true),
('What does forever look like to you?', 'love', 'deep', 'open', '{date_night}', true),
('What''s the hardest sacrifice you''d make for our relationship?', 'love', 'deep', 'open', '{date_night}', true);


-- ============================================================
-- SECTION 2: CHECK-IN QUESTIONS (الميزان)
-- Scale 1-10, Yes/No, Multiple Choice — for alignment scoring
-- Both answer independently, then reveal side by side
-- ============================================================

-- COMMUNICATION SCALES
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How well do you feel heard when you share something important?', 'communication', 'light', 'scale_1_10', '{check_in,deep_dive}', true),
('How comfortable are you bringing up difficult topics with me?', 'communication', 'medium', 'scale_1_10', '{check_in}', true),
('How satisfied are you with how we resolve disagreements?', 'communication', 'medium', 'scale_1_10', '{check_in}', true),
('How well do we communicate our daily needs to each other?', 'communication', 'light', 'scale_1_10', '{check_in}', true),
('How emotionally safe do you feel expressing your true feelings?', 'communication', 'deep', 'scale_1_10', '{check_in,deep_dive}', true),
('How satisfied are you with how we communicate when we disagree?', 'communication', 'medium', 'scale_1_10', '{check_in}', true),
('How often do you hold back something you want to say to me?', 'communication', 'deep', 'scale_1_10', '{check_in}', true);

-- INTIMACY SCALES
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How connected do you feel to me right now?', 'intimacy', 'light', 'scale_1_10', '{check_in}', true),
('How satisfied are you with the quality time we spend together?', 'intimacy', 'light', 'scale_1_10', '{check_in}', true),
('How well do I show you love in the way you need it?', 'intimacy', 'medium', 'scale_1_10', '{check_in}', true),
('How comfortable are you being vulnerable with me?', 'intimacy', 'deep', 'scale_1_10', '{check_in,deep_dive}', true),
('How aligned do you feel our physical boundaries are?', 'intimacy', 'deep', 'scale_1_10', '{check_in}', true),
('How emotionally connected do you feel to me right now?', 'intimacy', 'medium', 'scale_1_10', '{check_in}', true),
('How satisfied are you with the quality of our time together?', 'intimacy', 'medium', 'scale_1_10', '{check_in}', true),
('How safe do you feel being vulnerable with me?', 'intimacy', 'deep', 'scale_1_10', '{check_in}', true),
('How well do I understand what you need emotionally?', 'intimacy', 'medium', 'scale_1_10', '{check_in}', true);

-- FINANCES SCALES
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How aligned are we on our financial priorities?', 'finances', 'medium', 'scale_1_10', '{check_in}', true),
('How comfortable are you discussing money with me?', 'finances', 'light', 'scale_1_10', '{check_in}', true),
('How well do we plan for our financial future together?', 'finances', 'medium', 'scale_1_10', '{check_in}', true),
('How satisfied are you with our spending habits as a couple?', 'finances', 'medium', 'scale_1_10', '{check_in}', true),
('How aligned do you feel on how we handle money?', 'finances', 'medium', 'scale_1_10', '{check_in}', true),
('How confident are you in our financial plan together?', 'finances', 'medium', 'scale_1_10', '{check_in}', true);

-- FAITH SCALES
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How aligned are we in our spiritual practice together?', 'faith', 'medium', 'scale_1_10', '{check_in}', true),
('How well do we support each other''s relationship with Allah?', 'faith', 'deep', 'scale_1_10', '{check_in}', true),
('How satisfied are you with how we integrate faith into daily life?', 'faith', 'medium', 'scale_1_10', '{check_in}', true),
('How comfortable are you discussing spiritual struggles with me?', 'faith', 'deep', 'scale_1_10', '{check_in,deep_dive}', true),
('How satisfied are you with our spiritual life together?', 'faith', 'medium', 'scale_1_10', '{check_in}', true),
('How aligned do you feel on our religious priorities?', 'faith', 'medium', 'scale_1_10', '{check_in}', true),
('How supported do you feel in your personal spiritual growth?', 'faith', 'medium', 'scale_1_10', '{check_in}', true);

-- FAMILY SCALES
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How aligned are we on how we''ll raise our children?', 'family', 'medium', 'scale_1_10', '{check_in}', true),
('How well do we navigate each other''s family dynamics?', 'family', 'medium', 'scale_1_10', '{check_in}', true),
('How comfortable are you with the role my family plays in our life?', 'family', 'deep', 'scale_1_10', '{check_in}', true),
('How happy are you with the boundaries we have with our families?', 'family', 'medium', 'scale_1_10', '{check_in}', true),
('How aligned are we on our vision for the future?', 'family', 'medium', 'scale_1_10', '{check_in}', true),
('How well do we handle decisions about family involvement together?', 'family', 'medium', 'scale_1_10', '{check_in}', true);

-- LIFESTYLE SCALES
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How satisfied are you with our work-life balance as a couple?', 'lifestyle', 'light', 'scale_1_10', '{check_in}', true),
('How aligned are our daily routines and habits?', 'lifestyle', 'light', 'scale_1_10', '{check_in}', true),
('How well do we balance personal space and togetherness?', 'lifestyle', 'medium', 'scale_1_10', '{check_in}', true),
('How happy are you with the balance of quality time vs personal space?', 'lifestyle', 'medium', 'scale_1_10', '{check_in}', true),
('How fairly do you feel household responsibilities are shared?', 'lifestyle', 'medium', 'scale_1_10', '{check_in}', true),
('How satisfied are you with our social life as a couple?', 'lifestyle', 'light', 'scale_1_10', '{check_in}', true);

-- CONFLICT SCALES
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How quickly do we recover after a disagreement?', 'conflict', 'medium', 'scale_1_10', '{check_in}', true),
('How safe do you feel during arguments?', 'conflict', 'deep', 'scale_1_10', '{check_in}', true),
('How confident are you that we handle disagreements well?', 'conflict', 'medium', 'scale_1_10', '{check_in}', true),
('How quickly do we usually repair after a misunderstanding?', 'conflict', 'medium', 'scale_1_10', '{check_in}', true),
('How respected do you feel when we argue?', 'conflict', 'deep', 'scale_1_10', '{check_in}', true);

-- DREAMS SCALES
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How supported do you feel in pursuing your personal goals?', 'dreams', 'medium', 'scale_1_10', '{check_in}', true),
('How aligned is our vision for where we''ll be in 5 years?', 'dreams', 'deep', 'scale_1_10', '{check_in,deep_dive}', true),
('How excited are you about our shared future?', 'dreams', 'light', 'scale_1_10', '{check_in}', true);

-- LOVE SCALES (gratitude/fondness)
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('How appreciated do you feel by me day to day?', 'love', 'light', 'scale_1_10', '{check_in}', true),
('How often do I make you feel special?', 'love', 'light', 'scale_1_10', '{check_in}', true),
('Overall, how satisfied are you with our relationship right now?', 'love', 'medium', 'scale_1_10', '{check_in}', true),
('How optimistic are you about our future together?', 'love', 'medium', 'scale_1_10', '{check_in}', true),
('If you could rate this month for us on a scale of 1 to 10, what would it be?', 'love', 'light', 'scale_1_10', '{check_in}', true);

-- CHECK-IN OPEN FOLLOW-UPS (asked after scale questions)
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('What''s one thing I did this week that made you feel loved?', 'communication', 'light', 'open', '{check_in,date_night}', true),
('What is one area where you''d like us to grow this month?', 'communication', 'medium', 'open', '{check_in}', true),
('Is there anything you''ve been wanting to tell me but haven''t?', 'vulnerability', 'deep', 'open', '{check_in,deep_dive}', true),
('What''s one way I could better support you right now?', 'communication', 'light', 'open', '{check_in}', true),
('What made you smile about us this week?', 'love', 'light', 'open', '{check_in,date_night}', true),
('What is one thing I could have done better this month?', 'communication', 'medium', 'open', '{check_in}', true),
('What was the highlight of our month together?', 'love', 'light', 'open', '{check_in}', true),
('Is there anything unresolved between us that we should address tonight?', 'conflict', 'deep', 'open', '{check_in}', true),
('What do you need more of from me right now?', 'communication', 'medium', 'open', '{check_in}', true),
('What are you looking forward to in the next month?', 'dreams', 'light', 'open', '{check_in}', true),
('How is your mental health, honestly?', 'vulnerability', 'deep', 'open', '{check_in}', true),
('Is there a conversation we have been avoiding?', 'communication', 'deep', 'open', '{check_in}', true),
('What was a moment this month where you felt really loved?', 'love', 'light', 'open', '{check_in}', true),
('What is one small change that would make our daily life better?', 'lifestyle', 'medium', 'open', '{check_in}', true);


-- ============================================================
-- SECTION 3: DATE NIGHT QUESTIONS (لعبة)
-- Light, fun, conversational — for game energy
-- ============================================================

INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
-- Fun hypothetical → love
('If our love story was a movie, what genre would it be?', 'love', 'light', 'open', '{date_night}', true),
('If we swapped lives for a day, what is the first thing you would do as me?', 'love', 'light', 'open', '{date_night}', true),
('What song would be our official theme song?', 'love', 'light', 'open', '{date_night}', true),
('What is the weirdest thing you find attractive about me?', 'intimacy', 'light', 'open', '{date_night}', true),
('What is one thing you thought was weird about me at first but now love?', 'love', 'light', 'open', '{date_night}', true),
('Describe me in three emojis.', 'love', 'light', 'open', '{date_night}', true),
('What would you want our couple superpower to be?', 'love', 'light', 'open', '{date_night}', true),
('What would our couple name be if we were a brand?', 'love', 'light', 'open', '{date_night}', true),
('How would your best friend describe our relationship?', 'love', 'light', 'open', '{date_night}', true),
('What is something I do that instantly makes you smile?', 'love', 'light', 'open', '{date_night}', true),
('What do I do that makes you fall for me all over again?', 'intimacy', 'medium', 'open', '{date_night}', true),
('What was the exact moment you realized you had feelings for me?', 'love', 'medium', 'open', '{date_night}', true),

-- Fun hypothetical → dreams
('If you could relive one day of your life, which would it be?', 'dreams', 'light', 'open', '{date_night}', true),
('What would you do if you won 10 million dollars tomorrow?', 'dreams', 'light', 'open', '{date_night}', true),
('If you could have dinner with anyone dead or alive, who and why?', 'dreams', 'light', 'open', '{date_night}', true),
('What is a skill you wish you had that would surprise people?', 'dreams', 'light', 'open', '{date_night}', true),
('If you could master any instrument overnight, which one?', 'dreams', 'light', 'open', '{date_night}', true),
('What is one adventure you want us to have this year?', 'dreams', 'light', 'open', '{date_night}', true),
('What''s something silly you want to do with me someday?', 'dreams', 'light', 'open', '{date_night}', true),

-- Fun hypothetical → lifestyle
('What is your most unpopular opinion?', 'lifestyle', 'light', 'open', '{date_night}', true),
('What is one food you could eat every day for the rest of your life?', 'lifestyle', 'light', 'open', '{date_night}', true),
('If we had no responsibilities for a full week, what would we do?', 'lifestyle', 'light', 'open', '{date_night}', true),
('If you could live in any era of history, which one and where?', 'lifestyle', 'light', 'open', '{date_night}', true),
('What is one conspiracy theory you half believe?', 'lifestyle', 'light', 'open', '{date_night}', true),
('What''s the most adventurous thing you''d want us to try together?', 'lifestyle', 'light', 'open', '{date_night}', true),
('If we had a reality TV show, what would it be called?', 'lifestyle', 'light', 'open', '{date_night}', true),
('Describe your perfect lazy Sunday with me.', 'lifestyle', 'light', 'open', '{date_night}', true),
('What''s one secret talent of yours I haven''t discovered yet?', 'lifestyle', 'medium', 'open', '{date_night}', true),
('If you could cook me one meal for the rest of my life, what would it be?', 'home', 'light', 'open', '{date_night}', true),

-- Fun hypothetical → vulnerability
('What is the most embarrassing thing that has ever happened to you?', 'vulnerability', 'light', 'open', '{date_night}', true),
('What is the bravest thing you have ever done?', 'vulnerability', 'light', 'open', '{date_night}', true),
('What scares you most about marrying me?', 'vulnerability', 'medium', 'open', '{date_night,deep_dive}', true),
('What is one thing about yourself that you want me to understand better?', 'vulnerability', 'medium', 'open', '{date_night}', true),
('What do you need from me that you''ve been afraid to ask?', 'vulnerability', 'deep', 'open', '{date_night,deep_dive}', true),

-- Fun hypothetical → travel
('If we could teleport anywhere right now for one hour, where?', 'travel', 'light', 'open', '{date_night}', true),
('If you could teleport anywhere right now, where would you take me?', 'travel', 'light', 'open', '{date_night}', true),

-- Fun hypothetical → communication
('What''s the funniest thing I''ve ever said to you?', 'communication', 'light', 'open', '{date_night}', true),
('If you could change one thing about how we communicate, what would it be?', 'communication', 'medium', 'open', '{date_night}', true),

-- Fun hypothetical → intimacy
('What is the most romantic thing you have ever imagined doing for me?', 'intimacy', 'light', 'open', '{date_night}', true),

-- Date night rating → love
('Rate our last date night out of 10 and explain why.', 'love', 'light', 'open', '{date_night}', true);


-- ============================================================
-- SECTION 4: YES/NO & MULTIPLE CHOICE QUESTIONS
-- ============================================================

-- Yes/No
INSERT INTO question_bank (text, category, difficulty, answer_type, suitable_modes, is_system) VALUES
('Do you feel we spend enough quality time together?', 'lifestyle', 'light', 'yes_no', '{check_in}', true),
('Do you feel comfortable with how much time I spend with friends or alone?', 'lifestyle', 'medium', 'yes_no', '{check_in}', true),
('Is there something you wish I would apologize for?', 'communication', 'deep', 'yes_no', '{check_in}', true),
('Do you feel we are growing closer or drifting apart?', 'love', 'deep', 'yes_no', '{check_in}', true),
('Should we have a joint bank account after marriage?', 'finances', 'medium', 'yes_no', '{check_in,date_night}', true),
('Do you want to live near your parents after marriage?', 'family', 'medium', 'yes_no', '{check_in}', true),
('Should screen time be limited during our quality time?', 'lifestyle', 'light', 'yes_no', '{check_in,date_night}', true),
('Do you believe in couples therapy even when things are good?', 'communication', 'medium', 'yes_no', '{check_in}', true),
('Should we pray together every day?', 'faith', 'medium', 'yes_no', '{check_in}', true);

-- Multiple choice
INSERT INTO question_bank (text, category, difficulty, answer_type, answer_options, suitable_modes, is_system) VALUES
('How many date nights per month feels right for you?', 'lifestyle', 'light', 'multiple_choice', '["1","2","3","4+"]'::jsonb, '{check_in}', true),
('When we disagree, I usually want to: resolve it now / take a break / talk about it the next day / write about it first', 'conflict', 'medium', 'multiple_choice', '["Resolve it now","Take a break","Talk next day","Write about it first"]'::jsonb, '{check_in}', true),
('The area of our relationship that needs the most attention right now is:', 'communication', 'medium', 'multiple_choice', '["Communication","Quality time","Physical affection","Shared goals","Spirituality","Finances"]'::jsonb, '{check_in}', true),
('What''s your ideal vacation style?', 'travel', 'light', 'multiple_choice', '["Adventure & hiking","Beach & relaxation","City & culture","Road trip"]'::jsonb, '{date_night,check_in}', true),
('How do you prefer to spend a free evening?', 'lifestyle', 'light', 'multiple_choice', '["Going out to dinner","Movie night at home","Outdoor walk","Deep conversation"]'::jsonb, '{date_night}', true),
('What''s your conflict resolution style?', 'conflict', 'medium', 'multiple_choice', '["Talk it out immediately","Take space then discuss","Write a letter","Seek mediation"]'::jsonb, '{check_in,deep_dive}', true),
('How would you describe your love language?', 'intimacy', 'light', 'multiple_choice', '["Words of affirmation","Acts of service","Quality time","Physical touch","Gifts"]'::jsonb, '{check_in,date_night}', true),
('What''s most important in a home?', 'home', 'light', 'multiple_choice', '["Cozy & warm","Modern & clean","Spacious & open","Near family & community"]'::jsonb, '{date_night,check_in}', true);


-- ============================================================
-- SECTION 5: RANKING QUESTIONS
-- ============================================================

INSERT INTO question_bank (text, category, difficulty, answer_type, answer_options, suitable_modes, is_system) VALUES
('Rank these in order of importance for our marriage:', 'lifestyle', 'medium', 'ranking', '["Trust","Communication","Faith","Fun","Financial stability"]'::jsonb, '{check_in,deep_dive}', true),
('Rank how you''d spend a bonus $10,000:', 'finances', 'light', 'ranking', '["Save it","Travel together","Home improvement","Give to charity","Invest"]'::jsonb, '{date_night,check_in}', true);


-- ============================================================
-- SECTION 6: DARES (40 total across 3 heat levels)
-- ============================================================

-- Heat Level 1: MILD (sweet, easy, fun) — +15cc / -10cc
INSERT INTO game_dares (text, category, heat_level, coyyns_reward, coyyns_penalty, is_system) VALUES
('Give your partner a 2-minute hand massage right now.', 'intimacy', 1, 15, 10, true),
('Write a 3-line poem about your partner in 60 seconds. Read it dramatically.', 'love', 1, 15, 10, true),
('Do your best impression of your partner when they wake up in the morning.', 'lifestyle', 1, 15, 10, true),
('Hold eye contact for 60 seconds without laughing or speaking.', 'intimacy', 1, 15, 10, true),
('Show your partner your screen time report right now, unedited.', 'vulnerability', 1, 15, 10, true),
('Make your partner genuinely laugh in 30 seconds. If they do not laugh, you lose.', 'lifestyle', 1, 15, 10, true),
('Send your partner the last photo you took of them and explain why you took it.', 'love', 1, 15, 10, true),
('Describe your partner using only 5 words. Say them out loud.', 'love', 1, 15, 10, true),
('Call your partner by the most ridiculous pet name you can invent for the next 5 minutes.', 'love', 1, 15, 10, true),
('Show your partner the last 5 things you Googled.', 'vulnerability', 1, 15, 10, true),
('Do a dramatic reenactment of how you two first met.', 'love', 1, 15, 10, true),
('Sing the chorus of the last song you listened to. Full commitment.', 'lifestyle', 1, 15, 10, true),
('Let your partner look through your camera roll for 30 seconds.', 'vulnerability', 1, 15, 10, true),
('Give your partner a genuine 60-second compliment — no repeating words.', 'communication', 1, 15, 10, true),
('Sing a love song (badly) to your partner with full emotion.', 'love', 1, 15, 10, true),
('Write a haiku about your partner right now and read it out loud.', 'love', 1, 15, 10, true),
('Tell your partner 3 things you noticed about them this week.', 'communication', 1, 15, 10, true),
('Give your partner a 2-minute hand massage while telling them what you love about their hands.', 'intimacy', 1, 15, 10, true),
('Share a voice memo right now telling your partner why you chose them.', 'love', 1, 15, 10, true),
('Recreate the face you made when you first saw your partner. Hold it for 10 seconds.', 'love', 1, 15, 10, true),
('Let your partner pick a song and you have to dance to it — full commitment.', 'lifestyle', 1, 15, 10, true),
('Close your eyes and describe your partner''s face from memory in detail.', 'intimacy', 1, 15, 10, true);

-- Heat Level 2: MEDIUM (vulnerable, effort, meaningful) — +30cc / -20cc
INSERT INTO game_dares (text, category, heat_level, coyyns_reward, coyyns_penalty, is_system) VALUES
('Write a letter to your future self about this relationship and read it out loud.', 'love', 2, 30, 20, true),
('Describe falling in love with your partner without using the word love.', 'love', 2, 30, 20, true),
('Plan a surprise date for next week and describe every detail right now.', 'love', 2, 30, 20, true),
('Apologize sincerely for something small you have been meaning to say sorry for.', 'conflict', 2, 30, 20, true),
('Record a voice note telling your partner what you admire most about them. Save it.', 'love', 2, 30, 20, true),
('Teach your partner something you are good at in 3 minutes — a recipe step, a stretch, a skill.', 'lifestyle', 2, 30, 20, true),
('Tell your partner one thing you are actively working on improving because of them.', 'communication', 2, 30, 20, true),
('Prepare your partner their favorite drink or snack right now. Presentation matters.', 'love', 2, 30, 20, true),
('Describe the most beautiful version of your life together 10 years from now.', 'dreams', 2, 30, 20, true),
('Write down 3 things you want to tell your partner. Share at least one.', 'communication', 2, 30, 20, true),
('Give your partner a genuine compliment about something they are insecure about.', 'vulnerability', 2, 30, 20, true),
('Describe what your partner does that makes you feel most at home.', 'love', 2, 30, 20, true),
('Create a new tradition for us right now and commit to it.', 'lifestyle', 2, 30, 20, true),
('Call your partner''s parent and say one nice thing about their child.', 'family', 2, 30, 20, true),
('Reveal the last 3 things you searched on your phone — no deleting.', 'vulnerability', 2, 30, 20, true),
('Tell your partner your most embarrassing moment in full detail.', 'vulnerability', 2, 30, 20, true),
('Act out the moment you realized you were falling for your partner.', 'love', 2, 30, 20, true),
('Share a prayer you''ve made about your partner or future together.', 'faith', 2, 30, 20, true),
('Describe your ideal day with your partner from morning to night.', 'lifestyle', 2, 30, 20, true),
('Make a TikTok-style video declaring your love — no retakes allowed.', 'love', 2, 30, 20, true);

-- Heat Level 3: INTENSE (deeply vulnerable, high stakes) — +45cc / -30cc
INSERT INTO game_dares (text, category, heat_level, coyyns_reward, coyyns_penalty, is_system) VALUES
('Share something about yourself that you have never told anyone. Ever.', 'vulnerability', 3, 45, 30, true),
('Tell your partner what scares you most about marrying them. Be completely honest.', 'vulnerability', 3, 45, 30, true),
('Write a dua for your relationship right now, from the heart, and read it to your partner.', 'faith', 3, 45, 30, true),
('Identify one toxic trait you have and create a concrete plan to work on it. Share it.', 'vulnerability', 3, 45, 30, true),
('Call a family member right now and tell them one thing you appreciate about them.', 'family', 3, 45, 30, true),
('Record a 60-second voice note for your partner to listen to when they are having a terrible day. Save it.', 'love', 3, 45, 30, true),
('Commit to one specific behavior change for the next month. Write it down and sign it as a contract between you.', 'communication', 3, 45, 30, true),
('Describe the kind of elderly couple you want you both to become.', 'dreams', 3, 45, 30, true),
('Tell your partner the last time you felt disappointed in yourself and why.', 'vulnerability', 3, 45, 30, true),
('Look your partner in the eyes and say everything you would say if this was your last conversation.', 'love', 3, 45, 30, true),
('Describe the moment you decided this was the person you wanted to spend your life with.', 'love', 3, 45, 30, true),
('Tell your partner one thing about them that you struggle with but have chosen to accept and love anyway.', 'love', 3, 45, 30, true),
('Share your biggest regret and what it taught you about who you want to be.', 'vulnerability', 3, 45, 30, true),
('Write a short letter to your future child about why you chose their other parent.', 'family', 3, 45, 30, true),
('Share something you''ve never told anyone — your partner is the first to know.', 'vulnerability', 3, 45, 30, true),
('Apologize for something specific you''ve been meaning to address.', 'conflict', 3, 45, 30, true),
('Make a promise to your partner and explain why it matters to you.', 'love', 3, 45, 30, true),
('Share your biggest insecurity about our relationship honestly.', 'vulnerability', 3, 45, 30, true),
('Describe the moment you knew this person was different from everyone else.', 'love', 3, 45, 30, true),
('Tell your partner about a time they hurt you that you never mentioned.', 'conflict', 3, 45, 30, true),
('Share what you pray for when you pray for your partner.', 'faith', 3, 45, 30, true),
('Write a du''a for your partner right now and read it to them.', 'faith', 3, 45, 30, true),
('Describe the life you''re building together in vivid detail — 10 years from now.', 'dreams', 3, 45, 30, true),
('Share the moment you were most proud of your partner.', 'love', 3, 45, 30, true);


-- ============================================================
-- VALIDATION
-- ============================================================
DO $$
DECLARE
  q_count integer;
  d_count integer;
  dd_count integer;
  ci_count integer;
  dn_count integer;
  cat_breakdown text;
BEGIN
  SELECT count(*) INTO q_count FROM question_bank WHERE is_system = true;
  SELECT count(*) INTO d_count FROM game_dares WHERE is_system = true;
  SELECT count(*) INTO dd_count FROM question_bank WHERE is_system = true AND 'deep_dive' = ANY(suitable_modes);
  SELECT count(*) INTO ci_count FROM question_bank WHERE is_system = true AND 'check_in' = ANY(suitable_modes);
  SELECT count(*) INTO dn_count FROM question_bank WHERE is_system = true AND 'date_night' = ANY(suitable_modes);

  -- Category breakdown
  SELECT string_agg(cat || ': ' || cnt::text, ', ' ORDER BY cat)
  INTO cat_breakdown
  FROM (
    SELECT category AS cat, count(*) AS cnt
    FROM question_bank WHERE is_system = true
    GROUP BY category
  ) sub;

  RAISE NOTICE '=== HAYAH QUESTION BANK SEEDED (Enhanced) ===';
  RAISE NOTICE 'Total questions: %', q_count;
  RAISE NOTICE 'Total dares: %', d_count;
  RAISE NOTICE 'Deep Dive eligible: %', dd_count;
  RAISE NOTICE 'Check-In eligible: %', ci_count;
  RAISE NOTICE 'Date Night eligible: %', dn_count;
  RAISE NOTICE 'Category breakdown: %', cat_breakdown;
END $$;
