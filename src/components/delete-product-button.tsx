'use client'

export function DeleteProductButton({ 
  productId, 
  onDelete 
}: { 
  productId: string
  onDelete: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={onDelete}>
      <input type="hidden" name="id" value={productId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm('Are you sure? This will affect existing licenses.')) {
            e.preventDefault()
          }
        }}
        className="text-red-600 hover:text-red-700 text-sm"
      >
        Delete
      </button>
    </form>
  )
}
