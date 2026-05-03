function ErrorMessage({ message }) {
  if (!message) {
    return null
  }

  return (
    <div className="rounded-3xl border border-[color:color-mix(in_srgb,var(--danger-color)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--danger-color)_14%,transparent)] p-5 text-[var(--danger-color)]">
      {message}
    </div>
  )
}

export default ErrorMessage
