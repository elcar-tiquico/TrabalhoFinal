import Link from "next/link"
import { Leaf } from "lucide-react"

export function Navbar() {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark sticky-top shadow-sm"
      style={{ background: "linear-gradient(90deg, #0d6efd 0%, #198754 100%)" }}
    >
      <div className="container">
        <Link href="/" className="navbar-brand d-flex align-items-center">
          <Leaf className="me-2 text-white" />
          <span className="fw-bold">PhytoMoz</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarMain"
          aria-controls="navbarMain"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarMain">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link active" href="/">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/justificativa">
                Justificativa
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/orientacoes">
                Orientações
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/referencias">
                Referências bibliográficas
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/equipe">
                Equipe responsável
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" href="/contato">
                Contacto
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  )
}
