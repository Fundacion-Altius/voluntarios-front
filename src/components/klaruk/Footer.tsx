import Logo from "./Logo";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-row">
        <div>
          <Logo height={26} />
          <p className="brandline"><strong>El sistema operativo de tu entidad</strong><br />Socios, voluntariado, actividades y subvenciones en un solo sitio.</p>
        </div>
        <p className="by sig">por <a href="https://shiftcitizen.com">ShiftCitizen</a></p>
      </div>
    </footer>
  );
}
