import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import "./BackToTop.css";

const BacktoTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = document.querySelector(".landing-root");

    if (!container) return;

    const handleScroll = () => {
      setVisible(container.scrollTop > 100);
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const container = document.querySelector(".landing-root");

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      {visible && (
        <button className="back-to-top" onClick={scrollToTop}>
          <ArrowUp size={22} />
        </button>
      )}
    </>
  );
};

export default BacktoTop;