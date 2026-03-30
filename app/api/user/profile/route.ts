import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user profile from the users table, or create it if it doesn't exist
    let { data: userProfile, error: userError } = await supabase
      .from("users")
      .select("user_id, first_name, last_name, username, email, app_role, is_active, created_at, updated_at")
      .eq("auth_user_id", user.id)
      .single();

    if (userError || !userProfile) {
      // User doesn't exist in our users table, create them
      const { data: newUser, error: createUserError } = await supabase
        .from("users")
        .insert({
          auth_user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          app_role: 'member',
          is_active: true,
        })
        .select("user_id, first_name, last_name, username, email, app_role, is_active, created_at, updated_at")
        .single();

      if (createUserError) {
        console.error("Error creating user record:", createUserError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }

      userProfile = newUser;
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { first_name, last_name, username } = await request.json();

    // Validate input
    if (first_name !== undefined && (typeof first_name !== "string" || first_name.length > 100)) {
      return NextResponse.json(
        { error: "First name must be a string with maximum 100 characters" },
        { status: 400 }
      );
    }

    if (last_name !== undefined && (typeof last_name !== "string" || last_name.length > 100)) {
      return NextResponse.json(
        { error: "Last name must be a string with maximum 100 characters" },
        { status: 400 }
      );
    }

    if (username !== undefined && (typeof username !== "string" || username.length > 50 || username.length < 3)) {
      return NextResponse.json(
        { error: "Username must be between 3-50 characters" },
        { status: 400 }
      );
    }

    // Check if username is already taken (if provided)
    if (username) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("user_id")
        .eq("username", username)
        .neq("auth_user_id", user.id)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const updateData: any = {};
    if (first_name !== undefined) updateData.first_name = first_name.trim();
    if (last_name !== undefined) updateData.last_name = last_name.trim();
    if (username !== undefined) updateData.username = username.trim();

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("auth_user_id", user.id)
      .select("user_id, first_name, last_name, username, email, app_role, is_active, created_at, updated_at")
      .single();

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}