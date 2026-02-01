import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedPrompts() {
    const filePath = path.join(process.cwd(), 'content', 'default_prompts.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`Seeding ${data.length} prompts...`);

    // Check for existing to avoid duplicates
    const { data: existing } = await supabase.from('prompt_library_global').select('title');
    const existingTitles = new Set(existing?.map(p => p.title));

    const toInsert = data.filter((p: any) => !existingTitles.has(p.title));

    if (toInsert.length > 0) {
        const { error } = await supabase.from('prompt_library_global').insert(toInsert);
        if (error) console.error('Error seeding prompts:', error);
        else console.log(`Inserted ${toInsert.length} new prompts.`);
    } else {
        console.log('No new prompts to seed.');
    }
}

async function seedQuotes() {
    const filePath = path.join(process.cwd(), 'content', 'default_quotes.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`Seeding ${data.length} quotes...`);

    // Check for existing
    const { data: existing } = await supabase.from('quotes_global').select('quote_text');
    const existingTexts = new Set(existing?.map(q => q.quote_text));

    const toInsert = data.filter((q: any) => !existingTexts.has(q.quote_text));

    if (toInsert.length > 0) {
        const { error } = await supabase.from('quotes_global').insert(toInsert);
        if (error) console.error('Error seeding quotes:', error);
        else console.log(`Inserted ${toInsert.length} new quotes.`);
    } else {
        console.log('No new quotes to seed.');
    }
}

async function seedMeditations() {
    const filePath = path.join(process.cwd(), 'content', 'default_meditations.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    console.log(`Seeding ${data.length} meditations...`);

    // Check for existing
    const { data: existing } = await supabase.from('meditations_global').select('title');
    const existingTitles = new Set(existing?.map(m => m.title));

    const toInsert = data.filter((m: any) => !existingTitles.has(m.title));

    if (toInsert.length > 0) {
        const { error } = await supabase.from('meditations_global').insert(toInsert);
        if (error) console.error('Error seeding meditations:', error);
        else console.log(`Inserted ${toInsert.length} new meditations.`);
    } else {
        console.log('No new meditations to seed.');
    }
}

async function main() {
    await seedPrompts();
    await seedQuotes();
    await seedMeditations();
}

main();
