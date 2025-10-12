export interface Product {
  id: string
  name: string
  platform: string
  max_accounts: number
  created_at: string
  updated_at: string
}

export interface MT5Account {
  id: string
  account_number: string
  broker_company: string
  broker_server: string
  last_used_at: string
  license_id: string
  created_at: string
  updated_at: string
}

export interface License {
  id: string
  user_id: string
  product_id: string
  license_key: string
  status: 'active' | 'paused' | 'revoked' | 'suspended'
  expires_at: string | null
  created_at: string
  updated_at: string
  products?: Product | Product[]
  mt5_accounts?: MT5Account[]
}

export interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
  licenses?: License[]
}