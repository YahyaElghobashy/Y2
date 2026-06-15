-- ============================================================
-- 030_seed_question_bank.sql — Seed questions & dares for Together Time
-- 150+ questions across categories + 30 dares across heat levels
-- ============================================================

-- ============================================================
-- CHECK-IN SCALE QUESTIONS (suitable for alignment scoring)
-- ============================================================

INSERT INTO public.question_bank (text, category, difficulty, answer_type, suitable_modes) VALUES
-- Communication
('How well do you feel heard when you share something important?', 'communication', 'light', 'scale_1_10', '{check_in,deep_dive}'),
('How comfortable are you bringing up difficult topics with me?', 'communication', 'medium', 'scale_1_10', '{check_in}'),
('How satisfied are you with how we resolve disagreements?', 'communication', 'medium', 'scale_1_10', '{check_in}'),
('How well do we communicate our daily needs to each other?', 'communication', 'light', 'scale_1_10', '{check_in}'),
('How emotionally safe do you feel expressing your true feelings?', 'communication', 'deep', 'scale_1_10', '{check_in,deep_dive}'),

-- Intimacy
('How connected do you feel to me right now?', 'intimacy', 'light', 'scale_1_10', '{check_in}'),
('How satisfied are you with the quality time we spend together?', 'intimacy', 'light', 'scale_1_10', '{check_in}'),
('How well do I show you love in the way you need it?', 'intimacy', 'medium', 'scale_1_10', '{check_in}'),
('How comfortable are you being vulnerable with me?', 'intimacy', 'deep', 'scale_1_10', '{check_in,deep_dive}'),
('How aligned do you feel our physical boundaries are?', 'intimacy', 'deep', 'scale_1_10', '{check_in}'),

-- Finances
('How aligned are we on our financial priorities?', 'finances', 'medium', 'scale_1_10', '{check_in}'),
('How comfortable are you discussing money with me?', 'finances', 'light', 'scale_1_10', '{check_in}'),
('How well do we plan for our financial future together?', 'finances', 'medium', 'scale_1_10', '{check_in}'),
('How satisfied are you with our spending habits as a couple?', 'finances', 'medium', 'scale_1_10', '{check_in}'),

-- Faith
('How aligned are we in our spiritual practice together?', 'faith', 'medium', 'scale_1_10', '{check_in}'),
('How well do we support each other''s relationship with Allah?', 'faith', 'deep', 'scale_1_10', '{check_in}'),
('How satisfied are you with how we integrate faith into daily life?', 'faith', 'medium', 'scale_1_10', '{check_in}'),
('How comfortable are you discussing spiritual struggles with me?', 'faith', 'deep', 'scale_1_10', '{check_in,deep_dive}'),

-- Family
('How aligned are we on how we''ll raise our children?', 'family', 'medium', 'scale_1_10', '{check_in}'),
('How well do we navigate each other''s family dynamics?', 'family', 'medium', 'scale_1_10', '{check_in}'),
('How comfortable are you with the role my family plays in our life?', 'family', 'deep', 'scale_1_10', '{check_in}'),

-- Lifestyle
('How satisfied are you with our work-life balance as a couple?', 'lifestyle', 'light', 'scale_1_10', '{check_in}'),
('How aligned are our daily routines and habits?', 'lifestyle', 'light', 'scale_1_10', '{check_in}'),
('How well do we balance personal space and togetherness?', 'lifestyle', 'medium', 'scale_1_10', '{check_in}'),

-- Dreams
('How supported do you feel in pursuing your personal goals?', 'dreams', 'medium', 'scale_1_10', '{check_in}'),
('How aligned is our vision for where we''ll be in 5 years?', 'dreams', 'deep', 'scale_1_10', '{check_in,deep_dive}'),

-- Conflict
('How quickly do we recover after a disagreement?', 'conflict', 'medium', 'scale_1_10', '{check_in}'),
('How safe do you feel during arguments?', 'conflict', 'deep', 'scale_1_10', '{check_in}');

-- ============================================================
-- CHECK-IN OPEN FOLLOW-UP QUESTIONS
-- ============================================================

