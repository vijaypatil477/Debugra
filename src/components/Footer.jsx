import { Link } from "react-router-dom";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const platformLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/#features" },
    { label: "Languages", href: "/#languages" },
    { label: "Editor", href: "/editor" },
  ];

  const communityLinks = [
    { label: "GitHub", href: "https://github.com/omkhandare55/Debugra", external: true },
    { label: "Contributors", href: "/contributors" },
    { label: "Report Issue", href: "https://github.com/omkhandare55/Debugra/issues", external: true },
    { label: "Contact", href: "mailto:debugra.team@gmail.com", external: true },
  ];

  const socialLinks = [
    { icon: FaGithub, href: "https://github.com/omkhandare55/Debugra", label: "GitHub" },
    { icon: FaLinkedin, href: "https://www.linkedin.com/", label: "LinkedIn" },
    { icon: FaEnvelope, href: "mailto:debugra.team@gmail.com", label: "Email" },
  ];

  const linkStyle = {
    textDecoration: "none",
    color: "inherit",
  };

  const renderLink = (link) => {
    if (link.external) {
      return (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyle}
          className="debugra-footer-link"
        >
          {link.label}
        </a>
      );
    }
    return (
      <Link
        key={link.label}
        to={link.href}
        style={linkStyle}
        className="debugra-footer-link"
      >
        {link.label}
      </Link>
    );
  };

  return (
    <footer className="debugra-footer">
      <div className="debugra-footer-container">
        {/* Main Footer Content */}
        <div className="debugra-footer-content">
          {/* Brand Section */}
          <div className="debugra-footer-brand-section">
              <Link
                to="/"
                className="debugra-footer-brand-link"
                style={linkStyle}
              >
                <img
                  src="/icon-dark.svg"
                  alt="Debugra Logo"
                  className="debugra-footer-logo"
                />

                <div>
                  <span className="debugra-footer-brand-text">
                    Debugra
                  </span>

                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "#6a6a6a",
                      fontFamily: "JetBrains Mono, monospace",
                      marginLeft: "6px",
                    }}
                  >
                    v1.0
                  </span>
                </div>
              </Link>

              <p className="debugra-footer-description">
                Professional collaborative code editor with AI-powered debugging and
                real-time collaboration.
              </p>
            </div>

          {/* Platform Links */}
          <div className="debugra-footer-column">
            <h4 className="debugra-footer-heading">Platform</h4>
            <ul className="debugra-footer-list">
              {platformLinks.map(renderLink)}
            </ul>
          </div>

          {/* Community Links */}
          <div className="debugra-footer-column">
            <h4 className="debugra-footer-heading">Community</h4>
            <ul className="debugra-footer-list">
              {communityLinks.map(renderLink)}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="debugra-footer-divider" />

        {/* Bottom Section */}
        <div className="debugra-footer-bottom">
          {/* Social Icons */}
          <div className="debugra-footer-socials">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="debugra-footer-social-icon"
                style={linkStyle}
              >
                <social.icon />
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="debugra-footer-copyright">
            © {currentYear} Debugra. Built for collaborative coding.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;