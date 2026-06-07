export default function Spinner({ dark = false, size = 14 }) {
  return (
    <span
      className={`spinner${dark ? ' spinner-dark' : ''}`}
      style={{ width: size, height: size }}
    />
  )
}
