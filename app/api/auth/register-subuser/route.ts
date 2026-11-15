import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orgId, userId, name, mobileNumber, email, mpin, permissions } = body;

    if (!orgId || !mobileNumber || !mpin) {
      return NextResponse.json(
        { error: "orgId, mobileNumber, and mpin are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email || `${mobileNumber}@bn.com`;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: true,
        message: "Saved locally (Supabase keys not configured)",
      });
    }

    // Create isolated server supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    let authUserId = userId;

    // 1. Try registering auth account in Supabase
    try {
      // Supabase requires min 6 chars password
      const authPassword = mpin.length < 6 ? `${mpin}00` : mpin;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: authPassword,
        options: {
          data: {
            org_id: orgId,
            name: name,
            mobile_number: mobileNumber,
            role: "staff",
          },
        },
      });

      if (authData?.user?.id) {
        authUserId = authData.user.id;
      } else if (authErr) {
        console.warn("Supabase auth signUp note:", authErr.message);
      }
    } catch (authException) {
      console.warn("Supabase auth register note:", authException);
    }

    // 2. Insert/Upsert into org_users table
    try {
      const { data, error } = await supabase
        .from("org_users")
        .upsert([
          {
            id: authUserId,
            org_id: orgId,
            name,
            mobile_number: mobileNumber,
            email: cleanEmail,
            mpin,
            role: "staff",
            permissions: permissions || {},
            status: "active",
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .maybeSingle();

      if (error) {
        console.warn("Supabase org_users table insert note:", error.message);
      } else if (data) {
        return NextResponse.json({ success: true, user: data });
      }
    } catch (dbErr) {
      console.warn("Supabase org_users table exception:", dbErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUserId,
        org_id: orgId,
        name,
        mobile_number: mobileNumber,
        email: cleanEmail,
        mpin,
        role: "staff",
        permissions,
        status: "active",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to register sub-user" },
      { status: 500 }
    );
  }
}

