import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productIds = [
  "magneforce-balance",
  "miomax-complex",
  "zentor-venopulse",
  "betalong-amino-plus",
  "evomax-balance",
];

const tokenFiles = {
  primitives: "shared/design-system/colors/primitives.json",
  semantic: "shared/design-system/colors/semantic.json",
  typography: "shared/design-system/typography/typography.json",
  spacing: "shared/design-system/spacing/spacing.json",
  radius: "shared/design-system/radius/radius.json",
  effects: "shared/design-system/effects/effects.json",
  layout: "shared/design-system/layout/layout.json",
  index: "shared/design-system/tokens/index.json",
};

let passed = 0;

function check(name, condition) {
  if (!condition) {
    throw new Error(`FAIL: ${name}`);
  }

  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function walk(directory, visitor) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, visitor);
    } else {
      visitor(fullPath);
    }
  }
}

function hasPath(object, tokenPath) {
  return tokenPath.split(".").every((segment) => {
    if (object === null || typeof object !== "object" || !(segment in object)) {
      return false;
    }

    object = object[segment];
    return true;
  });
}

function collectStyles(node, prefix = "") {
  const styles = [];

  for (const [key, value] of Object.entries(node)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "fontFamily" in value) {
      styles.push([currentPath, value]);
    } else if (value && typeof value === "object") {
      styles.push(...collectStyles(value, currentPath));
    }
  }

  return styles;
}

function collectSemanticTokens(node, prefix = "") {
  const tokens = [];

  for (const [key, value] of Object.entries(node)) {
    if (key === "metadata") {
      continue;
    }

    const currentPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && "value" in value) {
      tokens.push([currentPath, value]);
    } else if (value && typeof value === "object") {
      tokens.push(...collectSemanticTokens(value, currentPath));
    }
  }

  return tokens;
}

function validateTokenKeys(node, location = "root") {
  for (const [key, value] of Object.entries(node)) {
    check(
      `token key ${location}.${key} uses lower camelCase or a numeric scale key`,
      /^(?:[a-z][A-Za-z0-9]*|[0-9]+)$/.test(key),
    );

    if (value && typeof value === "object" && !Array.isArray(value)) {
      validateTokenKeys(value, `${location}.${key}`);
    }
  }
}

const allJsonFiles = [];
walk(root, (filePath) => {
  if (path.extname(filePath) === ".json") {
    allJsonFiles.push(path.relative(root, filePath));
    readJson(path.relative(root, filePath));
  }
});
check("all project JSON files parse successfully", allJsonFiles.length > 0);

const tokens = Object.fromEntries(
  Object.entries(tokenFiles).map(([name, filePath]) => [name, readJson(filePath)]),
);
check(
  "all design-system token source files exist",
  Object.values(tokenFiles).every((filePath) => fs.existsSync(path.join(root, filePath))),
);

for (const name of ["primitives", "semantic", "typography", "spacing", "radius", "effects", "layout"]) {
  validateTokenKeys(tokens[name], name);
}

const expectedNeutralSteps = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
check(
  "neutral color scale is complete",
  expectedNeutralSteps.every((step) => /^#[0-9A-F]{6}$/.test(tokens.primitives.color.neutral[step])),
);
check(
  "required global color primitives are complete",
  ["white", "black", "success", "warning", "error", "info"].every(
    (name) => /^#[0-9A-F]{6}$/.test(tokens.primitives.color[name]),
  ),
);
check("global primitives contain no approved brand colors", tokens.primitives.metadata.brandColorsIncluded === false);

const semanticTokens = collectSemanticTokens(tokens.semantic);
check(
  "semantic token groups and names are complete",
  [
    "text.primary", "text.secondary", "text.subtle", "text.inverse", "text.brand",
    "text.success", "text.warning", "text.error", "surface.background", "surface.default",
    "surface.subtle", "surface.elevated", "surface.brand", "border.default",
    "border.subtle", "border.strong", "border.brand",
  ].every((name) => semanticTokens.some(([tokenName]) => tokenName === name)),
);

for (const [name, token] of semanticTokens) {
  const reference = /^\{([^}]+)\}$/.exec(token.value);
  check(`semantic token ${name} has a reference value`, reference !== null);

  if (reference[1].startsWith("color.")) {
    check(`semantic token ${name} resolves to a primitive`, hasPath(tokens.primitives, reference[1]));
  } else {
    check(`semantic token ${name} references a brand color`, reference[1].startsWith("brand.colors."));
    const fallback = /^\{([^}]+)\}$/.exec(token.fallback ?? "");
    check(
      `semantic brand token ${name} has a valid primitive fallback`,
      fallback !== null && fallback[1].startsWith("color.") && hasPath(tokens.primitives, fallback[1]),
    );
    check(`semantic brand token ${name} marks its fallback temporary`, token.status === "temporary-fallback");
  }
}

