import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  Eye,
  Brain,
  Code2,
  Workflow,
  GitBranch,
  Layers,
  Gauge,
  MessageSquare,
  ArrowRight,
  Check,
} from "lucide-react";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { TwoPointerHero } from "@/components/site/TwoPointerHero";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "Traceloop — Understand DSA. Don't Memorize It." },
      {
        name: "description",
        content:
          "Traceloop is an AI-powered DSA tutor with intuition-first explanations, interactive algorithm visualizations, and guided dry runs.",
      },
    ],
  }),
});

const features = [
  { icon: Brain, title: "Intuition-first AI tutor", body: "Adaptive explanations from absolute beginner to interview-ready." },
  { icon: Eye, title: "Interactive visualizers", body: "Step through pointers, windows, stacks, graphs and DP tables." },
  { icon: Workflow, title: "Brute force → optimized", body: "See *why* the naive solution fails before the smart trick lands." },
  { icon: Code2, title: "Line-by-line code", body: "C++, Java, Python, JavaScript with explanations on every line." },
  { icon: MessageSquare, title: "Socratic mode", body: "The tutor asks the right questions instead of dumping answers." },
  { icon: Gauge, title: "Complexity, made obvious", body: "Honest time/space analysis with the trade-offs that matter." },
];

const visualizers = [
  { label: "Two Pointers", icon: GitBranch },
  { label: "Sliding Window", icon: Layers },
  { label: "Binary Search", icon: Eye },
  { label: "BFS / DFS", icon: Workflow },
  { label: "Recursion Tree", icon: Brain },
  { label: "DP Table", icon: Sparkles },
];

function Landing() {
  return (
    <div className="relative min-h-screen">
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <Nav />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-24 md:pt-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-powered DSA mentor
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            <span className="text-gradient">Understand DSA.</span>
            <br />
            Don't memorize it.
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground md:text-lg">
            Learn algorithms visually with AI-powered intuition, dry runs, and
            interactive simulations — the way a great mentor would teach you.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-6">
              <Link to="/auth">
                Start learning <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <a href="#visualizers">See visualizers</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-14 max-w-3xl"
        >
          <TwoPointerHero />
        </motion.div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Built for deep understanding
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every feature exists to replace memorization with intuition.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="glass group relative rounded-2xl p-6 transition-colors hover:bg-white/[0.04]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VISUALIZERS */}
      <section id="visualizers" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            See every algorithm move
          </h2>
          <p className="mt-3 text-muted-foreground">
            Interactive, replayable simulations for the patterns that matter.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {visualizers.map((v) => (
            <div
              key={v.label}
              className="glass flex flex-col items-center justify-center gap-2 rounded-xl p-5 text-center"
            >
              <v.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{v.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Simple pricing
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
          {[
            {
              name: "Free",
              price: "$0",
              tag: "For curious learners",
              perks: ["AI tutor (limited)", "Basic visualizers", "Save 10 problems"],
            },
            {
              name: "Pro",
              price: "$12",
              tag: "For interview prep",
              perks: ["Unlimited AI tutor", "All visualizers", "Mock interviews", "Personalized memory"],
              featured: true,
            },
          ].map((p) => (
            <div
              key={p.name}
              className={[
                "rounded-2xl border p-6",
                p.featured
                  ? "border-primary/40 bg-gradient-to-b from-primary/10 to-transparent"
                  : "border-border bg-card/40",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div>
                  <span className="text-3xl font-semibold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{p.tag}</p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> {perk}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-6 w-full" variant={p.featured ? "default" : "outline"}>
                <Link to="/auth">Get {p.name}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">FAQ</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="1">
            <AccordionTrigger>Is Traceloop a problem solver or a tutor?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              A tutor first. It can solve problems, but its priority is building intuition you'd
              re-derive on your own — visualizations, dry runs, and Socratic questions.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="2">
            <AccordionTrigger>Which languages does the code generator support?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              C++, Java, Python, and JavaScript with line-by-line explanations.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="3">
            <AccordionTrigger>Does it work on mobile?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes — visualizations, dry runs, and the tutor are all mobile-first.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="glass relative overflow-hidden rounded-3xl p-10 text-center md:p-14">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--color-primary)/0.18,_transparent_60%)]" />
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Stop memorizing. Start understanding.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Upload a problem, watch the algorithm move, and ask "why" as many times as you want.
          </p>
          <Button asChild size="lg" className="mt-6 h-11 px-6">
            <Link to="/auth">Create your account</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
