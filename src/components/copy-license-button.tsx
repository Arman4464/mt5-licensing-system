'use client'

export function CopyLicenseButton({ licenseKey }: { licenseKey: string }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(licenseKey)
        alert('License key copied!')
      }}
      className="text-blue-600 hover:text-blue-700"
    >
      📋 Copy
    </button>
  )
}
