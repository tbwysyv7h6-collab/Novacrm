import { prisma, type Prisma, type FieldType } from "@novacrm/db";
import type { GeneratedCrm } from "@/lib/ai/generate-crm";
import { slugify, randomSuffix } from "@/lib/slug";

function uniqueKey(used: Set<string>, base: string, fallback: string): string {
  const root = slugify(base) || fallback;
  let key = root;
  let i = 1;
  while (used.has(key)) {
    i += 1;
    key = `${root}-${i}`;
  }
  used.add(key);
  return key;
}

async function uniqueOrgSlug(base: string): Promise<string> {
  const root = slugify(base) || "workspace";
  let slug = root;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${root}-${randomSuffix()}`;
  }
  return slug;
}

export async function persistGeneratedCrm(
  userId: string,
  businessName: string,
  schema: GeneratedCrm,
) {
  const slug = await uniqueOrgSlug(businessName);

  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: businessName,
        slug,
        memberships: { create: { userId, role: "OWNER" } },
      },
    });

    const usedObjectKeys = new Set<string>();
    const objectIdByName = new Map<string, string>();
    const createdObjects: { id: string; name: string; fields: { apiName: string; type: FieldType }[] }[] =
      [];

    for (const [index, objectDef] of schema.objects.entries()) {
      const apiName = uniqueKey(usedObjectKeys, objectDef.name, `object-${index}`);
      const object = await tx.crmObject.create({
        data: {
          organizationId: organization.id,
          name: objectDef.name,
          apiName,
          icon: objectDef.icon,
          isSystem: true,
          position: index,
        },
      });
      objectIdByName.set(objectDef.name.toLowerCase(), object.id);

      const usedFieldKeys = new Set<string>();
      const createdFields: { apiName: string; type: FieldType }[] = [];

      for (const [fieldIndex, fieldDef] of objectDef.fields.entries()) {
        if (fieldDef.type === "RELATION") continue; // resolved in a second pass once all objects exist
        const fieldApiName = uniqueKey(usedFieldKeys, fieldDef.name, `field-${fieldIndex}`);
        const options =
          fieldDef.type === "SELECT" || fieldDef.type === "MULTI_SELECT"
            ? ({ choices: fieldDef.choices ?? [] } as Prisma.InputJsonValue)
            : undefined;

        await tx.crmField.create({
          data: {
            objectId: object.id,
            name: fieldDef.name,
            apiName: fieldApiName,
            type: fieldDef.type,
            isRequired: fieldDef.isRequired ?? false,
            options,
            position: fieldIndex,
          },
        });
        createdFields.push({ apiName: fieldApiName, type: fieldDef.type });
      }

      createdObjects.push({ id: object.id, name: objectDef.name, fields: createdFields });
    }

    // Second pass: resolve RELATION fields now that every object has an id.
    for (const [objIndex, objectDef] of schema.objects.entries()) {
      const object = createdObjects[objIndex];
      const usedFieldKeys = new Set(object.fields.map((f) => f.apiName));

      for (const [fieldIndex, fieldDef] of objectDef.fields.entries()) {
        if (fieldDef.type !== "RELATION" || !fieldDef.relationTarget) continue;
        const targetId = objectIdByName.get(fieldDef.relationTarget.toLowerCase());
        if (!targetId) continue;

        const fieldApiName = uniqueKey(usedFieldKeys, fieldDef.name, `field-${fieldIndex}`);
        await tx.crmField.create({
          data: {
            objectId: object.id,
            name: fieldDef.name,
            apiName: fieldApiName,
            type: "RELATION",
            isRequired: fieldDef.isRequired ?? false,
            options: { targetObjectId: targetId } as Prisma.InputJsonValue,
            position: object.fields.length + fieldIndex,
          },
        });
        object.fields.push({ apiName: fieldApiName, type: "RELATION" });
      }
    }

    // Views: every object gets a table; pipeline-style/date-driven objects also get a board/calendar.
    for (const object of createdObjects) {
      await tx.crmView.create({
        data: { objectId: object.id, name: "All records", type: "TABLE", position: 0 },
      });

      const statusField = object.fields.find((f) => f.type === "SELECT");
      if (statusField) {
        await tx.crmView.create({
          data: {
            objectId: object.id,
            name: "Board",
            type: "KANBAN",
            config: { groupByFieldApiName: statusField.apiName } as Prisma.InputJsonValue,
            position: 1,
          },
        });
      }

      const dateField = object.fields.find((f) => f.type === "DATE" || f.type === "DATETIME");
      if (dateField) {
        await tx.crmView.create({
          data: {
            objectId: object.id,
            name: "Calendar",
            type: "CALENDAR",
            config: { dateFieldApiName: dateField.apiName } as Prisma.InputJsonValue,
            position: 2,
          },
        });
      }
    }

    return organization;
  });
}
