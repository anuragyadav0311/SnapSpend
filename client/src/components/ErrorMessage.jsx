function ErrorMessage({ message }) {
  if (!message) {
    return null
  }

  return (
    <div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-5 text-rose-100">
      {message}
    </div>
  )
}

export default ErrorMessage