INSERT INTO public.question_bank (text, category, difficulty, answer_type, suitable_modes) VALUES
('What''s one thing I did this week that made you feel loved?', 'communication', 'light', 'open', '{check_in,date_night}'),
('What is one area where you''d like us to grow this month?', 'communication', 'medium', 'open', '{check_in}'),
('Is there anything you''ve been wanting to tell me but haven''t?', 'vulnerability', 'deep', 'open', '{check_in,deep_dive}'),
('What''s one way I could better support you right now?', 'communication', 'light', 'open', '{check_in}'),
('What made you smile about us this week?', 'love', 'light', 'open', '{check_in,date_night}');

-- ============================================================
-- DEEP DIVE QUESTIONS — open-ended, for journaling and discussion
-- ============================================================

-- Values & Faith
INSERT INTO public.question_bank (text, category, difficulty, answer_type, suitable_modes) VALUES
('How do you envision our daily spiritual practice together after marriage?', 'faith', 'deep', 'open', '{deep_dive}'),
('What does ''tawakkul'' (trust in Allah) look like in our relationship?', 'faith', 'deep', 'open', '{deep_dive}'),
('How do you want us to observe Ramadan together?', 'faith', 'medium', 'open', '{deep_dive}'),
('What Islamic values are non-negotiable for you in our home?', 'faith', 'deep', 'open', '{deep_dive}'),
('How should we handle differences in religious practice between us?', 'faith', 'deep', 'open', '{deep_dive}'),
('What does your ideal Friday (Jumu''ah) look like as a family?', 'faith', 'light', 'open', '{deep_dive,date_night}'),

-- Finances
('What does financial security mean to you?', 'finances', 'medium', 'open', '{deep_dive}'),
('How should we divide financial responsibilities?', 'finances', 'medium', 'open', '{deep_dive}'),
('What are your thoughts on saving vs. enjoying money now?', 'finances', 'medium', 'open', '{deep_dive}'),
('How do you feel about the concept of mahr and its significance?', 'finances', 'deep', 'open', '{deep_dive}'),
('What would you do if one of us lost their job?', 'finances', 'deep', 'open', '{deep_dive}'),

-- Family & Future
('How do you want to handle disagreements about parenting?', 'family', 'deep', 'open', '{deep_dive}'),
('What traditions from your family do you want to carry into ours?', 'family', 'medium', 'open', '{deep_dive}'),
('How many children do you envision, and when?', 'family', 'medium', 'open', '{deep_dive}'),
('How should we handle visits and boundaries with in-laws?', 'family', 'deep', 'open', '{deep_dive}'),
('What does ''home'' feel like to you?', 'family', 'light', 'open', '{deep_dive,date_night}'),

-- Intimacy & Boundaries
('What does emotional intimacy look like to you?', 'intimacy', 'medium', 'open', '{deep_dive}'),
('How do you like to receive comfort when you''re upset?', 'intimacy', 'light', 'open', '{deep_dive}'),
('What physical boundaries are important to you before marriage?', 'intimacy', 'deep', 'open', '{deep_dive}'),
('How do you envision our intimate life after marriage?', 'intimacy', 'deep', 'open', '{deep_dive}'),
('What makes you feel most cherished?', 'intimacy', 'light', 'open', '{deep_dive,date_night}'),

-- Communication
('How do you handle things when you''re angry?', 'communication', 'medium', 'open', '{deep_dive}'),
('What''s your love language and how do you want me to speak it?', 'communication', 'light', 'open', '{deep_dive}'),
('How do you prefer to resolve conflicts — in the moment or after cooling down?', 'communication', 'medium', 'open', '{deep_dive}'),
('What''s something you wish people understood about you?', 'communication', 'deep', 'open', '{deep_dive}'),

-- Vulnerability
('What''s your biggest fear about marriage?', 'vulnerability', 'deep', 'open', '{deep_dive}'),
('What past hurt do you not want repeated in our relationship?', 'vulnerability', 'deep', 'open', '{deep_dive}'),
('What makes you feel insecure in a relationship?', 'vulnerability', 'deep', 'open', '{deep_dive}'),
('When was the last time you cried, and what triggered it?', 'vulnerability', 'deep', 'open', '{deep_dive}'),
('What do you struggle with that you rarely share with others?', 'vulnerability', 'deep', 'open', '{deep_dive}'),

