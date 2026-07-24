import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const fieldSchema = z.object({
  name: z.string(),
  type: z.enum([
    "TEXT",
    "LONG_TEXT",
    "NUMBER",
    "CURRENCY",
    "BOOLEAN",
    "DATE",
    "DATETIME",
    "EMAIL",
    "PHONE",
    "URL",
    "SELECT",
    "MULTI_SELECT",
    "RELATION",
  ]),
  choices: z.array(z.string()).optional(),
  relationTarget: z.string().optional(),
  isRequired: z.boolean().optional(),
});

const objectSchema = z.object({
  name: z.string(),
  icon: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
});

export const generatedCrmSchema = z.object({
  objects: z.array(objectSchema).min(1),
});

export type GeneratedCrm = z.infer<typeof generatedCrmSchema>;

const CREATE_CRM_TOOL: Anthropic.Tool = {
  name: "create_crm_schema",
  description:
    "Define the objects (tables) and fields for a custom CRM tailored to a described business.",
  input_schema: {
    type: "object",
    properties: {
      objects: {
        type: "array",
        description:
          "The tables this business needs. Always include a customer/contact database and a sales pipeline or job-tracking object with a SELECT stage field. Where relevant, also include objects covering quotes/estimates, job or appointment scheduling, invoices, payments, and employees.",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Plural display name, e.g. 'Jobs'" },
            icon: { type: "string", description: "A single emoji representing this object" },
            fields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: {
                    type: "string",
                    enum: [
                      "TEXT",
                      "LONG_TEXT",
                      "NUMBER",
                      "CURRENCY",
                      "BOOLEAN",
                      "DATE",
                      "DATETIME",
                      "EMAIL",
                      "PHONE",
                      "URL",
                      "SELECT",
                      "MULTI_SELECT",
                      "RELATION",
                    ],
                  },
                  choices: {
                    type: "array",
                    items: { type: "string" },
                    description: "Required for SELECT and MULTI_SELECT fields.",
                  },
                  relationTarget: {
                    type: "string",
                    description:
                      "For RELATION fields only: the exact `name` of another object in this same schema to link to.",
                  },
                  isRequired: { type: "boolean" },
                },
                required: ["name", "type"],
              },
            },
          },
          required: ["name", "fields"],
        },
      },
    },
    required: ["objects"],
  },
};

const SYSTEM_PROMPT = `You design data models for ValensCRM, a no-code CRM builder. Given a one-sentence description of a small business, call the create_crm_schema tool to define the objects and fields that business needs.

Rules:
- Always include a customer/contact object (e.g. "Customers" or "Contacts") with fields like name, email, phone, address.
- Always include a pipeline-style object (e.g. "Jobs", "Deals", or "Projects") with a SELECT field named "Status" whose choices are realistic stages for this business.
- Every object's first field must be a TEXT field named "Name" that identifies the record.
- Add objects for quotes/estimates, invoices, payments, or employees only when they clearly fit the business described.
- Use RELATION fields to connect related objects (e.g. a Job links to a Customer) by setting relationTarget to the other object's exact name.
- Keep it to 3-6 objects and 4-8 fields per object. Favor practical, everyday fields a small business owner would actually use.`;

export async function generateCrmSchema(description: string): Promise<GeneratedCrm> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your environment to enable the AI CRM Builder.",
    );
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [CREATE_CRM_TOOL],
    tool_choice: { type: "tool", name: "create_crm_schema" },
    messages: [{ role: "user", content: description }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("The AI didn't return a CRM schema. Please try again.");
  }

  return generatedCrmSchema.parse(toolUse.input);
}
