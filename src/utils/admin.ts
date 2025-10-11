import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const supabase = await createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/login')
  }

  // Check if user is admin
  const isAdmin = user.user_metadata?.role === 'admin'
  
  if (!isAdmin) {
    redirect('/dashboard?error=unauthorized')
  }

  // Return both regular client and admin client
  return { 
    user, 
    supabase,
    adminClient: createAdminClient()
  }
}
