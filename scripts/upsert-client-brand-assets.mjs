import fs from "node:fs";
import path from "node:path";

const dryRun = process.argv.includes("--dry-run");
const bucket = "client-campaign-images";

const clientBrandData = [
  {
    name: "Kodak Alaris",
    website: "https://www.kodakalaris.com/",
    industry: "Document capture and information management software",
    assetPath: "src/assets/kodak-alaris.png",
    contentType: "image/png",
  },
  {
    name: "Iron Mountain",
    website: "https://www.ironmountain.com/",
    industry: "Information management, records management, and data center services",
    assetPath: "src/assets/iron-mountain.png",
    contentType: "image/png",
  },
  {
    name: "Integrated Research",
    website: "https://www.ir.com/",
    industry: "Observability and performance management software",
    assetPath: "src/assets/integrated-research.png",
    contentType: "image/png",
  },
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(fs.readFileSync(filePath, "utf8")
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#") && line.includes("="))
    .map(line => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
    }));
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase URL or service role key.");
}

const restHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function normalizeKey(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function sanitizeStorageName(value = "image") {
  return String(value || "image")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

async function rest(pathName, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathName}`, {
    ...options,
    headers: { ...restHeaders, ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathName} failed ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function uploadAsset(client, asset) {
  const fileName = path.basename(asset.assetPath);
  const storagePath = `${client.organization_id}/clients/${client.id}/${Date.now()}-${sanitizeStorageName(fileName)}`;
  if (dryRun) {
    return {
      imagePath: storagePath,
      imageUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`,
      imageName: fileName,
    };
  }

  const bytes = fs.readFileSync(asset.assetPath);
  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": asset.contentType,
      "Cache-Control": "3600",
      "x-upsert": "true",
    },
    body: bytes,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Upload ${fileName} failed ${response.status}: ${text}`);
  }
  return {
    imagePath: storagePath,
    imageUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`,
    imageName: fileName,
  };
}

const clientNames = clientBrandData.map(client => `"${client.name.replace(/"/g, '\\"')}"`).join(",");
const clients = await rest(`clients?select=id,organization_id,name,website,industry,metadata&name=in.(${clientNames})`);
const clientsByName = new Map(clients.map(client => [normalizeKey(client.name), client]));

const results = [];
for (const asset of clientBrandData) {
  if (!fs.existsSync(asset.assetPath)) {
    throw new Error(`Missing logo asset: ${asset.assetPath}`);
  }
  const client = clientsByName.get(normalizeKey(asset.name));
  if (!client) {
    results.push({ name: asset.name, status: "missing-client" });
    continue;
  }
  const image = await uploadAsset(client, asset);
  const metadata = {
    ...(client.metadata || {}),
    imageUrl: image.imageUrl,
    imagePath: image.imagePath,
    imageName: image.imageName,
    websiteSource: "official website",
    industrySource: "official website",
  };
  if (!dryRun) {
    await rest(`clients?id=eq.${client.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        website: asset.website,
        industry: asset.industry,
        metadata,
      }),
    });
  }
  results.push({
    name: asset.name,
    status: dryRun ? "dry-run" : "updated",
    website: asset.website,
    industry: asset.industry,
    imagePath: image.imagePath,
    imageName: image.imageName,
  });
}

const verified = await rest(`clients?select=name,website,industry,metadata&name=in.(${clientNames})`);
console.log(JSON.stringify({ dryRun, results, verified }, null, 2));
