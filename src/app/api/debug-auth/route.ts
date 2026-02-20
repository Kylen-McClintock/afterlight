
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

        if (!key) throw new Error("Service Key Missing in process.env")

        const supabase = createClient(url, key)
        const email = 'tester@afterlight.com'

        // Ensure user exists
        const { data: { users } } = await supabase.auth.admin.listUsers()
        let user = users.find(u => u.email === email)

        if (!user) {
            const { data: newUser } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                password: 'password123' // Set a password so we can mimic sign in
            })
            if (newUser.user) user = newUser.user
        }

        // Generate a Session directly? Admin API doesn't easily return a session JSON.
        // But we can generate a Link.
        // Actually, let's use signInWithPassword since we set a password?
        // But that requires anon key client side usually.
        // Server side sign in:

        const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
            email,
            password: 'password123'
        })

        if (sessionError) {
            // Maybe password isn't set for existing user? Update it.
            if (user?.id) {
                await supabase.auth.admin.updateUserById(user.id, { password: 'password123' })
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                    email,
                    password: 'password123'
                })
                if (retryError) throw new Error("SignIn Failed: " + retryError.message)
                return NextResponse.json(retryData.session)
            }
        }

        if (sessionData.session) {
            return NextResponse.json(sessionData.session)
        }

        return NextResponse.json({ error: "No session returned" }, { status: 500 })

    } catch (err: any) {
        return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
    }
}
