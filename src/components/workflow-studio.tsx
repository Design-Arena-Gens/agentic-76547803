"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { classNames, formatNumber, randomPastel } from "@/lib/utils";
import { platforms } from "@/lib/platforms";
import {
  SimulationOutput,
  ViralAngle,
  WorkflowStep,
  WorkflowTemplate,
} from "@/lib/types";
import {
  draftWorkflow,
  generateAngles,
  simulateWorkflow,
  triggerAutopost,
} from "@/server/workflows/actions";

interface WorkflowStudioProps {
  template: WorkflowTemplate;
}

const categories: Record<
  WorkflowStep["category"],
  { label: string; gradient: string; icon: string }
> = {
  ideation: {
    label: "Ideation",
    gradient: "from-amber-400/80 to-orange-500/60",
    icon: "💡",
  },
  production: {
    label: "Production",
    gradient: "from-sky-400/80 to-blue-600/60",
    icon: "🎬",
  },
  repurpose: {
    label: "Repurpose",
    gradient: "from-emerald-400/80 to-green-600/60",
    icon: "♻️",
  },
  distribution: {
    label: "Distribution",
    gradient: "from-violet-400/80 to-purple-600/60",
    icon: "📡",
  },
  optimize: {
    label: "Optimize",
    gradient: "from-rose-400/80 to-pink-600/60",
    icon: "📈",
  },
};

function ChannelBadge({ channel }: { channel: keyof typeof platforms }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
      style={{ border: `1px solid ${platforms[channel].color}` }}
    >
      <span
        className="block h-2 w-2 rounded-full"
        style={{ backgroundColor: platforms[channel].color }}
      />
      {platforms[channel].label}
    </span>
  );
}

