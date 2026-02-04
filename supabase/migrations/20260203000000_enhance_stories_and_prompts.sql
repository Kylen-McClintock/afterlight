-- Add date columns to story_sessions
ALTER TABLE public.story_sessions 
ADD COLUMN IF NOT EXISTS story_date DATE,
ADD COLUMN IF NOT EXISTS date_granularity TEXT CHECK (date_granularity IN ('exact', 'month', 'year', 'season', 'decade'));

-- Seed 30 Guest Prompts
INSERT INTO public.prompt_library_global (title, prompt_text, tags, relationship_type) VALUES
-- Meaningful Moments
('A Moment that Defined Your Relationship', 'Tell the story of a specific moment that perfectly captures your relationship with them. What happened, and why does it stand out?', ARRAY['Guest', 'Meaningful Moment', 'Relationships'], 'Any'),
('The First Time We Met', 'Do you remember the very first time you met or saw them? What was your first impression vs. what you know now?', ARRAY['Guest', 'First Impressions', 'History'], 'Any'),
('A Time They Helped You', 'Share a story about a time they came through for you when you really needed it. What did they do?', ARRAY['Guest', 'Gratitude', 'Support'], 'Any'),
('A Shared Adventure', 'Tell us about a memorable trip or adventure you took together. What was the highlight (or the disaster that is funny now)?', ARRAY['Guest', 'Adventure', 'Fun'], 'Any'),
('The Most "Them" Thing', 'What is a story that illustrates their personality perfectly? The most "them" thing they have ever done.', ARRAY['Guest', 'Personality', 'Fun'], 'Any'),

-- Wisdom & Impact
('Lesson Learned', 'What is the most important lesson you have learned from them, either by their advice or their example?', ARRAY['Guest', 'Wisdom', 'Impact'], 'Any'),
('How They Changed You', 'In what ways are you a different person because you have known them?', ARRAY['Guest', 'Impact', 'Growth'], 'Any'),
('A Piece of Advice', 'What is the best piece of advice they ever gave you?', ARRAY['Guest', 'Wisdom', 'Advice'], 'Any'),
('What You Admire Most', 'What quality do they possess that you most admire and wish you had more of?', ARRAY['Guest', 'Admiration', 'Character'], 'Any'),
('Their Superpower', 'If they had a superpower (or if they do have a real-life one), what is it?', ARRAY['Guest', 'Character', 'Fun'], 'Any'),

-- Funny Shared Stories
('Uncontrollable Laughter', 'Tell a story about a time you both laughed so hard you cried. What was so funny?', ARRAY['Guest', 'Fun', 'Laughter'], 'Any'),
('Inside Joke Origin', 'Do you have an inside joke? Tell the origin story of how it started.', ARRAY['Guest', 'Fun', 'Inside Joke'], 'Any'),
('An Epic Fail', 'Tell us about a time things went wrong for both of you, but it makes for a great story now.', ARRAY['Guest', 'Fun', 'Mishap'], 'Any'),
('Getting Into Trouble', 'Did you ever get into trouble together? Tell us the story.', ARRAY['Guest', 'Fun', 'Mischief'], 'Any'),
('A Surprise', 'Share a story about a time you surprised them, or they surprised you.', ARRAY['Guest', 'Fun', 'Surprise'], 'Any'),

-- Relationship Specific (Friends)
('Why We Are Friends', 'What is the glue that holds your friendship together? Why do you click?', ARRAY['Guest', 'Friendship', 'Connection'], 'Friend'),
('A Night Out', 'Tell a story about a memorable night out (or in) together.', ARRAY['Guest', 'Friendship', 'Fun'], 'Friend'),
('Through Thick and Thin', 'Tell a story about a difficult time you helped each other through.', ARRAY['Guest', 'Friendship', 'Support'], 'Friend'),

-- Relationship Specific (Family/Siblings/Parents)
('Family Tradition', 'What is a family tradition you shared that means the most to you?', ARRAY['Guest', 'Family', 'Tradition'], 'Family'),
('Childhood Shenanigans', 'Tell a story about something you did together as kids that your parents might not know about (or weren''t happy about).', ARRAY['Guest', 'Family', 'Childhood'], 'Sibling'),
('What I inherited', 'What traits, habits, or quirks do you think you inherited or picked up from them?', ARRAY['Guest', 'Family', 'Traits'], 'Family'),
('Holiday Memory', 'What is your favorite holiday memory involving them?', ARRAY['Guest', 'Family', 'Holiday'], 'Family'),

-- Relationship Specific (Partners)
('The Moment You Knew', 'When did you know they were important to you (or the one)?', ARRAY['Guest', 'Love', 'Romance'], 'Partner'),
('Favorite Routine', 'What is a small, daily routine involving them that you love?', ARRAY['Guest', 'Love', 'Routine'], 'Partner'),
('Getting Through a Challenge', 'Tell a story about a challenge you faced as a couple and how you overcame it.', ARRAY['Guest', 'Love', 'Growth'], 'Partner'),

-- Late Night / Deep
('What You Would Say', 'If you could tell them one thing right now that you haven''t said enough, what would it be?', ARRAY['Guest', 'Deep', 'Message'], 'Any'),
('A Hidden Talent', 'What is a talent or skill they have that not everyone knows about?', ARRAY['Guest', 'Trivia', 'Talent'], 'Any'),
('Proudest Moment', 'Tell a story about a time you were incredibly proud of them.', ARRAY['Guest', 'Pride', 'Achievement'], 'Any'),
('Their Legacy', 'What do you think is the most lasting impact they leave on the people around them?', ARRAY['Guest', 'Deep', 'Legacy'], 'Any'),

-- The "Free Form" Guest Prompt (explicitly added)
('Meaningful Message', 'Open floor: Share a meaningful message, a wish for their future, or just tell them how much they mean to you.', ARRAY['Guest', 'Free Form', 'Message'], 'Any');
