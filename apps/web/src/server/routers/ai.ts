import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { generateCrmSchema } from "@/lib/ai/generate-crm";
import { persistGeneratedCrm } from "../ai/persist-crm";

export const aiRouter = router({
  generateCrm: protectedProcedure
    .input(
      z.object({
        description: z.string().trim().min(10).max(500),
        businessName: z.string().trim().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let schema;
      try {
        schema = await generateCrmSchema(input.description);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to generate CRM schema.",
        });
      }

      const businessName = input.businessName || input.description.slice(0, 40);
      const organization = await persistGeneratedCrm(ctx.userId, businessName, schema);
      return { organizationId: organization.id };
    }),
});
