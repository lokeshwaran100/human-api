import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Shield, Brain, ArrowRight, CheckCircle2, Lock, Eye } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <nav className="flex items-center justify-between max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-text-primary">HumanAPI</span>
        </div>
        <Link
          to="/dashboard"
          className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Open Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div
            custom={0}
            variants={fadeUp}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8"
          >
            <Zap className="w-3.5 h-3.5" />
            The Personal Decision API
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight mb-6"
          >
            <span className="text-text-primary">You are more than</span>
            <br />
            <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              your data.
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="text-xl text-text-secondary max-w-2xl leading-relaxed mb-10"
          >
            Give AI agents a way to understand your preferences, respect your boundaries,
            and ask what you would decide — without exposing your private context.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="flex gap-4">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-primary-600/25 hover:shadow-primary-500/30"
            >
              Create Your Agent
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center gap-2 px-8 py-3.5 glass glass-hover text-text-primary font-semibold rounded-xl transition-all duration-200"
            >
              Explore the Demo
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Flow Visualization */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="max-w-4xl mx-auto px-6 pb-24"
      >
        <div className="glass p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">
            {/* External Agent */}
            <div className="glass px-6 py-4 text-center min-w-[160px]">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-purple-500/15 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm font-semibold text-text-primary">AI Agent</p>
              <p className="text-xs text-text-muted mt-1">"Would you accept this?"</p>
            </div>

            <ArrowRight className="w-5 h-5 text-text-muted rotate-90 md:rotate-0" />

            {/* Your Agent */}
            <div className="glass px-6 py-4 text-center min-w-[200px] border-primary-500/20 shadow-glow-primary">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-primary-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-400" />
              </div>
              <p className="text-sm font-semibold text-primary-400">Your Agent</p>
              <div className="flex flex-col gap-0.5 mt-2 text-xs text-text-muted">
                <span>Preferences</span>
                <span>Policies</span>
                <span>Context</span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-text-muted rotate-90 md:rotate-0" />

            {/* Decision */}
            <div className="glass px-6 py-4 text-center min-w-[160px]">
              <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-approve/15 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-approve" />
              </div>
              <p className="text-sm font-semibold text-approve">✓ APPROVE</p>
              <p className="text-xs text-text-muted mt-1">Decision, not data</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Shield,
              color: 'text-primary-400',
              bg: 'bg-primary-600/10',
              title: 'Policy-Driven Decisions',
              desc: 'Define hard rules. Your agent follows them deterministically before consulting AI.',
            },
            {
              icon: Lock,
              color: 'text-approve',
              bg: 'bg-approve/10',
              title: 'Privacy by Design',
              desc: 'External agents receive decisions, never your raw preferences or private context.',
            },
            {
              icon: Eye,
              color: 'text-purple-400',
              bg: 'bg-purple-500/10',
              title: 'Full Transparency',
              desc: 'See what your agent knows, where it came from, and how confident it is.',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.15, duration: 0.5 }}
              className="glass p-6 glass-hover transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-lg ${f.bg} flex items-center justify-center mb-4`}>
                <f.icon className={`w-5 h-5 ${f.color}`} />
              </div>
              <h3 className="text-base font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-glass-border py-8 text-center">
        <p className="text-sm text-text-muted">
          HumanAPI — The interface between humans and the agentic internet.
        </p>
      </footer>
    </div>
  );
}
