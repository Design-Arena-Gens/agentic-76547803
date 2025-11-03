import { Suspense } from "react";
import { fetchWorkflowTemplate } from "@/server/workflows/actions";
import { WorkflowStudio } from "@/components/workflow-studio";

export default async function Page() {
  const template = await fetchWorkflowTemplate();

  return (
    <div className="space-y-8">
      <section className="glass-panel relative overflow-hidden px-8 py-12">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70">
            Autonomous AI Launchpad
          </span>
          <h1 className="text-4xl font-semibold md:text-5xl">
            Launch viral Instagram workflows that autopost everywhere in minutes.
          </h1>
          <p className="max-w-2xl text-lg text-slate-200/80">
            Generate creator-ready scripts, atomize into multi-channel variants, and schedule
            autoposting across Instagram, YouTube Shorts, Facebook Reels, Threads, and Pinterest in a
            single flow.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-200/70">
            <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2">
              🚀 Viral hook engine
            </span>
            <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2">
              🤖 AI workflow automation
            </span>
            <span className="glass-panel inline-flex items-center gap-2 rounded-full px-4 py-2">
              📡 Cross-platform autopost
            </span>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="glass-panel p-8">Booting workflow studio…</div>}>
        <WorkflowStudio template={template} />
      </Suspense>
    </div>
  );
}
