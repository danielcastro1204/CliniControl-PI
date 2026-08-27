import logo from "@/assets/logo-clinicontrol.png";

const Footer = () => {
  const links = [
    { label: "Inicio", href: "#inicio" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Planes", href: "#planes" },
    { label: "Contacto", href: "#contacto" },
  ];

  return (
    <footer id="contacto" className="border-t py-12">
      <div className="container px-4 md:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logo} alt="CliniControl" className="h-8 w-auto" />

          <div className="flex items-center gap-6">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-secondary transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            CliniControl — Gestión operativa para consultorios odontológicos.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
