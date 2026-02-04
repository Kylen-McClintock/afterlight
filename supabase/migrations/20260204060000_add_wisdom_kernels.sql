-- Upgrade library_meditations for generic content
ALTER TABLE public.library_meditations
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Remove the restrictive check constraint on type to allow 'wisdom'
ALTER TABLE public.library_meditations
DROP CONSTRAINT IF EXISTS library_meditations_type_check;

-- Optionally add a new one, or just leave it open. Let's leave it open for flexibility.
-- But if strictness is desired:
-- ALTER TABLE public.library_meditations
-- ADD CONSTRAINT library_meditations_type_check CHECK (type IN ('text', 'video', 'audio', 'wisdom'));

-- Insert 15 Kernels of Wisdom
INSERT INTO public.library_meditations (title, description, type, category, content, metadata) VALUES
(
    'You don’t have to solve life. You just have to live these days well.',
    'A lot of suffering comes from trying to force perfect closure: perfect acceptance, perfect legacy, perfect family harmony. Two months isn’t “finish everything.” It’s “play the next few moves with care.”',
    'wisdom',
    'Meaning',
    'My job is not completion. My job is presence and choice, at the scale that fits.',
    '{
        "useful_thought": "My job is not completion. My job is presence and choice, at the scale that fits.",
        "evidence_title": "Associations between end-of-life discussions, patient mental health, medical care near death, and caregiver bereavement adjustment (JAMA, 2008)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/18840840/"
    }'
),
(
    'The main currency is attention, not time.',
    'Two months can feel empty or meaningful depending on where attention goes. Some attention must go to pain and logistics, but what changes the felt quality of time is returning attention to love, beauty, and truthful conversation.',
    'wisdom',
    'Meaning',
    'Where I place attention is what I’m actually living.',
    '{
        "useful_thought": "Where I place attention is what I’m actually living.",
        "evidence_title": "Association of Mindfulness-Based Interventions With Anxiety and Depression in Adults With Cancer: Systematic Review and Meta-analysis (2020)",
        "evidence_url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC7414391/"
    }'
),
(
    'Relationships are the highest-return investment.',
    'If you had to choose one category, choose connection. It reduces fear, increases meaning, lowers regret for everyone, and becomes what people remember most.',
    'wisdom',
    'Meaning',
    'Say the real thing to the real people.',
    '{
        "useful_thought": "Say the real thing to the real people.",
        "evidence_title": "Social relationships and mortality risk: a meta-analytic review (PLoS Medicine, 2010)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/20668659/"
    }'
),
(
    'Closure is mostly emotional, not logistical.',
    'Paperwork matters, but peace usually comes from gratitude expressed, love spoken, forgiveness offered or asked (where appropriate), and permission given to those who will live on.',
    'wisdom',
    'Meaning',
    'One honest sentence can do more than a hundred tasks.',
    '{
        "useful_thought": "One honest sentence can do more than a hundred tasks.",
        "evidence_title": "Effect of dignity therapy on distress and end-of-life experience in terminally ill patients: a randomised controlled trial (Lancet Oncology, 2011)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/21741309/"
    }'
),
(
    'You still have agency, even if the body is failing.',
    'Agency shrinks, but it doesn’t go to zero. You can still choose who you see, what you talk about, what you consume, and how you steer the next hour.',
    'wisdom',
    'Meaning',
    'I can’t control the big arc, but I can steer the next hour.',
    '{
        "useful_thought": "I can’t control the big arc, but I can steer the next hour.",
        "evidence_title": "Nothing left to chance? The impact of locus of control on well-being at the end of life in terminally ill cancer patients (2017)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/28175997/"
    }'
),
(
    'You are allowed to want comfort.',
    'Some people add suffering by treating comfort as weakness or selfishness. Comfort isn’t giving up. Comfort often makes space for connection and meaning.',
    'wisdom',
    'Meaning',
    'Comfort is not a moral failure. Comfort is making room for love.',
    '{
        "useful_thought": "Comfort is not a moral failure. Comfort is making room for love.",
        "evidence_title": "Early palliative care for patients with metastatic non–small-cell lung cancer (NEJM, 2010)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/20818875/"
    }'
),
(
    'Meaning doesn’t require optimism.',
    'Trying to ‘stay positive’ can become another exhausting job. Meaning is still available through truth, tenderness, humor, beauty, gratitude, and being witnessed.',
    'wisdom',
    'Meaning',
    'I don’t need to feel good to be close and real.',
    '{
        "useful_thought": "I don’t need to feel good to be close and real.",
        "evidence_title": "Individual meaning-centered psychotherapy for patients with advanced cancer: a randomized controlled trial (J Clin Oncol, 2018)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/29757459/"
    }'
),
(
    'The best legacy isn’t a summary. It’s guidance.',
    'Loved ones rarely need your full autobiography. They need your voice, your values, and specific messages that land in their future lives—especially on hard days.',
    'wisdom',
    'Meaning',
    'Record what they’ll replay on their hardest days.',
    '{
        "useful_thought": "Record what they’ll replay on their hardest days.",
        "evidence_title": "Dignity therapy overview + evidence base: Dignity therapy: a novel psychotherapeutic intervention for patients near the end of life (2005)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/16110012/"
    }'
),
(
    'Reduce future conflict: clarify intent.',
    'Families often fracture over ambiguity—possessions, wishes, and ‘what would they have wanted.’ Clarity is a kindness that reduces suffering later.',
    'wisdom',
    'Meaning',
    'Clear is kind.',
    '{
        "useful_thought": "Clear is kind.",
        "evidence_title": "Advance care planning improves end of life care and patient and family satisfaction and reduces stress, anxiety, and depression in surviving relatives (BMJ, 2010)",
        "evidence_url": "https://www.bmj.com/content/340/bmj.c1345"
    }'
),
(
    'Let yourself be loved.',
    'People resist receiving love because it triggers grief or feels like dependence. But receiving love is part of closure for you and for them. It’s okay to let people show up.',
    'wisdom',
    'Meaning',
    'Let them show up. It helps them too.',
    '{
        "useful_thought": "Let them show up. It helps them too.",
        "evidence_title": "Social relationships and mortality risk: a meta-analytic review (PLoS Medicine, 2010)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/20668659/"
    }'
),
(
    'Joy is still available, but it may be smaller and closer.',
    'End-of-life joy is often simple: music, sunlight, tastes, a familiar voice, a shared joke, nature, touch. Small joys aren’t denial; they’re a skill.',
    'wisdom',
    'Meaning',
    'Look for one small goodness per day. That’s not denial; it’s skill.',
    '{
        "useful_thought": "Look for one small goodness per day. That’s not denial; it’s skill.",
        "evidence_title": "The effectiveness of savouring interventions on well-being: systematic review (2024)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/38626110/"
    }'
),
(
    'You can stop fighting reality without endorsing it.',
    'Acceptance isn’t liking what’s happening. It’s releasing the argument with the facts so you can spend remaining energy on what you love.',
    'wisdom',
    'Meaning',
    'I release the argument. I keep the love.',
    '{
        "useful_thought": "I release the argument. I keep the love.",
        "evidence_title": "Effectiveness of Acceptance and Commitment Therapy for people with advanced cancer: systematic review/meta-analysis (2023)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/36534441/"
    }'
),
(
    'Your life already counts. You don’t need to earn it in the last two months.',
    'Pressure to ‘make it meaningful now’ can create panic, as if meaning is a last-minute performance. Meaning can be recognition, not achievement.',
    'wisdom',
    'Meaning',
    'Meaning is not a performance. It’s a recognition.',
    '{
        "useful_thought": "Meaning is not a performance. It’s a recognition.",
        "evidence_title": "Effects of self-compassion interventions on reducing depression, anxiety, and stress: systematic review/meta-analysis (2023)",
        "evidence_url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10239723/"
    }'
),
(
    'The aftertime matters—for them.',
    'A hard truth: you won’t be here, but they will. Peace often comes from making their future lighter—permission, blessings, practical clarity, and love that continues.',
    'wisdom',
    'Meaning',
    'Part of my love is making their future lighter.',
    '{
        "useful_thought": "Part of my love is making their future lighter.",
        "evidence_title": "Advance care planning reduces stress, anxiety, and depression in surviving relatives (BMJ, 2010)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/20332506/"
    }'
),
(
    'Choose your north star sentence.',
    'When energy is low, a single sentence can guide decisions: closeness and calm, comfort and love, truth and tenderness. It’s okay if that’s all that happens.',
    'wisdom',
    'Meaning',
    'If nothing else happens, this is enough.',
    '{
        "useful_thought": "If nothing else happens, this is enough.",
        "evidence_title": "Effect of the Serious Illness Care Program in outpatient oncology: cluster randomized clinical trial (JAMA Intern Med, 2019)",
        "evidence_url": "https://pubmed.ncbi.nlm.nih.gov/30870563/"
    }'
);
