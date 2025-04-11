"use client"

import { supabase, isOnline } from "./supabase"
import { storeCurrentUser, getCurrentUser, addToSyncQueue } from "./local-storage"
import type { Database } from "@/types/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  try {
    if (isOnline()) {
      // Online login with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Get user profile from public_profiles view instead of profiles table
      const { data: profile, error: profileError } = await supabase
        .from("public_profiles") // Changed from "profiles" to "public_profiles"
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (profileError) throw profileError

      // Store user with profile in local storage
      const userWithProfile = { ...data.user, profile }
      storeCurrentUser(userWithProfile)

      return { user: userWithProfile, error: null }
    } else {
      // Offline login - check against local storage
      // This is a simplified version - in a real app, you'd want to hash passwords
      const localUsers = getCurrentUser()
      if (localUsers && localUsers.email === email) {
        // In a real app, you would verify the password here
        return { user: localUsers, error: null }
      }
      return { user: null, error: "Invalid login credentials or no local user found" }
    }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

// Sign out
export const signOut = async () => {
  try {
    if (isOnline()) {
      await supabase.auth.signOut()
    }
    storeCurrentUser(null)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Create a new user (admin only)
export const createUser = async (
  email: string,
  password: string,
  fullName: string,
  role: "admin" | "manager" | "cashier",
  storeId?: string,
) => {
  try {
    if (isOnline()) {
      // Create user in Supabase
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (error) throw error

      // Create profile for the user - still use profiles table for writes
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        full_name: fullName,
        role,
        active: true,
        store_id: storeId || null,
      })

      if (profileError) throw profileError

      return { user: data.user, error: null }
    } else {
      // Queue user creation for when we're back online
      addToSyncQueue("createUser", {
        email,
        password,
        fullName,
        role,
        storeId,
      })
      return { user: null, error: "User will be created when back online" }
    }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}

// Get current user
export const getCurrentAuthUser = async () => {
  try {
    if (isOnline()) {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error

      if (data.user) {
        // Get user profile from public_profiles view instead of profiles table
        const { data: profile, error: profileError } = await supabase
          .from("public_profiles") // Changed from "profiles" to "public_profiles"
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError) throw profileError

        // Store user with profile in local storage
        const userWithProfile = { ...data.user, profile }
        storeCurrentUser(userWithProfile)

        return { user: userWithProfile, error: null }
      }
      return { user: null, error: null }
    } else {
      // Return user from local storage
      const user = getCurrentUser()
      return { user, error: null }
    }
  } catch (error: any) {
    return { user: null, error: error.message }
  }
}
