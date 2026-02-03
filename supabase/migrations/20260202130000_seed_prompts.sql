-- Seed Prompts into prompt_library_global
-- Categories (in tags): 'Childhood', 'Career', 'Family', 'Wisdom', 'Fun', 'History'

INSERT INTO public.prompt_library_global (title, prompt_text, tags) VALUES
-- Childhood
('Earliest Memory', 'What is your very first memory? How old were you, and what do you remember seeing or feeling?', ARRAY['Childhood']),
('Favorite Toy', 'What was your absolute favorite toy growing up? Do you remember who gave it to you?', ARRAY['Childhood']),
('Best Friend', 'Who was your best friend in elementary school? What kinds of trouble did you get into together?', ARRAY['Childhood']),
('Childhood Bedroom', 'Describe your childhood bedroom. What posters were on the walls? What did it smell like?', ARRAY['Childhood']),
('Getting in Trouble', 'Tell us about a time you got in trouble as a kid. Was it worth it?', ARRAY['Childhood']),
('Favorite Subject', 'What was your favorite subject in school, and why?', ARRAY['Childhood']),
('Family Pets', 'Did you have any pets growing up? Tell us about them.', ARRAY['Childhood']),
('Family Dinner', 'What was a typical dinner like in your house growing up? Did you eat together?', ARRAY['Childhood']),
('The Neighborhood', 'Describe the neighborhood you grew up in. What were the neighbors like?', ARRAY['Childhood']),
('When I Grow Up', 'What did you want to be when you grew up? How did that change over time?', ARRAY['Childhood']),

-- Career
('First Job', 'What was your very first job? How much were you paid?', ARRAY['Career']),
('Worst Job', 'What was the worst job you ever had? What made it so terrible?', ARRAY['Career']),
('Proudest Moment', 'What are you most proud of in your career? A specific project or achievement?', ARRAY['Career']),
('Favorite Mentor', 'Who was the best boss or mentor you ever had? What did they teach you?', ARRAY['Career']),
('Advice to Self', 'What advice would you give your younger self about work and career?', ARRAY['Career']),
('Big Failure', 'Tell us about a significant failure or mistake at work. What did you learn from it?', ARRAY['Career']),
('The Big Break', 'Did you ever have a "big break" or a lucky moment that changed your career trajectory?', ARRAY['Career']),
('Choosing a Path', 'How did you choose your career? Was it planned or accidental?', ARRAY['Career']),
('Dream Job', 'If money were no object, what would your dream job be?', ARRAY['Career']),
('Retirement', 'When did you know it was time to retire or move on from your main career?', ARRAY['Career']),

-- Family
('Meeting the One', 'How did you meet your spouse or partner? What was your first impression?', ARRAY['Family', 'Relationships']),
('The Wedding', 'What do you remember most about your wedding day?', ARRAY['Family', 'Relationships']),
('First Child', 'Tell us about the day your first child was born. How did life change?', ARRAY['Family']),
('Holiday Traditions', 'What is your favorite family holiday tradition? How did it start?', ARRAY['Family']),
('The Funniest Relative', 'Who is the funniest person in your family? Tell us a story about them.', ARRAY['Family']),
('Secret Recipe', 'Is there a family recipe that is a closely guarded secret? Describe it (without giving it away!).', ARRAY['Family']),
('Parents Values', 'What values did your parents instill in you that you still hold today?', ARRAY['Family']),
('Admiration', 'What do you admire most about your parents?', ARRAY['Family']),
('Family Mix-up', 'What is a funny misunderstanding or "disaster" that happened at a family gathering?', ARRAY['Family']),
('Vacation Time', 'Describe a memorable family vacation. What went right (or wrong)?', ARRAY['Family']),

-- Wisdom & Reflection
('Meaning of Life', 'In your own words, what is the meaning of life?', ARRAY['Wisdom']),
('Best Advice', 'What is the best piece of advice you have ever received?', ARRAY['Wisdom']),
('Regrets', 'Do you have any major regrets? What would you have done differently?', ARRAY['Wisdom']),
('Gratitude', 'What are you most grateful for in your life right now?', ARRAY['Wisdom']),
('Success', 'How do you define success? Has your definition changed over the years?', ARRAY['Wisdom']),
('What is Love', 'How would you define love?', ARRAY['Wisdom']),
('Hard Times', 'Tell us about a difficult time in your life and how you got through it.', ARRAY['Wisdom']),
('World Change', 'If you could change one thing about the world, what would it be?', ARRAY['Wisdom']),
('Legacy', 'What kind of legacy do you want to leave behind?', ARRAY['Wisdom']),
('Important Lesson', 'What is the single most important lesson you have learned in life?', ARRAY['Wisdom']),

-- Fun
('Dinner Guest', 'If you could have dinner with anyone, dead or alive, who would it be and why?', ARRAY['Fun']),
('Favorite Movie', 'What is your all-time favorite movie? How many times have you seen it?', ARRAY['Fun']),
('Guilty Pleasure', 'What is your guilty pleasure song that you sing in the car?', ARRAY['Fun']),
('Lottery Winner', 'If you won the lottery tomorrow, what is the first thing you would do?', ARRAY['Fun']),
('Hidden Talent', 'Do you have a hidden talent? What is it?', ARRAY['Fun']),
('Perfect Day', 'Describe your idea of a perfect day from start to finish.', ARRAY['Fun']),
('Weird Food', 'What is the weirdest thing you have ever eaten?', ARRAY['Fun']),
('Time Travel', 'If you could time travel to any era, past or future, where would you go?', ARRAY['Fun']),
('Favorite Joke', 'Tell us your favorite joke.', ARRAY['Fun']),
('Secret Fact', 'What is something most people do not know about you?', ARRAY['Fun']),

-- History
('Where Were You', 'Where were you when a major historical event happened (e.g., Moon Landing, 9/11)?', ARRAY['History']),
('World Changes', 'How has the world changed the most during your lifetime?', ARRAY['History']),
('Tech Shock', 'What piece of technology blew your mind when it was first released?', ARRAY['History']),
('Prices Then', 'Do you remember how much a movie ticket or a gallon of gas cost when you were 16?', ARRAY['History']),
('Fashion Trends', 'What is a fashion trend from your youth that you hope never comes back?', ARRAY['History']),
('First Vote', 'Do you remember the first time you voted? Who was president then?', ARRAY['History']);
