export function Brand({ href }: { href: string }) {
  return (
    <a className="brand" href={href} aria-label="DCLM Music Ministry home">
      <img className="brand-logo" src="/choir/logo.png" alt="DCLM Music Ministry logo" />
      <span className="brand-name"><strong>DCLM</strong>MUSIC MINISTRY</span>
    </a>
  )
}