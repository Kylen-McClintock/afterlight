import { AssemblyAI } from 'assemblyai';
import { NextResponse } from 'next/server';

const client = new AssemblyAI({
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
});

export async function POST(request: Request) {
    try {
        const { audioUrl } = await request.json();

        if (!audioUrl) {
            return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 });
        }

        if (!process.env.ASSEMBLYAI_API_KEY) {
            console.error("AssemblyAI API Key is missing");
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        console.log("Transcribing audio from:", audioUrl);

        // AssemblyAI can take a URL directly
        const transcript = await client.transcripts.transcribe({
            audio: audioUrl,
            language_detection: true,
            speech_models: ["universal-3-pro", "universal-2"] // As requested by user
        });

        if (transcript.status === 'error') {
            console.error("AssemblyAI Error:", transcript.error);
            return NextResponse.json({ error: transcript.error }, { status: 500 });
        }

        return NextResponse.json({ text: transcript.text });

    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
    }
}
