import type { Context } from "hono";
import { prisma } from "@/lib/db";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(value: string, max: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function baseUrl(c: Context): string {
  const proto =
    c.req.header("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  const host =
    c.req.header("x-forwarded-host")?.split(",")[0]?.trim() ??
    c.req.header("host") ??
    "localhost";
  return `${proto}://${host}`;
}

export async function injectPreviewTags(
  c: Context,
  html: string,
): Promise<string> {
  const match = c.req.path.match(/^\/houses\/([^/]+)$/);
  if (!match) return html;

  const house = await prisma.house.findUnique({
    where: { id: match[1] },
    include: { scores: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!house) return html;

  const root = baseUrl(c);
  const title = house.title ?? house.address ?? house.sourceFileName ?? "Huis";
  const score = house.scores[0];
  const scoreValue = score ? score.total.toFixed(1) : null;

  const ogTitle = scoreValue ? `Score ${scoreValue} · ${title}` : title;
  const ogDescription =
    truncate(score?.rationale ?? house.description ?? "", 200) ||
    "Bekijk dit huis op Houser";
  const ogImage = house.imagePath
    ? `${root}${house.imagePath}`
    : `${root}/logo.svg`;

  const tags = [
    `<meta property="og:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    `<meta property="og:url" content="${escapeHtml(`${root}/houses/${house.id}`)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Houser" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(ogDescription)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
  ].join("\n    ");

  return html.replace("</head>", `    ${tags}\n  </head>`);
}