const typographyStyles = collectStyles(tokens.typography.styles);
const requiredTypography = [
  "display.large", "display.medium", "heading.h1", "heading.h2", "heading.h3",
  "subheading.default", "body.large", "body.default", "body.small", "body.strong",
  "caption", "label",
];
check(
  "required typography scale is complete",
  requiredTypography.every((name) => typographyStyles.some(([styleName]) => styleName === name)),
);
check(
  "every typography style uses Inter and defines all required properties",
  typographyStyles.every(([, style]) =>
    style.fontFamily === "Inter"
    && Number.isFinite(style.fontSize)
    && Number.isFinite(style.fontWeight)
    && Number.isFinite(style.lineHeight)
    && Number.isFinite(style.letterSpacing)),
);
check(
  "typography does not fall below the recommended 36 px source size",
  typographyStyles.every(([, style]) => style.fontSize >= 36),
);
check(
  "typography role weights are correct",
  tokens.typography.styles.display.large.fontWeight === 800
    && tokens.typography.styles.display.medium.fontWeight === 800
    && ["h1", "h2", "h3"].every((name) => tokens.typography.styles.heading[name].fontWeight === 700)
    && tokens.typography.styles.subheading.default.fontWeight === 600
    && ["large", "default", "small"].every((name) => tokens.typography.styles.body[name].fontWeight === 400)
    && tokens.typography.styles.body.strong.fontWeight === 600
    && tokens.typography.styles.caption.fontWeight === 400
    && tokens.typography.styles.label.fontWeight === 500,
);

const activeTypographyText = JSON.stringify(tokens.typography).toLowerCase();
check("no disallowed font is active in typography tokens", !activeTypographyText.includes("oswald"));

check(
  "spacing scale is complete",
  [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96].every(
    (value) => tokens.spacing.spacing[String(value)] === value,
  ),
);
check(
  "spacing usage references resolve",
  JSON.stringify(tokens.spacing.usage).match(/\{spacing\.\d+\}/g).every((reference) =>
    hasPath(tokens.spacing, reference.slice(1, -1))),
);
check(
  "radius scale is complete",
  ["none", "small", "medium", "large", "xl", "twoXl", "full"].every(
    (name) => Number.isFinite(tokens.radius.radius[name])),
);
check(
  "effect scale is complete",
  ["small", "medium", "large"].every((name) => typeof tokens.effects.shadow[name] === "string"),
);

const verticalCard = tokens.layout.formats.verticalCard;
check(
  "vertical card canvas is 1080 × 1920 with a 9:16 ratio",
  verticalCard.canvas.width === 1080
    && verticalCard.canvas.height === 1920
    && verticalCard.canvas.aspectRatio === "9:16",
);
check(
  "recommended layout areas remain inside safe margins",
  Object.values(verticalCard.areas).every((area) =>
    area.x >= verticalCard.safeMargins.left
    && area.y >= verticalCard.safeMargins.top
    && area.x + area.width <= verticalCard.canvas.width - verticalCard.safeMargins.right
    && area.y + area.height <= verticalCard.canvas.height - verticalCard.safeMargins.bottom),
);
check(
  "layout recommendations are explicitly provisional",
  verticalCard.status === "initial-recommendation"
    && verticalCard.safeMargins.status === "initial-recommendation",
);

const sourceRoot = path.dirname(path.join(root, tokenFiles.index));
check(
  "central token index resolves every declared source",
  Object.values(tokens.index.sources).every((source) => fs.existsSync(path.resolve(sourceRoot, source))),
);

for (const productId of productIds) {
  const brand = readJson(`brands/${productId}/design/brand-tokens.json`);
  check(
    `${productId} brand color structure is complete`,
    ["primary", "secondary", "accent", "background", "text"].every((name) => name in brand.colors),
  );
  check(
    `${productId} preserves unknown colors and gradient as null`,
    [...Object.values(brand.colors), brand.gradient].every((value) => value === null),
  );
  check(
    `${productId} inherits global tokens with fallback behavior`,
    brand.inheritance.extends === "shared/design-system/tokens/index.json"
      && brand.inheritance.strategy === "deep-merge"
      && brand.inheritance.nullBehavior === "use-semantic-fallback"
      && brand.status === "pending-brand-validation",
  );
}

const tsconfig = readJson("tsconfig.json");
check(
  "TypeScript strict mode and JSON module resolution are enabled",
  tsconfig.compilerOptions.strict === true && tsconfig.compilerOptions.resolveJsonModule === true,
);

const activeDocumentation = [
  "AGENTS.md",
  "docs/architecture.md",
  "docs/design-system.md",
].map((filePath) => fs.readFileSync(path.join(root, filePath), "utf8").toLowerCase()).join("\n");
check("active design documentation specifies no disallowed font", !activeDocumentation.includes("oswald"));

console.log(`Design-system validation complete: ${passed} passed, 0 failed.`);