-- Dreams & Goals
('Where do you see us living in 10 years?', 'dreams', 'medium', 'open', '{deep_dive}'),
('What career accomplishment would make you feel fulfilled?', 'dreams', 'medium', 'open', '{deep_dive}'),
('What is your biggest life goal outside of marriage?', 'dreams', 'medium', 'open', '{deep_dive}'),
('If money were no obstacle, what would our life look like?', 'dreams', 'light', 'open', '{deep_dive,date_night}'),
('What legacy do you want to leave behind?', 'dreams', 'deep', 'open', '{deep_dive}');

-- ============================================================
-- DATE NIGHT FUN QUESTIONS — lighter, playful
-- ============================================================

INSERT INTO public.question_bank (text, category, difficulty, answer_type, suitable_modes) VALUES
-- Light & Fun
('What''s your favorite memory of us so far?', 'love', 'light', 'open', '{date_night}'),
('If we could teleport anywhere right now, where would you take me?', 'travel', 'light', 'open', '{date_night}'),
('What''s the most adventurous thing you''d want us to try together?', 'lifestyle', 'light', 'open', '{date_night}'),
('What song reminds you of us?', 'love', 'light', 'open', '{date_night}'),
('If you could cook me one meal for the rest of my life, what would it be?', 'home', 'light', 'open', '{date_night}'),
('What''s the funniest thing I''ve ever said to you?', 'communication', 'light', 'open', '{date_night}'),
('What would our couple superpower be?', 'love', 'light', 'open', '{date_night}'),
('If we had a reality TV show, what would it be called?', 'lifestyle', 'light', 'open', '{date_night}'),
('What''s something silly you want to do with me someday?', 'dreams', 'light', 'open', '{date_night}'),
('Describe your perfect lazy Sunday with me.', 'lifestyle', 'light', 'open', '{date_night}'),

-- Medium
('What''s something about me that surprised you?', 'love', 'medium', 'open', '{date_night}'),
('What do I do that makes you fall for me all over again?', 'intimacy', 'medium', 'open', '{date_night}'),
('What scares you most about marrying me?', 'vulnerability', 'medium', 'open', '{date_night,deep_dive}'),
('If you could change one thing about how we communicate, what would it be?', 'communication', 'medium', 'open', '{date_night}'),
('What''s one secret talent of yours I haven''t discovered yet?', 'lifestyle', 'medium', 'open', '{date_night}'),

-- Deep
('What do you need from me that you''ve been afraid to ask?', 'vulnerability', 'deep', 'open', '{date_night,deep_dive}'),
('What does forever look like to you?', 'love', 'deep', 'open', '{date_night}'),
('What''s the hardest sacrifice you''d make for our relationship?', 'love', 'deep', 'open', '{date_night}');

-- ============================================================
-- YES/NO & MULTIPLE CHOICE QUESTIONS (for quick alignment)
-- ============================================================

INSERT INTO public.question_bank (text, category, difficulty, answer_type, answer_options, suitable_modes) VALUES
('Should we have a joint bank account after marriage?', 'finances', 'medium', 'yes_no', NULL, '{check_in,date_night}'),
('Do you want to live near your parents after marriage?', 'family', 'medium', 'yes_no', NULL, '{check_in}'),
('Should screen time be limited during our quality time?', 'lifestyle', 'light', 'yes_no', NULL, '{check_in,date_night}'),
('Do you believe in couples therapy even when things are good?', 'communication', 'medium', 'yes_no', NULL, '{check_in}'),
('Should we pray together every day?', 'faith', 'medium', 'yes_no', NULL, '{check_in}'),

-- Multiple choice
('What''s your ideal vacation style?', 'travel', 'light', 'multiple_choice',
  '["Adventure & hiking", "Beach & relaxation", "City & culture", "Road trip"]'::jsonb,
  '{date_night,check_in}'),
('How do you prefer to spend a free evening?', 'lifestyle', 'light', 'multiple_choice',
  '["Going out to dinner", "Movie night at home", "Outdoor walk", "Deep conversation"]'::jsonb,
  '{date_night}'),
('What''s your conflict resolution style?', 'conflict', 'medium', 'multiple_choice',
  '["Talk it out immediately", "Take space then discuss", "Write a letter", "Seek mediation"]'::jsonb,
  '{check_in,deep_dive}'),
('How would you describe your love language?', 'intimacy', 'light', 'multiple_choice',
  '["Words of affirmation", "Acts of service", "Quality time", "Physical touch", "Gifts"]'::jsonb,
  '{check_in,date_night}'),
