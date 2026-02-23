export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background py-14">
      <div className="container">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="skeuo-gold flex h-10 w-10 items-center justify-center rounded-lg font-bold">
                T
              </div>
              <div>
                <p className="font-playfair text-2xl font-bold text-primary">TheTutor</p>
                <p className="text-sm text-muted-foreground">AI-Powered Learning Coach</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              Personalized tutoring for learners who want clear structure, practical feedback, and steady progress.
            </p>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold text-primary">Product</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-primary">How It Works</a></li>
              <li><a href="/auth/signin" className="hover:text-primary">Get Started</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair text-lg font-bold text-primary">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary">About</a></li>
              <li><a href="#" className="hover:text-primary">Contact</a></li>
              <li><a href="#" className="hover:text-primary">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/80 pt-6 text-sm text-muted-foreground">
          <p>(c) 2026 TheTutor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
