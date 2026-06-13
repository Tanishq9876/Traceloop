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
  Mic,
  Target,
  Bookmark,
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
      { title: "Traceloop - Understand DSA. Don't Memorize It." },
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
  { icon: Eye, title: "Interactive visualizers", body: "Step through pointers, windows, stacks, graphs and DP tables frame by frame." },
  { icon: Workflow, title: "Brute force → optimized", body: "See why the naive solution fails before the smart trick lands." },
  { icon: Code2, title: "Clean or commented code", body: "C++, Java, Python, JavaScript. Toggle comments on or off to match your style." },
  { icon: MessageSquare, title: "Socratic mode", body: "The tutor asks the right questions instead of dumping answers." },
  { icon: Gauge, title: "Complexity, made obvious", body: "Honest time/space analysis in bullet points with the trade-offs that matter." },
  { icon: Mic, title: "Mock interviews", body: "AI interviewer with voice input, hint ladder, and follow-up questions just like the real thing." },
  { icon: Target, title: "Curated practice hub", body: "Multi-topic problems from LeetCode, GFG, Codeforces and CodeChef with save and track." },
  { icon: Bookmark, title: "Notes and bookmarks", body: "Save every session to history, bookmark favorites, and jot inline notes you can revisit anytime." },
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
            interactive simulations - the way a great mentor would teach you.
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

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">FAQ</h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know about learning with Traceloop.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="1">
            <AccordionTrigger>Is Traceloop a problem solver or a tutor?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              A tutor first. It can solve problems, but its priority is building intuition you'd
              re-derive on your own - visualizations, dry runs, and Socratic questions.
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
              Yes - visualizations, dry runs, and the tutor are all mobile-first.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="4">
            <AccordionTrigger>Do I need prior DSA experience?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Not at all. The tutor adapts from absolute beginner to interview-ready, starting
              from first principles and scaling up as you grow.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="5">
            <AccordionTrigger>How is this different from LeetCode or YouTube tutorials?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              LeetCode tests you; tutorials lecture at you. Traceloop *teaches* - interactive
              visualizations, brute-force-to-optimal walkthroughs, and a tutor that answers
              "why" as many times as you need.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="6">
            <AccordionTrigger>Can I practice for technical interviews here?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes. The Interview mode runs mock coding rounds with follow-up questions,
              complexity discussions, and feedback - just like a real interviewer.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="7">
            <AccordionTrigger>Does Traceloop track my progress?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Yes - your history, solved problems, and learning patterns are saved so the tutor
              can personalize future sessions and revisit weak spots.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="8">
            <AccordionTrigger>Is my data private?</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              Your sessions and progress are tied to your account and never shared. You control
              your data and can delete it anytime from your profile.
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