('What''s most important in a home?', 'home', 'light', 'multiple_choice',
  '["Cozy & warm", "Modern & clean", "Spacious & open", "Near family & community"]'::jsonb,
  '{date_night,check_in}');

-- ============================================================
-- RANKING QUESTIONS
-- ============================================================

INSERT INTO public.question_bank (text, category, difficulty, answer_type, answer_options, suitable_modes) VALUES
('Rank these in order of importance for our marriage:', 'lifestyle', 'medium', 'ranking',
  '["Trust", "Communication", "Faith", "Fun", "Financial stability"]'::jsonb,
  '{check_in,deep_dive}'),
('Rank how you''d spend a bonus $10,000:', 'finances', 'light', 'ranking',
  '["Save it", "Travel together", "Home improvement", "Give to charity", "Invest"]'::jsonb,
  '{date_night,check_in}');

-- ============================================================
-- DARES — 30 across 3 heat levels
-- ============================================================

-- Heat Level 1: Light & Sweet (15cc reward / 10cc penalty)
INSERT INTO public.game_dares (text, category, heat_level, coyyns_reward, coyyns_penalty) VALUES
('Give your partner a genuine 60-second compliment — no repeating words.', 'communication', 1, 15, 10),
('Sing a love song (badly) to your partner with full emotion.', 'love', 1, 15, 10),
('Write a haiku about your partner right now and read it out loud.', 'love', 1, 15, 10),
('Do your best impression of your partner — let them rate it.', 'lifestyle', 1, 15, 10),
('Tell your partner 3 things you noticed about them this week.', 'communication', 1, 15, 10),
('Give your partner a 2-minute hand massage while telling them what you love about their hands.', 'intimacy', 1, 15, 10),
('Share a voice memo right now telling your partner why you chose them.', 'love', 1, 15, 10),
('Recreate the face you made when you first saw your partner. Hold it for 10 seconds.', 'love', 1, 15, 10),
('Let your partner pick a song and you have to dance to it — full commitment.', 'lifestyle', 1, 15, 10),
('Close your eyes and describe your partner''s face from memory in detail.', 'intimacy', 1, 15, 10);

-- Heat Level 2: Bold & Playful (30cc reward / 20cc penalty)
INSERT INTO public.game_dares (text, category, heat_level, coyyns_reward, coyyns_penalty) VALUES
('Plan a surprise date for next week and describe it in full detail right now.', 'love', 2, 30, 20),
('Write a short love letter to your partner and read it dramatically.', 'love', 2, 30, 20),
('Call your partner''s parent and say one nice thing about their child.', 'family', 2, 30, 20),
('Reveal the last 3 things you searched on your phone — no deleting.', 'vulnerability', 2, 30, 20),
('Tell your partner your most embarrassing moment in full detail.', 'vulnerability', 2, 30, 20),
('Let your partner go through your camera roll for 60 seconds.', 'vulnerability', 2, 30, 20),
('Make a TikTok-style video declaring your love — no retakes allowed.', 'love', 2, 30, 20),
('Describe your ideal day with your partner from morning to night.', 'lifestyle', 2, 30, 20),
('Act out the moment you realized you were falling for your partner.', 'love', 2, 30, 20),
('Share a prayer you''ve made about your partner or future together.', 'faith', 2, 30, 20);

-- Heat Level 3: Vulnerable & Deep (45cc reward / 30cc penalty)
INSERT INTO public.game_dares (text, category, heat_level, coyyns_reward, coyyns_penalty) VALUES
('Share something you''ve never told anyone — your partner is the first to know.', 'vulnerability', 3, 45, 30),
('Apologize for something specific you''ve been meaning to address.', 'conflict', 3, 45, 30),
('Make a promise to your partner and explain why it matters to you.', 'love', 3, 45, 30),
('Share your biggest insecurity about our relationship honestly.', 'vulnerability', 3, 45, 30),
('Describe the moment you knew this person was different from everyone else.', 'love', 3, 45, 30),
('Tell your partner about a time they hurt you that you never mentioned.', 'conflict', 3, 45, 30),
('Share what you pray for when you pray for your partner.', 'faith', 3, 45, 30),
('Write a du''a for your partner right now and read it to them.', 'faith', 3, 45, 30),
('Describe the life you''re building together in vivid detail — 10 years from now.', 'dreams', 3, 45, 30),
('Share the moment you were most proud of your partner.', 'love', 3, 45, 30);
