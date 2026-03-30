import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Authenticated user:", user.id);

    // Check if user exists in our users table, create if not
    let { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("auth_user_id")
      .eq("auth_user_id", user.id)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error("Error checking user:", userCheckError);
      return NextResponse.json(
        { error: "Failed to check user profile" },
        { status: 500 }
      );
    }

    if (!existingUser) {
      // User doesn't exist in our users table, create them
      console.log("Creating user record for:", user.id, user.email);

      const { error: createUserError } = await supabase
        .from("users")
        .insert({
          auth_user_id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          app_role: 'member',
          is_active: true,
        });

      if (createUserError) {
        console.error("Error creating user record:", createUserError);
        return NextResponse.json(
          { error: "Failed to create user profile" },
          { status: 500 }
        );
      }
    }

    const { name, description } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Group name must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (description && (typeof description !== "string" || description.length > 500)) {
      return NextResponse.json(
        { error: "Description must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Generate a unique join code
    const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create the group
    const { data: group, error: insertError } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        created_by: user.id,
        join_code: joinCode,
        is_private: true,
        status: "active",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating group:", insertError);
      return NextResponse.json(
        { error: `Failed to create group: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Add the creator as a leader member
    const { error: memberError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.group_id,
        user_uuid: user.id,
        group_role: "leader",
        membership_status: "active",
      });

    if (memberError) {
      console.error("Error adding group member:", memberError);
      // Don't fail the whole request if member insertion fails
    }

    return NextResponse.json({
      ...group,
      id: group.group_id, // Add id field for backward compatibility
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}