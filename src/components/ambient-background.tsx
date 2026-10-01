export function AmbientBackground() {
  return (
    <div aria-hidden="true" className="ambient">
      <span className="ambient-blob -left-[12%] -top-[18%] w-[max(52vw,300px)] bg-blob-1 animate-blob-a" />
      <span className="ambient-blob -right-[10%] top-[8%] w-[max(46vw,260px)] bg-blob-2 animate-blob-b" />
      <span className="ambient-blob bottom-[-26%] left-[18%] w-[max(50vw,280px)] bg-blob-3 animate-blob-c" />
      <span className="ambient-blob bottom-[-8%] right-[14%] w-[max(30vw,180px)] bg-blob-4 opacity-70 animate-blob-d" />
    </div>
  )
}
