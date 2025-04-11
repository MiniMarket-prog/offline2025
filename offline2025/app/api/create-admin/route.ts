import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get request body
    const { email, password, fullName } = await request.json()

    // Validate inputs
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Email, password, and full name are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if any users exist already
    const { data: existingUsers, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })

    if (countError) {
      console.error("Error checking existing users:", countError)
      return NextResponse.json({ error: "Failed to check existing users" }, { status: 500 })
    }

    // Only allow creating admin if no users exist
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Admin user already exists. Cannot create another admin through this endpoint." },
        { status: 403 },
      )
    }

    // Create user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (userError) {
      console.error("Error creating user:", userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // Create profile for the user
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userData.user.id,
      full_name: fullName,
      role: "admin",
      active: true,
    })

    if (profileError) {
      console.error("Error creating profile:", profileError)
      // Try to delete the user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
