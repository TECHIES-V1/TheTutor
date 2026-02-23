export function Footer() {
  return (
    <footer className="bg-background border-t border-border/60 py-16 position-relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>

      <div className="container relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
                <span className="text-primary-foreground font-playfair font-bold text-xl">
                  T
                </span>
              </div>
              <span className="font-playfair text-2xl font-bold text-primary drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]">
                TheTutor
              </span>
            </div>
            <p className="text-base text-muted-foreground/80 leading-relaxed max-w-sm mb-8">
              Experience the pinnacle of AI-powered personalized education.
              Learn anything, adapted to your pace and stylistic preferences.
            </p>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold mb-6 tracking-wide drop-shadow-sm">
              Product
            </h4>
            <ul className="space-y-4 text-sm font-medium text-muted-foreground/80">
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold mb-6 tracking-wide drop-shadow-sm">
              Company
            </h4>
            <ul className="space-y-4 text-sm font-medium text-muted-foreground/80">
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold mb-6 tracking-wide drop-shadow-sm">
              Legal
            </h4>
            <ul className="space-y-4 text-sm font-medium text-muted-foreground/80">
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
                >
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground/60">
          <p>&copy; 2026 TheTutor. All rights reserved.</p>
          <div className="flex gap-6 mt-6 md:mt-0 font-medium">
            <a
              href="#"
              className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
            >
              Twitter
            </a>
            <a
              href="#"
              className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="hover:text-primary hover:drop-shadow-[0_0_5px_rgba(212,175,55,0.5)] transition-all"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
