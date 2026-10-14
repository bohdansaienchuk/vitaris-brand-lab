import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const requireLocalAssets = process.argv.includes("--require-local-assets");
const supportedExtensions = new Set(["svg", "png", "jpg", "jpeg", "webp", "pdf"]);
const allowedTypes = new Set([
  "corporate-logo",
  "product-logo",
  "product-packaging",
  "product-mockup",
  "illustration",
  "background",
  "other",
]);
const manifestSpecs = [
  { file: "shared/assets/asset-manifest.json", scope: "shared", base: root, requiredPrefix: "shared/assets/" },
  ...[
    "magneforce-balance",
    "miomax-complex",
    "zentor-venopulse",
    "betalong-amino-plus",
    "evomax-balance",
  ].map((productId) => ({
    file: `brands/${productId}/assets/asset-manifest.json`,
    scope: productId,
    base: path.join(root, "brands", productId),
    requiredPrefix: "assets/",
  })),
];

let passed = 0;
function check(name, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${name}`);
  }
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

function walk(directory, visitor) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, visitor);
    else visitor(fullPath);
  }
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function detectFormat(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { format: "png", mimeType: "image/png" };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { format: "jpg", mimeType: "image/jpeg" };
  }
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("ascii") === "%PDF") {
    return { format: "pdf", mimeType: "application/pdf" };
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return { format: "webp", mimeType: "image/webp" };
  }
  const textStart = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("utf8").replace(/^\uFEFF/, "");
  if (/<svg(?:\s|>)/i.test(textStart)) {
    return { format: "svg", mimeType: "image/svg+xml" };
  }
  return { format: null, mimeType: null };
}

function readPngMetadata(buffer) {
  if (buffer.length < 26 || buffer.subarray(12, 16).toString("ascii") !== "IHDR") return null;
  const colorTypes = { 0: "Grayscale", 2: "RGB", 3: "Indexed", 4: "GrayscaleAlpha", 6: "RGBA" };
  const colorType = buffer[25];
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    colorMode: colorTypes[colorType] ?? null,
    hasTransparency: colorType === 4 || colorType === 6,
  };
}

function readJpegMetadata(buffer) {
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    const marker = buffer[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break;
    if (offset + 2 > buffer.length) break;
    const length = buffer.readUInt16BE(offset);
    if (sofMarkers.has(marker) && offset + 8 < buffer.length) {
      const components = buffer[offset + 7];
      return {
        width: buffer.readUInt16BE(offset + 5),
        height: buffer.readUInt16BE(offset + 3),
        colorMode: components === 1 ? "Grayscale" : components === 3 ? "RGB" : components === 4 ? "CMYK" : null,
        hasTransparency: false,
      };
    }
    if (length < 2) break;
    offset += length;
  }
  return null;
}

function readSvgMetadata(buffer) {
  const text = buffer.toString("utf8");
  const rootMatch = text.match(/<svg\b[^>]*>/i);
  if (!rootMatch) return null;
  const attribute = (name) => {
    const match = rootMatch[0].match(new RegExp(`\\s${name}=["']([^"']+)["']`, "i"));
    return match ? match[1] : null;
  };
  const viewBox = attribute("viewBox");
  const width = attribute("width");
  const height = attribute("height");
  return {
    width: width === null ? null : Number.parseFloat(width),
    height: height === null ? null : Number.parseFloat(height),
    viewBox,
    colorMode: "vector",
    hasTransparency: true,
    unsafe:
      /<script\b|<foreignObject\b|\son[a-z]+\s*=|javascript:|<!DOCTYPE|<!ENTITY/i.test(text)
      || /(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/|data:|file:)/i.test(text)
      || /@import|url\s*\(\s*["']?(?:https?:|\/\/|data:|file:)/i.test(text),
  };
}

const allJsonFiles = [];
walk(root, (filePath) => {
  if (path.extname(filePath).toLowerCase() === ".json") {
    JSON.parse(fs.readFileSync(filePath, "utf8"));
    allJsonFiles.push(filePath);
  }
});
check("all project JSON files are valid", allJsonFiles.length > 0);
check("all six asset manifests exist", manifestSpecs.every(({ file }) => fs.existsSync(path.join(root, file))));

const records = [];
const ids = new Set();
const manifestPaths = new Set();
let pathsAreRelative = true;
let pathsStayInScope = true;
let filesExist = true;
let checksumsMatch = true;
let sizesMatch = true;
let signaturesMatch = true;
let metadataMatch = true;
let svgFilesAreSafe = true;
let statusesAreUnapproved = true;
let classificationsAreValid = true;
let auditCountsMatch = true;
let missingLocalAssets = 0;

for (const spec of manifestSpecs) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, spec.file), "utf8"));
  const permitsLocalOnlyAssets = manifest.distribution?.status === "local-only-unconfirmed-rights"
    && manifest.distribution?.trackedInGit === false;
  auditCountsMatch &&= manifest.audit?.assetCount === manifest.assets?.length;
  if (spec.scope !== "shared") {
    auditCountsMatch &&= manifest.product_id === spec.scope;
  } else {
    auditCountsMatch &&= manifest.scope === "shared";
  }

  for (const asset of manifest.assets ?? []) {
    if (ids.has(asset.id)) throw new Error(`Duplicate asset ID: ${asset.id}`);
    ids.add(asset.id);
    classificationsAreValid &&= allowedTypes.has(asset.type);
    statusesAreUnapproved &&= asset.status === "needs-review" && asset.quality?.approvalStatus === "unconfirmed";

    const normalizedAssetPath = asset.path.replaceAll("\\", "/");
    pathsAreRelative &&= !path.isAbsolute(asset.path)
      && normalizedAssetPath === asset.path
      && !normalizedAssetPath.split("/").includes("..")
      && normalizedAssetPath.startsWith(spec.requiredPrefix);

    const resolvedPath = path.resolve(spec.base, asset.path);
    const recordPath = path.relative(root, resolvedPath).split(path.sep).join("/");
    const relativeToBase = path.relative(spec.base, resolvedPath);
    pathsStayInScope &&= relativeToBase !== ".."
      && !relativeToBase.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relativeToBase);

    records.push({ ...asset, resolvedPath, projectRelativePath: recordPath });

    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
      if (permitsLocalOnlyAssets && !requireLocalAssets) {
        missingLocalAssets += 1;
      } else {
        filesExist = false;
      }
      continue;
    }

    const realPath = fs.realpathSync(resolvedPath);
    const realBase = fs.realpathSync(spec.base);
    pathsStayInScope &&= realPath === realBase || realPath.startsWith(`${realBase}${path.sep}`);

    const projectRelativePath = path.relative(root, resolvedPath).split(path.sep).join("/");
    manifestPaths.add(projectRelativePath);
    const buffer = fs.readFileSync(resolvedPath);
    const detected = detectFormat(buffer);
    const normalizedFormat = asset.format === "jpeg" ? "jpg" : asset.format;
    signaturesMatch &&= detected.format === normalizedFormat && detected.mimeType === asset.metadata?.mimeType;
    checksumsMatch &&= sha256(resolvedPath) === asset.metadata?.sha256;
    sizesMatch &&= buffer.length === asset.metadata?.sizeBytes;
    classificationsAreValid &&= supportedExtensions.has(path.extname(resolvedPath).slice(1).toLowerCase());

    let technical = null;
    if (detected.format === "png") technical = readPngMetadata(buffer);
    if (detected.format === "jpg") technical = readJpegMetadata(buffer);
    if (detected.format === "svg") technical = readSvgMetadata(buffer);

    if (technical) {
      metadataMatch &&= technical.width === asset.metadata.width
        && technical.height === asset.metadata.height
        && technical.colorMode === asset.metadata.colorMode
        && technical.hasTransparency === asset.metadata.hasTransparency;
      if (technical.viewBox !== undefined) metadataMatch &&= technical.viewBox === asset.metadata.viewBox;
      if (technical.unsafe !== undefined) svgFilesAreSafe &&= technical.unsafe === false;
    }

    if (asset.metadata.width !== null && asset.metadata.height !== null) {
      metadataMatch &&= Math.abs(asset.metadata.aspectRatio - asset.metadata.width / asset.metadata.height) < 0.000001;
    } else if (asset.metadata.viewBox) {
      const parts = asset.metadata.viewBox.trim().split(/[\s,]+/).map(Number);
      metadataMatch &&= parts.length === 4
        && parts.every(Number.isFinite)
        && Math.abs(asset.metadata.aspectRatio - parts[2] / parts[3]) < 0.000001;
    }

  }
}

check("manifest audit counts and scopes are correct", auditCountsMatch);
check("asset IDs are globally unique", ids.size === records.length);
check("asset classifications are valid", classificationsAreValid);
check("all approval statuses remain unconfirmed", statusesAreUnapproved);
check("all manifest paths are normalized relative paths", pathsAreRelative);
check("all resolved and real paths stay inside their allowed scope", pathsStayInScope);
check(
  requireLocalAssets ? "every manifest path exists in strict local-assets mode" : "every required manifest path exists",
  filesExist,
);
check("file signatures, extensions, formats, and MIME types agree", signaturesMatch);
check("manifest byte sizes match actual files", sizesMatch);
check("manifest SHA-256 checksums match actual files", checksumsMatch);
check("raster and SVG technical metadata match actual files", metadataMatch);
check("SVG files contain no detected active or external content", svgFilesAreSafe);

const scannedPaths = new Set();
for (const assetRoot of ["shared/assets", ...manifestSpecs.slice(1).map(({ scope }) => `brands/${scope}/assets`)]) {
  walk(path.join(root, assetRoot), (filePath) => {
    const extension = path.extname(filePath).slice(1).toLowerCase();
    if (supportedExtensions.has(extension)) {
      scannedPaths.add(path.relative(root, filePath).split(path.sep).join("/"));
    }
  });
}
check(
  "every present supported asset file is represented exactly once in a manifest",
  [...scannedPaths].every((assetPath) => manifestPaths.has(assetPath)),
);

const hashes = new Map();
for (const record of records) {
  const hash = record.metadata.sha256;
  hashes.set(hash, [...(hashes.get(hash) ?? []), record.projectRelativePath]);
}
const duplicateGroups = [...hashes.values()].filter((paths) => paths.length > 1);
check("no byte-identical duplicate assets exist", duplicateGroups.length === 0);
check(
  "no asset exceeds 50 MB",
  records.every(({ metadata }) => metadata.sizeBytes <= 50 * 1024 * 1024),
);

console.log(`Asset validation complete: ${passed} passed, 0 failed.`);
console.log(`Assets: ${records.length}; duplicates: ${duplicateGroups.length}; over 50 MB: 0.`);
if (missingLocalAssets > 0) {
  console.log(`Local-only assets absent: ${missingLocalAssets}. Run npm run validate:assets:strict when originals are available.`);
}
