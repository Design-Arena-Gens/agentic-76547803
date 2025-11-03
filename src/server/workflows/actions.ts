"use server";

import OpenAI from "openai";
import { baseWorkflowTemplate, platforms } from "@/lib/platforms";
import {
  SimulationOutput,
  ViralAngle,
  WorkflowStep,
  WorkflowTemplate,
} from "@/lib/types";
import { revalidatePath } from "next/cache";

const openai =
  process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== ""
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

const fallbackHooks = [
  "The bizarre storytelling loop trick Instagram's top creators won't admit",
  "I fed 10 million viral posts into an AI and it spat this blueprint",
  "This retention hack prints reels that outpace your last 30 uploads combined",
];

const fallbackAngles: ViralAngle[] = [
  {
    hook: fallbackHooks[0],
    pattern: "Pattern interrupt with sensory overload in first 0.6s.",
    framing: "Confessional voiceover revealing behind-the-scenes cheat code.",
    platformFit: {
      instagram: "Film vertical, punchy CC, comment CTA about risk-taking.",
      youtube: "Add mid-roll tension beat before reveal, end with sub CTA.",
      facebook: "Lean into community FOMO, mention shareable challenge.",
      threads: "Convert to swipe thread: Hook > Why it works > CTA to reel.",
      pinterest: "Visual storyboard of steps with hero payoff frame.",
      tiktok: "Duet-friendly angle, mention trending meme overlay.",
    },
  },
  {
    hook: fallbackHooks[1],
    pattern: "Data-backed intrigue with screenshot overlays.",
    framing: "Show tactical repeatable formula in 3 beats.",
    platformFit: {
      instagram: "Show before/after metrics, CTA to save for later.",
      youtube: "Extended cut with extra examples and resource link.",
      facebook: "Highlight community case study, push to comments.",
      threads: "Carousel with each strategy card expressed as prompt.",
      pinterest: "Idea pin with each beat as polished frame.",
      tiktok: "Overlay text with trending sound down tempo.",
    },
  },
  {
    hook: fallbackHooks[2],
    pattern: "Promise transformation by leveraging tension-release rhythm.",
    framing: "Narrate as a story arc with stakes, conflict, resolution.",
    platformFit: {
      instagram: "Use comment magnet CTA asking viewers biggest hurdle.",
      youtube: "Add 10-sec end screen to cross-promote longer vid.",
      facebook: "Seed conversation around shared struggle.",
      threads: "Turn into swipe thread with each beat as micro-story.",
      pinterest: "Visual checklist for retention beats.",
      tiktok: "Cap each beat with sound-emphasized caption pop.",
    },
  },
];

export async function fetchWorkflowTemplate(): Promise<WorkflowTemplate> {
  return baseWorkflowTemplate;
}

export async function generateAngles(input: {
  persona: string;
  hook: string;
  contentFormat: WorkflowTemplate["contentFormat"];
  targetChannels: WorkflowTemplate["targetChannels"];
}): Promise<ViralAngle[]> {
  if (!openai) {
    return fallbackAngles;
  }

  const prompt = `You are an AI growth strategist. Design 3 viral angles for an Instagram-first automation system.
Persona: ${input.persona}
Core hook: ${input.hook}
Format: ${input.contentFormat}
Channels: ${input.targetChannels.join(", ")}

Return JSON array with {hook, pattern, framing, platformFit:{channel:string}}`;

  const response = await openai.responses.create(
    {
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: { type: "json_object" },
    } as any,
  );

  try {
    const raw = response.output_text;
    const parsed = JSON.parse(raw) as { angles: ViralAngle[] };
    return parsed.angles ?? fallbackAngles;
  } catch (error) {
    console.error("Failed parsing OpenAI response:", error);
    return fallbackAngles;
  }
}

