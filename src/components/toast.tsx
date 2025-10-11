'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function Toast() {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'success' | 'error' | 'info'>('info')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const info = searchParams.get('info')

    if (success) {
      setMessage(success)
      setType('success')
      setShow(true)
      setTimeout(() => {
        setShow(false)
        router.replace(window.location.pathname)
      }, 3000)
    } else if (error) {
      setMessage(error)
      setType('error')
      setShow(true)
      setTimeout(() => {
        setShow(false)
        router.replace(window.location.pathname)
      }, 5000)
    } else if (info) {
      setMessage(info)
      setType('info')
      setShow(true)
      setTimeout(() => {
        setShow(false)
        router.replace(window.location.pathname)
      }, 3000)
    }
  }, [searchParams, router])

  if (!show) return null

  const colors = {
    success: 'bg-green-50 border-green-500 text-green-800',
    error: 'bg-red-50 border-red-500 text-red-800',
    info: 'bg-blue-50 border-blue-500 text-blue-800',
  }

  return (
    <div className="fixed right-4 top-4 z-50 animate-in slide-in-from-top">
      <div className={`rounded-lg border-l-4 p-4 shadow-lg ${colors[type]}`}>
        <div className="flex items-center justify-between">
          <p className="font-medium">{message}</p>
          <button
            onClick={() => setShow(false)}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
