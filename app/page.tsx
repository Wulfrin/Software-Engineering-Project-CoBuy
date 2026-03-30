import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Users, DollarSign, ArrowRight } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CoBuy</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Users className="w-4 h-4" />
            Collaborative purchasing made simple
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Smart Buying<br />Starts with{" "}
            <span className="text-primary">Co Buy</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Form a group, pool your orders, and unlock bulk discounts — automatically.
            CoBuy makes collaborative purchasing fair, transparent, and effortless.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/auth/sign-up">
                Start a Group <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to buy smarter, together
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Users className="w-6 h-6 text-primary" />}
              title="Create or Join Groups"
              description="Start a purchasing group for your neighborhood, dorm, or team. Invite members with a unique code."
            />
            <FeatureCard
              icon={<ShoppingCart className="w-6 h-6 text-primary" />}
              title="Manage Shared Orders"
              description="Add products, let each member pick their quantities, and watch the group order come together."
            />
            <FeatureCard
              icon={<DollarSign className="w-6 h-6 text-primary" />}
              title="Fair Cost Splitting"
              description="Costs are calculated automatically based on each member's contribution. No manual math needed."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {([
              { step: "1", title: "Create your group", desc: "Set up a group and invite your co-buyers with a shareable invite code." },
              { step: "2", title: "Build your order", desc: "Add products, set quantities, and let CoBuy calculate everyone's cost share." },
              { step: "3", title: "Track & finalize", desc: "Monitor contributions, track order progress, and mark it complete when done." },
            ] as const).map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">Ready to save together?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Join CoBuy and start your first group purchase today.
          </p>
          <Button asChild size="lg" variant="secondary" className="text-base px-8">
            <Link href="/auth/sign-up">
              Get Started for Free <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <ShoppingCart className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">CoBuy</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CoBuy. Smart Buying Starts with Co Buy.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-background rounded-xl p-6 border">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
