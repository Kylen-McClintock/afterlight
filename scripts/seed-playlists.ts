import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const DEFAULT_PLAYLISTS = [
    { title: 'Peaceful Piano', category: 'Music', type: 'song', content: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO', is_custom: false, description: 'Relaxing piano music for focus or unwinding.', duration_mins: 60 },
    { title: 'Nature Sounds', category: 'Nature', type: 'song', content: 'https://open.spotify.com/playlist/37i9dQZF1DZ06evO07zaak', is_custom: false, description: 'Immersive sounds from nature for grounding and peace.', duration_mins: 60 },
    { title: 'Ambient Relaxation', category: 'Ambient', type: 'song', content: 'https://open.spotify.com/playlist/37i9dQZF1DX3Ogo9pFvBkY', is_custom: false, description: 'Soft ambient drones to clear the mind.', duration_mins: 60 },
    { title: 'Deep Focus', category: 'Focus', type: 'song', content: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ', is_custom: false, description: 'Keep calm and focus with ambient and post-rock music.', duration_mins: 60 }
];

async function seedPlaylists() {
    console.log('Fetching all circles...');
    const { data: circles, error: circleError } = await supabase.from('circles').select('id, primary_user_id');

    if (circleError) {
        console.error('Error fetching circles:', circleError);
        return;
    }

    console.log(`Found ${circles.length} circles. Seeding playlists...`);

    let totalInserted = 0;

    for (const circle of circles) {
        // Check if any playlist exists in this circle
        const { data: existing } = await supabase
            .from('library_meditations')
            .select('title')
            .eq('circle_id', circle.id)
            .eq('type', 'song');

        const existingTitles = new Set(existing?.map(m => m.title));

        const toInsert = DEFAULT_PLAYLISTS
            .filter(p => !existingTitles.has(p.title))
            .map(p => ({
                ...p,
                circle_id: circle.id,
                user_id: circle.primary_user_id
            }));

        if (toInsert.length > 0) {
            const { error } = await supabase.from('library_meditations').insert(toInsert);
            if (error) {
                console.error(`Error inserting into circle ${circle.id}:`, error);
            } else {
                totalInserted += toInsert.length;
            }
        }
    }

    console.log(`Successfully seeded ${totalInserted} missing playlists across all circles!`);
}

seedPlaylists();
