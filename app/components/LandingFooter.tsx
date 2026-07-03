import Image from "next/image";

const TYPO_LOGO_PATH = "/icons/typo.svg";
const INSTAGRAM_URL = "https://www.instagram.com/tukd_grad/";

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer__main">
        <div className="landing-footer__brand">
          <Image
            src={TYPO_LOGO_PATH}
            alt=""
            aria-hidden="true"
            width={133}
            height={31}
            unoptimized
            className="landing-footer__logo"
          />
          <p className="landing-footer__exhibition">TUK 21st Grad Exhibition</p>
        </div>
        <div className="landing-footer__links">
          <p className="landing-footer__links-label">LINK</p>
          <p className="landing-footer__links-item">
            Instagram :{" "}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="landing-footer__link"
            >
              @tukd_grad
            </a>
          </p>
        </div>
      </div>
      <div className="landing-footer__bottom">
        <hr className="landing-footer__rule" aria-hidden="true" />
        <p className="landing-footer__copyright">
          ⓒ 2026 TECH UNIV KOREA. ALL RIGHTS RESERVED.
        </p>
        <p className="landing-footer__copyright">
          TUKOREA DESIGN ENGINEERING 21TH GRADUATION EXHIBITION
        </p>
      </div>
    </footer>
  );
}
