import { createGateway, streamText } from "ai";
import type { GatewayModelId, LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

const MAX_JOB_DESC = 10_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`generate:${user._id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { jobDescription, image, provider, model, apiKey } = (await req.json()) as {
      jobDescription?: string;
      image?: string;
      provider?: string;
      model?: string;
      apiKey?: string;
    };

    if (!jobDescription && !image) {
      return NextResponse.json(
        { error: "At least a job description or a job poster image is required." },
        { status: 400 }
      );
    }

    if (jobDescription && jobDescription.length > MAX_JOB_DESC) {
      return NextResponse.json(
        { error: `Job description is too long (max ${MAX_JOB_DESC} characters).` },
        { status: 400 }
      );
    }

    if (image) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const bytes = Buffer.byteLength(matches[2], "base64");
        if (bytes > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { error: "Image must be under 5MB." },
            { status: 400 }
          );
        }
      }
    }

    if (!provider) {
      return NextResponse.json(
        { error: "Missing LLM provider configuration." },
        { status: 400 }
      );
    }

    if (provider !== "vercel" && provider !== "public" && (!model || !apiKey)) {
      return NextResponse.json(
        { error: "Missing LLM configuration (model or API key)." },
        { status: 400 }
      );
    }

    if (provider === "vercel" && !model) {
      return NextResponse.json(
        { error: "Missing model name." },
        { status: 400 }
      );
    }

    let modelInstance: LanguageModel;
    try {
      if (provider === "public") {
        const baseUrl = process.env.PUBLIC_API_BASE_URL;
        const key = process.env.PUBLIC_API_KEY;
        const defaultModel = process.env.PUBLIC_API_MODEL;
        if (!baseUrl) {
          return NextResponse.json({ error: "Public API is not configured on this server." }, { status: 400 });
        }
        const publicOpenAI = createOpenAI({ baseURL: baseUrl, apiKey: key || "no-key" });
        modelInstance = publicOpenAI(defaultModel || "default");
      } else if (provider === "openai") {
        const openai = createOpenAI({ apiKey });
        modelInstance = openai(model!);
      } else if (provider === "google") {
        const google = createGoogleGenerativeAI({ apiKey });
        modelInstance = google(model!);
      } else if (provider === "anthropic") {
        const anthropic = createAnthropic({ apiKey });
        modelInstance = anthropic(model!);
      } else if (provider === "vercel") {
        const gatewayModel = model as GatewayModelId;
        modelInstance = apiKey ? createGateway({ apiKey })(gatewayModel) : gatewayModel;
      } else {
        return NextResponse.json({ error: "Unsupported provider." }, { status: 400 });
      }
    } catch {
      return NextResponse.json(
        { error: "Failed to initialize LLM provider." },
        { status: 400 }
      );
    }

    const contentParts: Array<
      { type: "text"; text: string } | { type: "image"; image: Buffer | string; mimeType?: string }
    > = [];

    let textPrompt = `Write a highly targeted and professional job application email.\n\n`;
    textPrompt += `Applicant Name: ${user.name}\n`;
    textPrompt += `Applicant Email: ${user.email}\n\n`;

    if (user.resume) {
      textPrompt += `Applicant Resume:\n${user.resume}\n\n`;
    } else {
      textPrompt += `Note: No resume has been provided. Create placeholder text for resume details.\n\n`;
    }

    if (jobDescription) {
      textPrompt += `Job Details / Description:\n${jobDescription}\n\n`;
    }

    if (image) {
      textPrompt += `Please analyze the attached job poster image to extract the job title, company name, key requirements, and application email if present.\n\n`;
    }

    contentParts.push({ type: "text", text: textPrompt });

    if (image) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        contentParts.push({
          type: "image",
          image: Buffer.from(base64Data, "base64"),
          mimeType: mimeType,
        });
      } else {
        contentParts.push({
          type: "image",
          image: image,
        });
      }
    }

    const systemPrompt = `You are a professional career assistant. Your goal is to write a highly compelling, tailored job application email.
The email should be professional, concise, and highlight how the applicant's skills match the job requirements.
note: 
1.do not include ** , — , and other things that look linke ai generated content
2.email must contain my education and projects, and github link if available in resume

Format the output strictly as follows:
To: [Application email address if found, otherwise leave blank]
Subject: [Subject here, e.g., Application for [Role] - [Applicant Name]]

[Email Body here]`;

    const result = streamText({
      model: modelInstance,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: contentParts,
        },
      ],
    });

    return result.toTextStreamResponse();
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