export function WorkflowStudio({ template }: WorkflowStudioProps) {
  const [persona, setPersona] = useState(template.persona);
  const [hook, setHook] = useState(template.hook);
  const [contentFormat, setContentFormat] = useState(template.contentFormat);
  const [targetChannels, setTargetChannels] = useState(template.targetChannels);
  const [angles, setAngles] = useState<ViralAngle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<ViralAngle | null>(null);
  const [steps, setSteps] = useState<WorkflowStep[]>(template.steps);
  const [simulation, setSimulation] = useState<SimulationOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDrafting, startDraftTransition] = useTransition();
  const [isSimulating, startSimulation] = useTransition();
  const [isDeploying, startDeploy] = useTransition();

  const templateWithOverrides = useMemo(
    () => ({
      ...template,
      persona,
      hook,
      contentFormat,
      targetChannels,
      steps,
    }),
    [template, persona, hook, contentFormat, targetChannels, steps],
  );

  useEffect(() => {
    let ignore = false;

    const handler = setTimeout(() => {
      setIsGenerating(true);
      generateAngles({
        persona,
        hook,
        contentFormat,
        targetChannels,
      })
        .then((generated) => {
          if (ignore) return;
          setAngles(generated);
          const nextAngle = generated[0] ?? null;
          setSelectedAngle(nextAngle);

          if (nextAngle) {
            startDraftTransition(() => {
              draftWorkflow(
                {
                  ...template,
                  persona,
                  hook,
                  contentFormat,
                  targetChannels,
                },
                nextAngle,
              ).then((drafted) => {
                if (ignore) return;
                setSteps(drafted);
              });
            });
          }
        })
        .catch((error) => {
          console.error(error);
          toast.error("Failed generating viral angles. Fallback options applied.");
        })
        .finally(() => {
          if (!ignore) setIsGenerating(false);
        });
    }, 400);

    return () => {
      ignore = true;
      clearTimeout(handler);
    };
  }, [persona, hook, contentFormat, targetChannels, template, startDraftTransition]);

  const handleAngleSelect = (angle: ViralAngle) => {
    setSelectedAngle(angle);
    startDraftTransition(() => {
      draftWorkflow(
        { ...template, persona, hook, contentFormat, targetChannels },
        angle,
      )
        .then((drafted) => {
          setSteps(drafted);
          toast.success("Workflow recalibrated for this viral angle.");
        })
        .catch((error) => {
          console.error(error);
          toast.error("Unable to draft workflow. Please retry.");
        });
    });
  };

  const handleSimulate = () => {
    if (!selectedAngle) {
      toast.error("Select a viral angle to simulate.");
      return;
    }
    startSimulation(() => {
      simulateWorkflow(
        { ...template, persona, hook, contentFormat, targetChannels },
        steps,
      )
        .then((result) => {
          setSimulation(result);
          toast.success("Simulation ready.");
        })
        .catch((error) => {
          console.error(error);
          toast.error("Simulation failed. Try again.");
        });
    });
  };

  const handleAutopost = () => {
    if (!selectedAngle) {
      toast.error("Select an angle before autoposting.");
      return;
    }

    startDeploy(() => {
      triggerAutopost({
        template: templateWithOverrides,
        steps,
        angle: selectedAngle,
      })
        .then((result) => {
          toast.success(
            `Autopost queue primed. ${result.queueCount} channels scheduled.`,
          );
        })
        .catch((error) => {
          console.error(error);
          toast.error("Autopost queue could not be triggered.");
        });
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <section className="space-y-6">
        <div className="glass-panel space-y-5 px-6 py-6">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-semibold">Workflow Blueprint</h2>
              <p className="text-sm text-slate-300/70">
                Personalize persona, hook, formats, and target channels. AI will recalibrate the steps
                automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutopost}
              disabled={isDeploying}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-60"
            >
              {isDeploying ? "Queueing..." : "Queue Autopost"}
            </button>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Persona Snapshot</span>
              <textarea
                className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition hover:border-white/20 focus:border-accent focus:outline-none"
                value={persona}
                onChange={(event) => setPersona(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Core Hook</span>
              <textarea
                className="min-h-[96px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition hover:border-white/20 focus:border-accent"
                value={hook}
                onChange={(event) => setHook(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">Primary Format</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none transition hover:border-white/20 focus:border-accent"
                value={contentFormat}
                onChange={(event) =>
                  setContentFormat(event.target.value as WorkflowTemplate["contentFormat"])
                }
              >
                <option value="reels">Instagram Reels</option>
                <option value="carousel">Carousel</option>
                <option value="story">Stories</option>
                <option value="shorts">YouTube Shorts</option>
                <option value="ideaPin">Pinterest Idea Pin</option>
              </select>
            </label>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Target Channels
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(platforms).map(([channelKey, platform]) => {
                  const isSelected = targetChannels.includes(channelKey as typeof targetChannels[0]);
                  return (
                    <button
                      key={channelKey}
                      type="button"
                      onClick={() => {
                        setTargetChannels((prev) =>
                          isSelected
                            ? prev.filter((item) => item !== channelKey)
                            : [...new Set([...prev, channelKey as typeof prev[number]])],
                        );
                      }}
                      className={classNames(
                        "rounded-full border px-3 py-1 text-xs font-semibold transition",
                        isSelected
                          ? "border-white/40 bg-white/20 text-white shadow-inner"
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-white/30",
                      )}
                      style={{
                        color: isSelected ? platform.color : undefined,
                      }}
                    >
                      {platform.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel space-y-5 px-6 py-6">
          <header className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                Viral Angle Engine {isGenerating ? "• recalibrating..." : ""}
              </h3>
              <p className="text-sm text-slate-300/70">
                Swipe through AI blueprints designed for viral velocity. Select one to adapt the
                workflow.
              </p>
            </div>
          </header>
          <div className="grid gap-4 md:grid-cols-2">
            {angles.map((angle) => {
              const active = angle.hook === selectedAngle?.hook;
              return (
                <button
                  key={angle.hook}
                  type="button"
                  onClick={() => handleAngleSelect(angle)}
                  className={classNames(
                    "group relative overflow-hidden rounded-3xl border px-5 py-5 text-left transition",
                    active
                      ? "border-accent/70 bg-gradient-to-br from-accent/20 to-primary/20 shadow-lg shadow-primary/20"
                      : "border-white/10 bg-white/5 hover:-translate-y-0.5 hover:border-white/30",
                  )}
                >
                  <div className="absolute right-4 top-4 text-xs font-semibold uppercase text-white/60">
                    {active ? "Active angle" : "Tap to activate"}
                  </div>
                  <span className="text-sm uppercase tracking-wide text-accent">Hook Pattern</span>
                  <h4 className="mt-1 text-lg font-semibold leading-tight">{angle.hook}</h4>
                  <p className="mt-3 text-sm text-slate-200/80">{angle.pattern}</p>
                  <p className="mt-3 rounded-2xl bg-white/5 p-3 text-xs text-slate-200/70">
                    {angle.framing}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200/70">
                    {Object.entries(angle.platformFit).map(([channelKey, note]) => (
                      <span
                        key={channelKey}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1"
                      >
                        <strong>{platforms[channelKey as keyof typeof platforms]?.label}:</strong>{" "}
                        {note}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          {angles.length === 0 && (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-300/70">
              Calibrating angles… ensure OPENAI_API_KEY is configured for richer ideation.
            </div>
          )}
        </div>

        <div className="glass-panel space-y-5 px-6 py-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">
                Automation Steps {isDrafting ? "• optimizing…" : ""}
              </h3>
              <p className="text-sm text-slate-300/70">
                Understand how the workflow executes from audience mining through automated posting.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent hover:text-accent disabled:cursor-progress disabled:opacity-60"
            >
              {isSimulating ? "Simulating…" : "Run Simulation"}
            </button>
          </header>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5"
              >
                <div
                  className="absolute inset-y-0 left-0 w-1 rounded-full"
                  style={{ background: randomPastel(step.id) }}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-base font-semibold">{step.title}</h4>
                      <p className="text-xs uppercase tracking-wide text-slate-300/60">
                        {categories[step.category].icon} {categories[step.category].label} ·{" "}
                        {step.durationMinutes} min
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-200/70">
                    Confidence:{" "}
                    <span className="font-semibold text-accent">
                      {(Number(step.config.confidence ?? 0.78) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-200/80">{step.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-200/70">
                  {Object.entries(step.config).map(([key, value]) => (
                    <span
                      key={key}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1"
                    >
                      {key}: <strong className="text-slate-100">{String(value)}</strong>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <aside className="space-y-6">
        <div className="glass-panel space-y-4 px-6 py-6">
          <header>
            <h3 className="text-lg font-semibold">Platform Intelligence</h3>
            <p className="text-sm text-slate-300/70">
              Contextual best practices injected into each derivative asset.
            </p>
          </header>
          <div className="space-y-3">
            {targetChannels.map((channel) => {
              const platform = platforms[channel];
              return (
                <div
                  key={channel}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold" style={{ color: platform.color }}>
                      {platform.label}
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wide text-white/60">
                      {platform.supportedFormats.join(" · ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-200/80">{platform.description}</p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-200/60">
                    {platform.bestPractices.map((practice) => (
                      <li key={practice}>• {practice}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-panel space-y-4 px-6 py-6">
          <header>
            <h3 className="text-lg font-semibold">Simulation Dashboard</h3>
            <p className="text-sm text-slate-300/70">
              Project viral lift and plan posting cadence with precision.
            </p>
          </header>

          {simulation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-primary/20 to-accent/10 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300/70">
                    Performance Score
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {simulation.performanceScore}/100
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-300/70">
                    Reach Projection
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatNumber(simulation.reachProjection)}
                  </p>
                </div>
              </div>
              <p className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200/80">
                {simulation.viralityNarrative}
              </p>
              <div className="space-y-3">
                {simulation.channelBreakdown.map((breakdown) => (
                  <div
                    key={breakdown.channel}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <ChannelBadge channel={breakdown.channel} />
                      <span className="text-xs text-slate-300/70">
                        Best Time: {breakdown.bestPostTime}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span>Predicted reach</span>
                      <strong>{formatNumber(breakdown.predictedReach)}</strong>
                    </div>
                    <p className="mt-2 text-xs text-slate-200/70">
                      CTA Focus: <span className="text-slate-100">{breakdown.cta}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-300/70">
              Run a simulation to scene-test the workflow across channels.
            </div>
          )}
        </div>
        <div className="glass-panel space-y-3 px-6 py-6 text-sm text-slate-200/70">
          <h4 className="text-base font-semibold text-white">Automation Checklist</h4>
          <ul className="space-y-2">
            <li>✓ AI hooks tuned to persona and platform voice</li>
            <li>✓ Script expansion with retention-aware pacing</li>
            <li>✓ Repurposed copy and CTA per channel</li>
            <li>✓ Autopost queue primed via Launchpad</li>
            <li>✓ Simulation to validate reach before publishing</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
