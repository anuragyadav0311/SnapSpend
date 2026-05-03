function Loader({ label = 'Loading...' }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-slate-300 backdrop-blur">
      {label}
    </div>
  )
}

export default Loader