export async function draftWorkflow(
  template: WorkflowTemplate,
  selectedAngle: ViralAngle,
): Promise<WorkflowStep[]> {
  if (!openai) {
    return template.steps.map((step, index) => ({
      ...step,
      description: `${step.description} | Amplified with angle: ${selectedAngle.pattern.slice(0, 90)}...`,
      config: {
        ...step.config,
        confidence: 0.82 - index * 0.03,
      },
    }));
  }

  const prompt = `You are calibrating an AI automation pipeline.
  Template Steps:
  ${template.steps
    .map(
      (step, idx) =>
        `${idx + 1}. ${step.title} [${step.category}] -> ${step.description} (duration: ${
          step.durationMinutes
        }min, config: ${JSON.stringify(step.config)})`,
    )
    .join("\n")}

  Viral Angle:
  ${JSON.stringify(selectedAngle, null, 2)}

  Return JSON array of steps with updated description (max 200 chars) and config fields tuned to maximize retention lift. Preserve IDs. Include new field confidence (0-1).`;

  const completion = await openai.responses.create(
    {
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: { type: "json_object" },
    } as any,
  );

  try {
    const raw = completion.output_text;
    const parsed = JSON.parse(raw) as { steps: WorkflowStep[] };
    return parsed.steps ?? template.steps;
  } catch (error) {
    console.error("Workflow draft parsing failed:", error);
    return template.steps;
  }
}

export async function simulateWorkflow(
  template: WorkflowTemplate,
  steps: WorkflowStep[],
): Promise<SimulationOutput> {
  const baseReach = 12000;
  const stepConfidence =
    steps.reduce((acc, step) => acc + Number(step.config.confidence ?? 0.75), 0) /
    steps.length;

  if (!openai) {
    return {
      performanceScore: Math.min(98, Math.round(stepConfidence * 100)),
      reachProjection: Math.round(baseReach * (1 + stepConfidence)),
      viralityNarrative:
        "Predicting 3.1x baseline reach driven by aggressive hook velocity and repurpose depth. Expect viral loops on Instagram within 48h, with Shorts and Threads acting as secondary accelerants.",
      channelBreakdown: template.targetChannels.map((channel, idx) => ({
        channel,
        predictedReach: Math.round(baseReach * (1.4 - idx * 0.12) * stepConfidence),
        cta: platforms[channel].bestPractices[0],
        bestPostTime: ["09:00", "11:30", "14:00", "17:45"][idx % 4],
      })),
    };
  }

  const prompt = `You are simulating content virality for a multi-channel automation workflow.
  Persona: ${template.persona}
  Hook: ${template.hook}
  Steps: ${steps
    .map((step) => `${step.title} (${step.category}) => ${step.description}`)
    .join("\n")}

  Output a JSON object with:
  - performanceScore (0-100)
  - reachProjection (number of viewers)
  - viralityNarrative (string, <= 420 chars)
  - channelBreakdown: array of {channel, predictedReach, cta, bestPostTime}
  `;

  const response = await openai.responses.create(
    {
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: { type: "json_object" },
    } as any,
  );

  try {
    const data = JSON.parse(response.output_text) as SimulationOutput;
    return data;
  } catch (error) {
    console.error("Simulation parse error:", error);
    return {
      performanceScore: Math.round(stepConfidence * 100),
      reachProjection: Math.round(baseReach * (1 + stepConfidence)),
      viralityNarrative:
        "Simulation fallback executed without OpenAI key. Provide OPENAI_API_KEY for richer analysis.",
      channelBreakdown: template.targetChannels.map((channel, idx) => ({
        channel,
        predictedReach: Math.round(baseReach * (1.3 - idx * 0.08) * stepConfidence),
        cta: platforms[channel].bestPractices[1] ?? "Drive saves and comments.",
        bestPostTime: ["08:30", "12:15", "16:45", "20:30"][idx % 4],
      })),
    };
  }
}

export async function triggerAutopost(payload: {
  template: WorkflowTemplate;
  steps: WorkflowStep[];
  angle: ViralAngle;
}) {
  const timestamp = new Date().toISOString();
  console.info("Autopost triggered:", {
    timestamp,
    payload,
  });

  revalidatePath("/");

  return {
    status: "queued",
    scheduledAt: timestamp,
    queueCount: payload.template.targetChannels.length,
  };
}
