'use client'

export function DeleteButton({ 
  productId, 
  productName 
}: { 
  productId: string
  productName: string 
}) {
  const handleDelete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (confirm(`Delete ${productName}? This cannot be undone.`)) {
      const formData = new FormData(e.currentTarget)
      const response = await fetch('/admin/products/delete', {
        method: 'POST',
        body: formData,
      })
      if (response.ok) {
        window.location.reload()
      }
    }
  }

  return (
    <form onSubmit={handleDelete}>
      <input type="hidden" name="product_id" value={productId} />
      <button
        type="submit"
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        Delete
      </button>
    </form>
  )
}
