var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// plugins/visual-editor/vite-plugin-react-inline-editor.js
var vite_plugin_react_inline_editor_exports = {};
__export(vite_plugin_react_inline_editor_exports, {
  default: () => inlineEditPlugin
});
import path from "path";
import { fileURLToPath } from "url";
import { parse } from "file:///C:/app-agarch-ar/node_modules/@babel/parser/lib/index.js";
import traverseBabel from "file:///C:/app-agarch-ar/node_modules/@babel/traverse/lib/index.js";
import generate from "file:///C:/app-agarch-ar/node_modules/@babel/generator/lib/index.js";
import * as t from "file:///C:/app-agarch-ar/node_modules/@babel/types/lib/index.js";
import fs from "fs";
function parseEditId(editId) {
  const parts = editId.split(":");
  if (parts.length < 3) {
    return null;
  }
  const column = parseInt(parts.at(-1), 10);
  const line = parseInt(parts.at(-2), 10);
  const filePath = parts.slice(0, -2).join(":");
  if (!filePath || isNaN(line) || isNaN(column)) {
    return null;
  }
  return { filePath, line, column };
}
function checkTagNameEditable(openingElementNode, editableTagsList) {
  if (!openingElementNode || !openingElementNode.name)
    return false;
  const nameNode = openingElementNode.name;
  if (nameNode.type === "JSXIdentifier" && editableTagsList.includes(nameNode.name)) {
    return true;
  }
  if (nameNode.type === "JSXMemberExpression" && nameNode.property && nameNode.property.type === "JSXIdentifier" && editableTagsList.includes(nameNode.property.name)) {
    return true;
  }
  return false;
}
function validateImageSrc(openingNode) {
  if (!openingNode || !openingNode.name || openingNode.name.name !== "img") {
    return { isValid: true, reason: null };
  }
  const hasPropsSpread = openingNode.attributes.some(
    (attr) => t.isJSXSpreadAttribute(attr) && attr.argument && t.isIdentifier(attr.argument) && attr.argument.name === "props"
  );
  if (hasPropsSpread) {
    return { isValid: false, reason: "props-spread" };
  }
  const srcAttr = openingNode.attributes.find(
    (attr) => t.isJSXAttribute(attr) && attr.name && attr.name.name === "src"
  );
  if (!srcAttr) {
    return { isValid: false, reason: "missing-src" };
  }
  if (!t.isStringLiteral(srcAttr.value)) {
    return { isValid: false, reason: "dynamic-src" };
  }
  if (!srcAttr.value.value || srcAttr.value.value.trim() === "") {
    return { isValid: false, reason: "empty-src" };
  }
  return { isValid: true, reason: null };
}
function inlineEditPlugin() {
  return {
    name: "vite-inline-edit-plugin",
    enforce: "pre",
    transform(code, id) {
      if (!/\.(jsx|tsx)$/.test(id) || !id.startsWith(VITE_PROJECT_ROOT) || id.includes("node_modules")) {
        return null;
      }
      const relativeFilePath = path.relative(VITE_PROJECT_ROOT, id);
      const webRelativeFilePath = relativeFilePath.split(path.sep).join("/");
      try {
        const babelAst = parse(code, {
          sourceType: "module",
          plugins: ["jsx", "typescript"],
          errorRecovery: true
        });
        let attributesAdded = 0;
        traverseBabel.default(babelAst, {
          enter(path3) {
            if (path3.isJSXOpeningElement()) {
              const openingNode = path3.node;
              const elementNode = path3.parentPath.node;
              if (!openingNode.loc) {
                return;
              }
              const alreadyHasId = openingNode.attributes.some(
                (attr) => t.isJSXAttribute(attr) && attr.name.name === "data-edit-id"
              );
              if (alreadyHasId) {
                return;
              }
              const isCurrentElementEditable = checkTagNameEditable(openingNode, EDITABLE_HTML_TAGS);
              if (!isCurrentElementEditable) {
                return;
              }
              const imageValidation = validateImageSrc(openingNode);
              if (!imageValidation.isValid) {
                const disabledAttribute = t.jsxAttribute(
                  t.jsxIdentifier("data-edit-disabled"),
                  t.stringLiteral("true")
                );
                openingNode.attributes.push(disabledAttribute);
                attributesAdded++;
                return;
              }
              let shouldBeDisabledDueToChildren = false;
              if (t.isJSXElement(elementNode) && elementNode.children) {
                const hasPropsSpread = openingNode.attributes.some(
                  (attr) => t.isJSXSpreadAttribute(attr) && attr.argument && t.isIdentifier(attr.argument) && attr.argument.name === "props"
                );
                const hasDynamicChild = elementNode.children.some(
                  (child) => t.isJSXExpressionContainer(child)
                );
                if (hasDynamicChild || hasPropsSpread) {
                  shouldBeDisabledDueToChildren = true;
                }
              }
              if (!shouldBeDisabledDueToChildren && t.isJSXElement(elementNode) && elementNode.children) {
                const hasEditableJsxChild = elementNode.children.some((child) => {
                  if (t.isJSXElement(child)) {
                    return checkTagNameEditable(child.openingElement, EDITABLE_HTML_TAGS);
                  }
                  return false;
                });
                if (hasEditableJsxChild) {
                  shouldBeDisabledDueToChildren = true;
                }
              }
              if (shouldBeDisabledDueToChildren) {
                const disabledAttribute = t.jsxAttribute(
                  t.jsxIdentifier("data-edit-disabled"),
                  t.stringLiteral("true")
                );
                openingNode.attributes.push(disabledAttribute);
                attributesAdded++;
                return;
              }
              if (t.isJSXElement(elementNode) && elementNode.children && elementNode.children.length > 0) {
                let hasNonEditableJsxChild = false;
                for (const child of elementNode.children) {
                  if (t.isJSXElement(child)) {
                    if (!checkTagNameEditable(child.openingElement, EDITABLE_HTML_TAGS)) {
                      hasNonEditableJsxChild = true;
                      break;
                    }
                  }
                }
                if (hasNonEditableJsxChild) {
                  const disabledAttribute = t.jsxAttribute(
                    t.jsxIdentifier("data-edit-disabled"),
                    t.stringLiteral("true")
                  );
                  openingNode.attributes.push(disabledAttribute);
                  attributesAdded++;
                  return;
                }
              }
              let currentAncestorCandidatePath = path3.parentPath.parentPath;
              while (currentAncestorCandidatePath) {
                const ancestorJsxElementPath = currentAncestorCandidatePath.isJSXElement() ? currentAncestorCandidatePath : currentAncestorCandidatePath.findParent((p) => p.isJSXElement());
                if (!ancestorJsxElementPath) {
                  break;
                }
                if (checkTagNameEditable(ancestorJsxElementPath.node.openingElement, EDITABLE_HTML_TAGS)) {
                  return;
                }
                currentAncestorCandidatePath = ancestorJsxElementPath.parentPath;
              }
              const line = openingNode.loc.start.line;
              const column = openingNode.loc.start.column + 1;
              const editId = `${webRelativeFilePath}:${line}:${column}`;
              const idAttribute = t.jsxAttribute(
                t.jsxIdentifier("data-edit-id"),
                t.stringLiteral(editId)
              );
              openingNode.attributes.push(idAttribute);
              attributesAdded++;
            }
          }
        });
        if (attributesAdded > 0) {
          const generateFunction = generate.default || generate;
          const output = generateFunction(babelAst, {
            sourceMaps: true,
            sourceFileName: webRelativeFilePath
          }, code);
          return { code: output.code, map: output.map };
        }
        return null;
      } catch (error) {
        console.error(`[vite][visual-editor] Error transforming ${id}:`, error);
        return null;
      }
    },
    // Updates source code based on the changes received from the client
    configureServer(server) {
      server.middlewares.use("/api/apply-edit", async (req, res, next) => {
        if (req.method !== "POST")
          return next();
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", async () => {
          var _a;
          let absoluteFilePath = "";
          try {
            const { editId, newFullText } = JSON.parse(body);
            if (!editId || typeof newFullText === "undefined") {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Missing editId or newFullText" }));
            }
            const parsedId = parseEditId(editId);
            if (!parsedId) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Invalid editId format (filePath:line:column)" }));
            }
            const { filePath, line, column } = parsedId;
            absoluteFilePath = path.resolve(VITE_PROJECT_ROOT, filePath);
            if (filePath.includes("..") || !absoluteFilePath.startsWith(VITE_PROJECT_ROOT) || absoluteFilePath.includes("node_modules")) {
              res.writeHead(400, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Invalid path" }));
            }
            const originalContent = fs.readFileSync(absoluteFilePath, "utf-8");
            const babelAst = parse(originalContent, {
              sourceType: "module",
              plugins: ["jsx", "typescript"],
              errorRecovery: true
            });
            let targetNodePath = null;
            const visitor = {
              JSXOpeningElement(path3) {
                const node = path3.node;
                if (node.loc && node.loc.start.line === line && node.loc.start.column + 1 === column) {
                  targetNodePath = path3;
                  path3.stop();
                }
              }
            };
            traverseBabel.default(babelAst, visitor);
            if (!targetNodePath) {
              res.writeHead(404, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Target node not found by line/column", editId }));
            }
            const generateFunction = generate.default || generate;
            const targetOpeningElement = targetNodePath.node;
            const parentElementNode = (_a = targetNodePath.parentPath) == null ? void 0 : _a.node;
            const isImageElement = targetOpeningElement.name && targetOpeningElement.name.name === "img";
            let beforeCode = "";
            let afterCode = "";
            let modified = false;
            if (isImageElement) {
              const beforeOutput = generateFunction(targetOpeningElement, {});
              beforeCode = beforeOutput.code;
              const srcAttr = targetOpeningElement.attributes.find(
                (attr) => t.isJSXAttribute(attr) && attr.name && attr.name.name === "src"
              );
              if (srcAttr && t.isStringLiteral(srcAttr.value)) {
                srcAttr.value = t.stringLiteral(newFullText);
                modified = true;
                const afterOutput = generateFunction(targetOpeningElement, {});
                afterCode = afterOutput.code;
              }
            } else {
              if (parentElementNode && t.isJSXElement(parentElementNode)) {
                const beforeOutput = generateFunction(parentElementNode, {});
                beforeCode = beforeOutput.code;
                parentElementNode.children = [];
                if (newFullText && newFullText.trim() !== "") {
                  const newTextNode = t.jsxText(newFullText);
                  parentElementNode.children.push(newTextNode);
                }
                modified = true;
                const afterOutput = generateFunction(parentElementNode, {});
                afterCode = afterOutput.code;
              }
            }
            if (!modified) {
              res.writeHead(409, { "Content-Type": "application/json" });
              return res.end(JSON.stringify({ error: "Could not apply changes to AST." }));
            }
            const output = generateFunction(babelAst, {});
            const newContent = output.code;
            try {
              fs.writeFileSync(absoluteFilePath, newContent, "utf-8");
            } catch (writeError) {
              console.error(`[vite][visual-editor] Error during direct write for ${filePath}:`, writeError);
              throw writeError;
            }
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
              success: true,
              newFileContent: newContent,
              beforeCode,
              afterCode
            }));
          } catch (error) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Internal server error during edit application." }));
          }
        });
      });
    }
  };
}
var __vite_injected_original_import_meta_url, __filename, __dirname2, VITE_PROJECT_ROOT, EDITABLE_HTML_TAGS;
var init_vite_plugin_react_inline_editor = __esm({
  "plugins/visual-editor/vite-plugin-react-inline-editor.js"() {
    __vite_injected_original_import_meta_url = "file:///C:/app-agarch-ar/plugins/visual-editor/vite-plugin-react-inline-editor.js";
    __filename = fileURLToPath(__vite_injected_original_import_meta_url);
    __dirname2 = path.dirname(__filename);
    VITE_PROJECT_ROOT = path.resolve(__dirname2, "../..");
    EDITABLE_HTML_TAGS = ["a", "Button", "button", "p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "Label", "img"];
  }
});

// plugins/visual-editor/visual-editor-config.js
var EDIT_MODE_STYLES;
var init_visual_editor_config = __esm({
  "plugins/visual-editor/visual-editor-config.js"() {
    EDIT_MODE_STYLES = `
  #root[data-edit-mode-enabled="true"] [data-edit-id] {
    cursor: pointer; 
    outline: 1px dashed #357DF9; 
    outline-offset: 2px;
    min-height: 1em;
  }
  #root[data-edit-mode-enabled="true"] {
    cursor: pointer;
  }
  #root[data-edit-mode-enabled="true"] [data-edit-id]:hover {
    background-color: #357DF933;
    outline-color: #357DF9; 
  }

  @keyframes fadeInTooltip {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  #inline-editor-disabled-tooltip {
    display: none; 
    opacity: 0; 
    position: absolute;
    background-color: #1D1E20;
    color: white;
    padding: 4px 8px;
    border-radius: 8px;
    z-index: 10001;
    font-size: 14px;
    border: 1px solid #3B3D4A;
    max-width: 184px;
    text-align: center;
  }

  #inline-editor-disabled-tooltip.tooltip-active {
    display: block;
    animation: fadeInTooltip 0.2s ease-out forwards;
  }
`;
  }
});

// plugins/visual-editor/vite-plugin-edit-mode.js
var vite_plugin_edit_mode_exports = {};
__export(vite_plugin_edit_mode_exports, {
  default: () => inlineEditDevPlugin
});
import { readFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
function inlineEditDevPlugin() {
  return {
    name: "vite:inline-edit-dev",
    apply: "serve",
    transformIndexHtml() {
      const scriptPath = resolve(__dirname3, "edit-mode-script.js");
      const scriptContent = readFileSync(scriptPath, "utf-8");
      return [
        {
          tag: "script",
          attrs: { type: "module" },
          children: scriptContent,
          injectTo: "body"
        },
        {
          tag: "style",
          children: EDIT_MODE_STYLES,
          injectTo: "head"
        }
      ];
    }
  };
}
var __vite_injected_original_import_meta_url2, __filename2, __dirname3;
var init_vite_plugin_edit_mode = __esm({
  "plugins/visual-editor/vite-plugin-edit-mode.js"() {
    init_visual_editor_config();
    __vite_injected_original_import_meta_url2 = "file:///C:/app-agarch-ar/plugins/visual-editor/vite-plugin-edit-mode.js";
    __filename2 = fileURLToPath2(__vite_injected_original_import_meta_url2);
    __dirname3 = resolve(__filename2, "..");
  }
});

// vite.config.js
import path2 from "node:path";
import react from "file:///C:/app-agarch-ar/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { createLogger, defineConfig } from "file:///C:/app-agarch-ar/node_modules/vite/dist/node/index.js";
import { VitePWA } from "file:///C:/app-agarch-ar/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_dirname = "C:\\app-agarch-ar";
var isDev = process.env.NODE_ENV !== "production";
var inlineEditPlugin2;
var editModeDevPlugin;
if (isDev) {
  inlineEditPlugin2 = (await Promise.resolve().then(() => (init_vite_plugin_react_inline_editor(), vite_plugin_react_inline_editor_exports))).default;
  editModeDevPlugin = (await Promise.resolve().then(() => (init_vite_plugin_edit_mode(), vite_plugin_edit_mode_exports))).default;
}
var configHorizonsViteErrorHandler = `
const observer = new MutationObserver((mutations) => {
	for (const mutation of mutations) {
		for (const addedNode of mutation.addedNodes) {
			if (
				addedNode.nodeType === Node.ELEMENT_NODE &&
				(
					addedNode.tagName?.toLowerCase() === 'vite-error-overlay' ||
					addedNode.classList?.contains('backdrop')
				)
			) {
				handleViteOverlay(addedNode);
			}
		}
	}
});

observer.observe(document.documentElement, {
	childList: true,
	subtree: true
});

function handleViteOverlay(node) {
	if (!node.shadowRoot) {
		return;
	}

	const backdrop = node.shadowRoot.querySelector('.backdrop');

	if (backdrop) {
		const overlayHtml = backdrop.outerHTML;
		const parser = new DOMParser();
		const doc = parser.parseFromString(overlayHtml, 'text/html');
		const messageBodyElement = doc.querySelector('.message-body');
		const fileElement = doc.querySelector('.file');
		const messageText = messageBodyElement ? messageBodyElement.textContent.trim() : '';
		const fileText = fileElement ? fileElement.textContent.trim() : '';
		const error = messageText + (fileText ? ' File:' + fileText : '');

		window.parent.postMessage({
			type: 'horizons-vite-error',
			error,
		}, '*');
	}
}
`;
var configHorizonsRuntimeErrorHandler = `
window.onerror = (message, source, lineno, colno, errorObj) => {
	const errorDetails = errorObj ? JSON.stringify({
		name: errorObj.name,
		message: errorObj.message,
		stack: errorObj.stack,
		source,
		lineno,
		colno,
	}) : null;

	window.parent.postMessage({
		type: 'horizons-runtime-error',
		message,
		error: errorDetails
	}, '*');
};
`;
var configHorizonsConsoleErrroHandler = `
const originalConsoleError = console.error;
console.error = function(...args) {
	originalConsoleError.apply(console, args);

	let errorString = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg instanceof Error) {
			errorString = arg.stack || \`\${arg.name}: \${arg.message}\`;
			break;
		}
	}

	if (!errorString) {
		errorString = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
	}

	window.parent.postMessage({
		type: 'horizons-console-error',
		error: errorString
	}, '*');
};
`;
var configWindowFetchMonkeyPatch = `
const originalFetch = window.fetch;

window.fetch = function(...args) {
	const url = args[0] instanceof Request ? args[0].url : args[0];

	// Skip WebSocket URLs
	if (url.startsWith('ws:') || url.startsWith('wss:')) {
		return originalFetch.apply(this, args);
	}

	return originalFetch.apply(this, args)
		.then(async response => {
			const contentType = response.headers.get('Content-Type') || '';

			// Exclude HTML document responses
			const isDocumentResponse =
				contentType.includes('text/html') ||
				contentType.includes('application/xhtml+xml');

			if (!response.ok && !isDocumentResponse) {
					const responseClone = response.clone();
					const errorFromRes = await responseClone.text();
					const requestUrl = response.url;
					console.error(\`Fetch error from \${requestUrl}: \${errorFromRes}\`);
			}

			return response;
		})
		.catch(error => {
			if (!url.match(/.html?$/i)) {
				console.error(error);
			}

			throw error;
		});
};
`;
var addTransformIndexHtml = {
  name: "add-transform-index-html",
  transformIndexHtml(html) {
    return {
      html,
      tags: [
        {
          tag: "script",
          attrs: { type: "module" },
          children: configHorizonsRuntimeErrorHandler,
          injectTo: "head"
        },
        {
          tag: "script",
          attrs: { type: "module" },
          children: configHorizonsViteErrorHandler,
          injectTo: "head"
        },
        {
          tag: "script",
          attrs: { type: "module" },
          children: configHorizonsConsoleErrroHandler,
          injectTo: "head"
        },
        {
          tag: "script",
          attrs: { type: "module" },
          children: configWindowFetchMonkeyPatch,
          injectTo: "head"
        }
      ]
    };
  }
};
console.warn = () => {
};
var logger = createLogger();
var loggerError = logger.error;
logger.error = (msg, options) => {
  var _a;
  if ((_a = options == null ? void 0 : options.error) == null ? void 0 : _a.toString().includes("CssSyntaxError: [postcss]")) {
    return;
  }
  loggerError(msg, options);
};
var vite_config_default = defineConfig({
  customLogger: logger,
  plugins: [
    ...isDev ? [inlineEditPlugin2(), editModeDevPlugin()] : [],
    react(),
    addTransformIndexHtml,
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/, /^\/_/, /^\/admin/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/agarch-ar\.com\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "agarch-ar-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
                // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30
                // 30 days
              }
            }
          }
        ]
      },
      manifest: {
        name: "AGARCH-AR - Red Social",
        short_name: "AGARCH-AR",
        description: "Con\xE9ctate con personas afines a vos, cerca tuyo y con ganas de hacer lo mismo que vos cuando quieras, sin ataduras.",
        theme_color: "#0b121b",
        background_color: "#0b121b",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        shortcuts: [
          {
            name: "Descubrir",
            short_name: "Descubrir",
            description: "Descubre nuevas personas",
            url: "/discover",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Chat",
            short_name: "Chat",
            description: "Conversa con tus matches",
            url: "/chat",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          },
          {
            name: "Perfil",
            short_name: "Perfil",
            description: "Gestiona tu perfil",
            url: "/profile",
            icons: [{ src: "pwa-192x192.png", sizes: "192x192" }]
          }
        ]
      }
    })
  ],
  server: {
    cors: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "credentialless"
    },
    allowedHosts: true
  },
  resolve: {
    extensions: [".jsx", ".js", ".tsx", ".ts", ".json"],
    alias: {
      "@": path2.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Optimizaciones para reducir tiempo de build
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      external: [
        "@babel/parser",
        "@babel/traverse",
        "@babel/generator",
        "@babel/types"
      ],
      output: {
        manualChunks: {
          // Separar vendor chunks para mejor caching
          vendor: ["react", "react-dom"],
          supabase: ["@supabase/supabase-js"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-select"],
          utils: ["framer-motion", "date-fns", "lucide-react"]
        }
      }
    },
    // Configuraciones adicionales para optimización
    chunkSizeWarningLimit: 1e3,
    sourcemap: false,
    // Deshabilitar sourcemaps en producción
    reportCompressedSize: false
    // Deshabilitar reporte de tamaño comprimido
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGx1Z2lucy92aXN1YWwtZWRpdG9yL3ZpdGUtcGx1Z2luLXJlYWN0LWlubGluZS1lZGl0b3IuanMiLCAicGx1Z2lucy92aXN1YWwtZWRpdG9yL3Zpc3VhbC1lZGl0b3ItY29uZmlnLmpzIiwgInBsdWdpbnMvdmlzdWFsLWVkaXRvci92aXRlLXBsdWdpbi1lZGl0LW1vZGUuanMiLCAidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxhcHAtYWdhcmNoLWFyXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcYXBwLWFnYXJjaC1hclxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcXFxcdml0ZS1wbHVnaW4tcmVhY3QtaW5saW5lLWVkaXRvci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovYXBwLWFnYXJjaC1hci9wbHVnaW5zL3Zpc3VhbC1lZGl0b3Ivdml0ZS1wbHVnaW4tcmVhY3QtaW5saW5lLWVkaXRvci5qc1wiO2ltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gJ0BiYWJlbC9wYXJzZXInO1xuaW1wb3J0IHRyYXZlcnNlQmFiZWwgZnJvbSAnQGJhYmVsL3RyYXZlcnNlJztcbmltcG9ydCBnZW5lcmF0ZSBmcm9tICdAYmFiZWwvZ2VuZXJhdG9yJztcbmltcG9ydCAqIGFzIHQgZnJvbSAnQGJhYmVsL3R5cGVzJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSBwYXRoLmRpcm5hbWUoX19maWxlbmFtZSk7XG5jb25zdCBWSVRFX1BST0pFQ1RfUk9PVCA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLicpO1xuY29uc3QgRURJVEFCTEVfSFRNTF9UQUdTID0gW1wiYVwiLCBcIkJ1dHRvblwiLCBcImJ1dHRvblwiLCBcInBcIiwgXCJzcGFuXCIsIFwiaDFcIiwgXCJoMlwiLCBcImgzXCIsIFwiaDRcIiwgXCJoNVwiLCBcImg2XCIsIFwibGFiZWxcIiwgXCJMYWJlbFwiLCBcImltZ1wiXTtcblxuZnVuY3Rpb24gcGFyc2VFZGl0SWQoZWRpdElkKSB7XG4gIGNvbnN0IHBhcnRzID0gZWRpdElkLnNwbGl0KCc6Jyk7XG5cbiAgaWYgKHBhcnRzLmxlbmd0aCA8IDMpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGNvbHVtbiA9IHBhcnNlSW50KHBhcnRzLmF0KC0xKSwgMTApO1xuICBjb25zdCBsaW5lID0gcGFyc2VJbnQocGFydHMuYXQoLTIpLCAxMCk7XG4gIGNvbnN0IGZpbGVQYXRoID0gcGFydHMuc2xpY2UoMCwgLTIpLmpvaW4oJzonKTtcblxuICBpZiAoIWZpbGVQYXRoIHx8IGlzTmFOKGxpbmUpIHx8IGlzTmFOKGNvbHVtbikpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7IGZpbGVQYXRoLCBsaW5lLCBjb2x1bW4gfTtcbn1cblxuZnVuY3Rpb24gY2hlY2tUYWdOYW1lRWRpdGFibGUob3BlbmluZ0VsZW1lbnROb2RlLCBlZGl0YWJsZVRhZ3NMaXN0KSB7XG4gICAgaWYgKCFvcGVuaW5nRWxlbWVudE5vZGUgfHwgIW9wZW5pbmdFbGVtZW50Tm9kZS5uYW1lKSByZXR1cm4gZmFsc2U7XG4gICAgY29uc3QgbmFtZU5vZGUgPSBvcGVuaW5nRWxlbWVudE5vZGUubmFtZTtcblxuICAgIC8vIENoZWNrIDE6IERpcmVjdCBuYW1lIChmb3IgPHA+LCA8QnV0dG9uPilcbiAgICBpZiAobmFtZU5vZGUudHlwZSA9PT0gJ0pTWElkZW50aWZpZXInICYmIGVkaXRhYmxlVGFnc0xpc3QuaW5jbHVkZXMobmFtZU5vZGUubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgMjogUHJvcGVydHkgbmFtZSBvZiBhIG1lbWJlciBleHByZXNzaW9uIChmb3IgPG1vdGlvbi5oMT4sIGNoZWNrIGlmIFwiaDFcIiBpcyBpbiBlZGl0YWJsZVRhZ3NMaXN0KVxuICAgIGlmIChuYW1lTm9kZS50eXBlID09PSAnSlNYTWVtYmVyRXhwcmVzc2lvbicgJiYgbmFtZU5vZGUucHJvcGVydHkgJiYgbmFtZU5vZGUucHJvcGVydHkudHlwZSA9PT0gJ0pTWElkZW50aWZpZXInICYmIGVkaXRhYmxlVGFnc0xpc3QuaW5jbHVkZXMobmFtZU5vZGUucHJvcGVydHkubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUltYWdlU3JjKG9wZW5pbmdOb2RlKSB7XG4gICAgaWYgKCFvcGVuaW5nTm9kZSB8fCAhb3BlbmluZ05vZGUubmFtZSB8fCBvcGVuaW5nTm9kZS5uYW1lLm5hbWUgIT09ICdpbWcnKSB7XG4gICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IHRydWUsIHJlYXNvbjogbnVsbCB9OyAvLyBOb3QgYW4gaW1hZ2UsIHNraXAgdmFsaWRhdGlvblxuICAgIH1cblxuICAgIGNvbnN0IGhhc1Byb3BzU3ByZWFkID0gb3BlbmluZ05vZGUuYXR0cmlidXRlcy5zb21lKGF0dHIgPT4gXG4gICAgICAgIHQuaXNKU1hTcHJlYWRBdHRyaWJ1dGUoYXR0cikgJiYgXG4gICAgICAgIGF0dHIuYXJndW1lbnQgJiYgXG4gICAgICAgIHQuaXNJZGVudGlmaWVyKGF0dHIuYXJndW1lbnQpICYmIFxuICAgICAgICBhdHRyLmFyZ3VtZW50Lm5hbWUgPT09ICdwcm9wcydcbiAgICApO1xuXG4gICAgaWYgKGhhc1Byb3BzU3ByZWFkKSB7XG4gICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IGZhbHNlLCByZWFzb246ICdwcm9wcy1zcHJlYWQnIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc3JjQXR0ciA9IG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMuZmluZChhdHRyID0+IFxuICAgICAgICB0LmlzSlNYQXR0cmlidXRlKGF0dHIpICYmIFxuICAgICAgICBhdHRyLm5hbWUgJiYgXG4gICAgICAgIGF0dHIubmFtZS5uYW1lID09PSAnc3JjJ1xuICAgICk7XG5cbiAgICBpZiAoIXNyY0F0dHIpIHtcbiAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIHJlYXNvbjogJ21pc3Npbmctc3JjJyB9O1xuICAgIH1cblxuICAgIGlmICghdC5pc1N0cmluZ0xpdGVyYWwoc3JjQXR0ci52YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIHJlYXNvbjogJ2R5bmFtaWMtc3JjJyB9O1xuICAgIH1cblxuICAgIGlmICghc3JjQXR0ci52YWx1ZS52YWx1ZSB8fCBzcmNBdHRyLnZhbHVlLnZhbHVlLnRyaW0oKSA9PT0gJycpIHtcbiAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogZmFsc2UsIHJlYXNvbjogJ2VtcHR5LXNyYycgfTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBpc1ZhbGlkOiB0cnVlLCByZWFzb246IG51bGwgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5saW5lRWRpdFBsdWdpbigpIHtcbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAndml0ZS1pbmxpbmUtZWRpdC1wbHVnaW4nLFxuICAgIGVuZm9yY2U6ICdwcmUnLFxuXG4gICAgdHJhbnNmb3JtKGNvZGUsIGlkKSB7XG4gICAgICBpZiAoIS9cXC4oanN4fHRzeCkkLy50ZXN0KGlkKSB8fCAhaWQuc3RhcnRzV2l0aChWSVRFX1BST0pFQ1RfUk9PVCkgfHwgaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBjb25zdCByZWxhdGl2ZUZpbGVQYXRoID0gcGF0aC5yZWxhdGl2ZShWSVRFX1BST0pFQ1RfUk9PVCwgaWQpO1xuICAgICAgY29uc3Qgd2ViUmVsYXRpdmVGaWxlUGF0aCA9IHJlbGF0aXZlRmlsZVBhdGguc3BsaXQocGF0aC5zZXApLmpvaW4oJy8nKTtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYmFiZWxBc3QgPSBwYXJzZShjb2RlLCB7XG4gICAgICAgICAgc291cmNlVHlwZTogJ21vZHVsZScsXG4gICAgICAgICAgcGx1Z2luczogWydqc3gnLCAndHlwZXNjcmlwdCddLFxuICAgICAgICAgIGVycm9yUmVjb3Zlcnk6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGF0dHJpYnV0ZXNBZGRlZCA9IDA7XG5cbiAgICAgICAgdHJhdmVyc2VCYWJlbC5kZWZhdWx0KGJhYmVsQXN0LCB7XG4gICAgICAgICAgZW50ZXIocGF0aCkge1xuICAgICAgICAgICAgaWYgKHBhdGguaXNKU1hPcGVuaW5nRWxlbWVudCgpKSB7XG4gICAgICAgICAgICAgIGNvbnN0IG9wZW5pbmdOb2RlID0gcGF0aC5ub2RlO1xuICAgICAgICAgICAgICBjb25zdCBlbGVtZW50Tm9kZSA9IHBhdGgucGFyZW50UGF0aC5ub2RlOyAvLyBUaGUgSlNYRWxlbWVudCBpdHNlbGZcblxuICAgICAgICAgICAgICBpZiAoIW9wZW5pbmdOb2RlLmxvYykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGFscmVhZHlIYXNJZCA9IG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMuc29tZShcbiAgICAgICAgICAgICAgICAoYXR0cikgPT4gdC5pc0pTWEF0dHJpYnV0ZShhdHRyKSAmJiBhdHRyLm5hbWUubmFtZSA9PT0gJ2RhdGEtZWRpdC1pZCdcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBpZiAoYWxyZWFkeUhhc0lkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gQ29uZGl0aW9uIDE6IElzIHRoZSBjdXJyZW50IGVsZW1lbnQgdGFnIHR5cGUgZWRpdGFibGU/XG4gICAgICAgICAgICAgIGNvbnN0IGlzQ3VycmVudEVsZW1lbnRFZGl0YWJsZSA9IGNoZWNrVGFnTmFtZUVkaXRhYmxlKG9wZW5pbmdOb2RlLCBFRElUQUJMRV9IVE1MX1RBR1MpO1xuICAgICAgICAgICAgICBpZiAoIWlzQ3VycmVudEVsZW1lbnRFZGl0YWJsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IGltYWdlVmFsaWRhdGlvbiA9IHZhbGlkYXRlSW1hZ2VTcmMob3BlbmluZ05vZGUpO1xuICAgICAgICAgICAgICBpZiAoIWltYWdlVmFsaWRhdGlvbi5pc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlzYWJsZWRBdHRyaWJ1dGUgPSB0LmpzeEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgIHQuanN4SWRlbnRpZmllcignZGF0YS1lZGl0LWRpc2FibGVkJyksXG4gICAgICAgICAgICAgICAgICB0LnN0cmluZ0xpdGVyYWwoJ3RydWUnKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgb3BlbmluZ05vZGUuYXR0cmlidXRlcy5wdXNoKGRpc2FibGVkQXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzQWRkZWQrKztcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBsZXQgc2hvdWxkQmVEaXNhYmxlZER1ZVRvQ2hpbGRyZW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgICAvLyBDb25kaXRpb24gMjogRG9lcyB0aGUgZWxlbWVudCBoYXZlIGR5bmFtaWMgb3IgZWRpdGFibGUgY2hpbGRyZW5cbiAgICAgICAgICAgICAgaWYgKHQuaXNKU1hFbGVtZW50KGVsZW1lbnROb2RlKSAmJiBlbGVtZW50Tm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIC8vIENoZWNrIGlmIGVsZW1lbnQgaGFzIHsuLi5wcm9wc30gc3ByZWFkIGF0dHJpYnV0ZSAtIGRpc2FibGUgZWRpdGluZyBpZiBpdCBkb2VzXG4gICAgICAgICAgICAgICAgY29uc3QgaGFzUHJvcHNTcHJlYWQgPSBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLnNvbWUoYXR0ciA9PiB0LmlzSlNYU3ByZWFkQXR0cmlidXRlKGF0dHIpXG4gICAgICAgICAgICAgICAgJiYgYXR0ci5hcmd1bWVudFxuICAgICAgICAgICAgICAgICYmIHQuaXNJZGVudGlmaWVyKGF0dHIuYXJndW1lbnQpXG4gICAgICAgICAgICAgICAgJiYgYXR0ci5hcmd1bWVudC5uYW1lID09PSAncHJvcHMnXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGhhc0R5bmFtaWNDaGlsZCA9IGVsZW1lbnROb2RlLmNoaWxkcmVuLnNvbWUoY2hpbGQgPT5cbiAgICAgICAgICAgICAgICAgIHQuaXNKU1hFeHByZXNzaW9uQ29udGFpbmVyKGNoaWxkKVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaGFzRHluYW1pY0NoaWxkIHx8IGhhc1Byb3BzU3ByZWFkKSB7XG4gICAgICAgICAgICAgICAgICBzaG91bGRCZURpc2FibGVkRHVlVG9DaGlsZHJlbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaWYgKCFzaG91bGRCZURpc2FibGVkRHVlVG9DaGlsZHJlbiAmJiB0LmlzSlNYRWxlbWVudChlbGVtZW50Tm9kZSkgJiYgZWxlbWVudE5vZGUuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBoYXNFZGl0YWJsZUpzeENoaWxkID0gZWxlbWVudE5vZGUuY2hpbGRyZW4uc29tZShjaGlsZCA9PiB7XG4gICAgICAgICAgICAgICAgICBpZiAodC5pc0pTWEVsZW1lbnQoY2hpbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjaGVja1RhZ05hbWVFZGl0YWJsZShjaGlsZC5vcGVuaW5nRWxlbWVudCwgRURJVEFCTEVfSFRNTF9UQUdTKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGhhc0VkaXRhYmxlSnN4Q2hpbGQpIHtcbiAgICAgICAgICAgICAgICAgIHNob3VsZEJlRGlzYWJsZWREdWVUb0NoaWxkcmVuID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoc2hvdWxkQmVEaXNhYmxlZER1ZVRvQ2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBkaXNhYmxlZEF0dHJpYnV0ZSA9IHQuanN4QXR0cmlidXRlKFxuICAgICAgICAgICAgICAgICAgdC5qc3hJZGVudGlmaWVyKCdkYXRhLWVkaXQtZGlzYWJsZWQnKSxcbiAgICAgICAgICAgICAgICAgIHQuc3RyaW5nTGl0ZXJhbCgndHJ1ZScpXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIG9wZW5pbmdOb2RlLmF0dHJpYnV0ZXMucHVzaChkaXNhYmxlZEF0dHJpYnV0ZSk7XG4gICAgICAgICAgICAgICAgYXR0cmlidXRlc0FkZGVkKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgLy8gQ29uZGl0aW9uIDM6IFBhcmVudCBpcyBub24tZWRpdGFibGUgaWYgQVQgTEVBU1QgT05FIGNoaWxkIEpTWEVsZW1lbnQgaXMgYSBub24tZWRpdGFibGUgdHlwZS5cbiAgICAgICAgICAgICAgaWYgKHQuaXNKU1hFbGVtZW50KGVsZW1lbnROb2RlKSAmJiBlbGVtZW50Tm9kZS5jaGlsZHJlbiAmJiBlbGVtZW50Tm9kZS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICBsZXQgaGFzTm9uRWRpdGFibGVKc3hDaGlsZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBjaGlsZCBvZiBlbGVtZW50Tm9kZS5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgIGlmICh0LmlzSlNYRWxlbWVudChjaGlsZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjaGVja1RhZ05hbWVFZGl0YWJsZShjaGlsZC5vcGVuaW5nRWxlbWVudCwgRURJVEFCTEVfSFRNTF9UQUdTKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFzTm9uRWRpdGFibGVKc3hDaGlsZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGlmIChoYXNOb25FZGl0YWJsZUpzeENoaWxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGlzYWJsZWRBdHRyaWJ1dGUgPSB0LmpzeEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICAgICAgICAgIHQuanN4SWRlbnRpZmllcignZGF0YS1lZGl0LWRpc2FibGVkJyksXG4gICAgICAgICAgICAgICAgICAgICAgICB0LnN0cmluZ0xpdGVyYWwoXCJ0cnVlXCIpXG4gICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICBvcGVuaW5nTm9kZS5hdHRyaWJ1dGVzLnB1c2goZGlzYWJsZWRBdHRyaWJ1dGUpO1xuICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXNBZGRlZCsrO1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIENvbmRpdGlvbiA0OiBJcyBhbnkgYW5jZXN0b3IgSlNYRWxlbWVudCBhbHNvIGVkaXRhYmxlP1xuICAgICAgICAgICAgICBsZXQgY3VycmVudEFuY2VzdG9yQ2FuZGlkYXRlUGF0aCA9IHBhdGgucGFyZW50UGF0aC5wYXJlbnRQYXRoO1xuICAgICAgICAgICAgICB3aGlsZSAoY3VycmVudEFuY2VzdG9yQ2FuZGlkYXRlUGF0aCkge1xuICAgICAgICAgICAgICAgICAgY29uc3QgYW5jZXN0b3JKc3hFbGVtZW50UGF0aCA9IGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGguaXNKU1hFbGVtZW50KClcbiAgICAgICAgICAgICAgICAgICAgICA/IGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGhcbiAgICAgICAgICAgICAgICAgICAgICA6IGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGguZmluZFBhcmVudChwID0+IHAuaXNKU1hFbGVtZW50KCkpO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoIWFuY2VzdG9ySnN4RWxlbWVudFBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgaWYgKGNoZWNrVGFnTmFtZUVkaXRhYmxlKGFuY2VzdG9ySnN4RWxlbWVudFBhdGgubm9kZS5vcGVuaW5nRWxlbWVudCwgRURJVEFCTEVfSFRNTF9UQUdTKSkge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRBbmNlc3RvckNhbmRpZGF0ZVBhdGggPSBhbmNlc3RvckpzeEVsZW1lbnRQYXRoLnBhcmVudFBhdGg7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb25zdCBsaW5lID0gb3BlbmluZ05vZGUubG9jLnN0YXJ0LmxpbmU7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9IG9wZW5pbmdOb2RlLmxvYy5zdGFydC5jb2x1bW4gKyAxO1xuICAgICAgICAgICAgICBjb25zdCBlZGl0SWQgPSBgJHt3ZWJSZWxhdGl2ZUZpbGVQYXRofToke2xpbmV9OiR7Y29sdW1ufWA7XG5cbiAgICAgICAgICAgICAgY29uc3QgaWRBdHRyaWJ1dGUgPSB0LmpzeEF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgICB0LmpzeElkZW50aWZpZXIoJ2RhdGEtZWRpdC1pZCcpLFxuICAgICAgICAgICAgICAgIHQuc3RyaW5nTGl0ZXJhbChlZGl0SWQpXG4gICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgb3BlbmluZ05vZGUuYXR0cmlidXRlcy5wdXNoKGlkQXR0cmlidXRlKTtcbiAgICAgICAgICAgICAgYXR0cmlidXRlc0FkZGVkKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoYXR0cmlidXRlc0FkZGVkID4gMCkge1xuICAgICAgICAgIGNvbnN0IGdlbmVyYXRlRnVuY3Rpb24gPSBnZW5lcmF0ZS5kZWZhdWx0IHx8IGdlbmVyYXRlO1xuICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGdlbmVyYXRlRnVuY3Rpb24oYmFiZWxBc3QsIHtcbiAgICAgICAgICAgIHNvdXJjZU1hcHM6IHRydWUsXG4gICAgICAgICAgICBzb3VyY2VGaWxlTmFtZTogd2ViUmVsYXRpdmVGaWxlUGF0aFxuICAgICAgICAgIH0sIGNvZGUpO1xuXG4gICAgICAgICAgcmV0dXJuIHsgY29kZTogb3V0cHV0LmNvZGUsIG1hcDogb3V0cHV0Lm1hcCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBbdml0ZV1bdmlzdWFsLWVkaXRvcl0gRXJyb3IgdHJhbnNmb3JtaW5nICR7aWR9OmAsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfSxcblxuXG4gICAgLy8gVXBkYXRlcyBzb3VyY2UgY29kZSBiYXNlZCBvbiB0aGUgY2hhbmdlcyByZWNlaXZlZCBmcm9tIHRoZSBjbGllbnRcbiAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL2FwcGx5LWVkaXQnLCBhc3luYyAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykgcmV0dXJuIG5leHQoKTtcblxuICAgICAgICBsZXQgYm9keSA9ICcnO1xuICAgICAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7IGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTsgfSk7XG5cbiAgICAgICAgcmVxLm9uKCdlbmQnLCBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgbGV0IGFic29sdXRlRmlsZVBhdGggPSAnJztcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBlZGl0SWQsIG5ld0Z1bGxUZXh0IH0gPSBKU09OLnBhcnNlKGJvZHkpO1xuXG4gICAgICAgICAgICBpZiAoIWVkaXRJZCB8fCB0eXBlb2YgbmV3RnVsbFRleHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdNaXNzaW5nIGVkaXRJZCBvciBuZXdGdWxsVGV4dCcgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBwYXJzZWRJZCA9IHBhcnNlRWRpdElkKGVkaXRJZCk7XG4gICAgICAgICAgICBpZiAoIXBhcnNlZElkKSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdJbnZhbGlkIGVkaXRJZCBmb3JtYXQgKGZpbGVQYXRoOmxpbmU6Y29sdW1uKScgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCB7IGZpbGVQYXRoLCBsaW5lLCBjb2x1bW4gfSA9IHBhcnNlZElkO1xuXG4gICAgICAgICAgICBhYnNvbHV0ZUZpbGVQYXRoID0gcGF0aC5yZXNvbHZlKFZJVEVfUFJPSkVDVF9ST09ULCBmaWxlUGF0aCk7XG4gICAgICAgICAgICBpZiAoZmlsZVBhdGguaW5jbHVkZXMoJy4uJykgfHwgIWFic29sdXRlRmlsZVBhdGguc3RhcnRzV2l0aChWSVRFX1BST0pFQ1RfUk9PVCkgfHwgYWJzb2x1dGVGaWxlUGF0aC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg0MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogJ0ludmFsaWQgcGF0aCcgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBvcmlnaW5hbENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoYWJzb2x1dGVGaWxlUGF0aCwgJ3V0Zi04Jyk7XG5cbiAgICAgICAgICAgIGNvbnN0IGJhYmVsQXN0ID0gcGFyc2Uob3JpZ2luYWxDb250ZW50LCB7XG4gICAgICAgICAgICAgIHNvdXJjZVR5cGU6ICdtb2R1bGUnLFxuICAgICAgICAgICAgICBwbHVnaW5zOiBbJ2pzeCcsICd0eXBlc2NyaXB0J10sXG4gICAgICAgICAgICAgIGVycm9yUmVjb3Zlcnk6IHRydWVcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgdGFyZ2V0Tm9kZVBhdGggPSBudWxsO1xuICAgICAgICAgICAgY29uc3QgdmlzaXRvciA9IHtcbiAgICAgICAgICAgICAgSlNYT3BlbmluZ0VsZW1lbnQocGF0aCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBwYXRoLm5vZGU7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUubG9jICYmIG5vZGUubG9jLnN0YXJ0LmxpbmUgPT09IGxpbmUgJiYgbm9kZS5sb2Muc3RhcnQuY29sdW1uICsgMSA9PT0gY29sdW1uKSB7XG4gICAgICAgICAgICAgICAgICB0YXJnZXROb2RlUGF0aCA9IHBhdGg7XG4gICAgICAgICAgICAgICAgICBwYXRoLnN0b3AoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0cmF2ZXJzZUJhYmVsLmRlZmF1bHQoYmFiZWxBc3QsIHZpc2l0b3IpO1xuXG4gICAgICAgICAgICBpZiAoIXRhcmdldE5vZGVQYXRoKSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDA0LCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdUYXJnZXQgbm9kZSBub3QgZm91bmQgYnkgbGluZS9jb2x1bW4nLCBlZGl0SWQgfSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBnZW5lcmF0ZUZ1bmN0aW9uID0gZ2VuZXJhdGUuZGVmYXVsdCB8fCBnZW5lcmF0ZTtcbiAgICAgICAgICAgIGNvbnN0IHRhcmdldE9wZW5pbmdFbGVtZW50ID0gdGFyZ2V0Tm9kZVBhdGgubm9kZTtcbiAgICAgICAgICAgIGNvbnN0IHBhcmVudEVsZW1lbnROb2RlID0gdGFyZ2V0Tm9kZVBhdGgucGFyZW50UGF0aD8ubm9kZTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3QgaXNJbWFnZUVsZW1lbnQgPSB0YXJnZXRPcGVuaW5nRWxlbWVudC5uYW1lICYmIHRhcmdldE9wZW5pbmdFbGVtZW50Lm5hbWUubmFtZSA9PT0gJ2ltZyc7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGxldCBiZWZvcmVDb2RlID0gJyc7XG4gICAgICAgICAgICBsZXQgYWZ0ZXJDb2RlID0gJyc7XG4gICAgICAgICAgICBsZXQgbW9kaWZpZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKGlzSW1hZ2VFbGVtZW50KSB7XG4gICAgICAgICAgICAgIC8vIEhhbmRsZSBpbWFnZSBzcmMgYXR0cmlidXRlIHVwZGF0ZVxuICAgICAgICAgICAgICBjb25zdCBiZWZvcmVPdXRwdXQgPSBnZW5lcmF0ZUZ1bmN0aW9uKHRhcmdldE9wZW5pbmdFbGVtZW50LCB7fSk7XG4gICAgICAgICAgICAgIGJlZm9yZUNvZGUgPSBiZWZvcmVPdXRwdXQuY29kZTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGNvbnN0IHNyY0F0dHIgPSB0YXJnZXRPcGVuaW5nRWxlbWVudC5hdHRyaWJ1dGVzLmZpbmQoYXR0ciA9PiBcbiAgICAgICAgICAgICAgICB0LmlzSlNYQXR0cmlidXRlKGF0dHIpICYmIGF0dHIubmFtZSAmJiBhdHRyLm5hbWUubmFtZSA9PT0gJ3NyYydcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIGlmIChzcmNBdHRyICYmIHQuaXNTdHJpbmdMaXRlcmFsKHNyY0F0dHIudmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgc3JjQXR0ci52YWx1ZSA9IHQuc3RyaW5nTGl0ZXJhbChuZXdGdWxsVGV4dCk7XG4gICAgICAgICAgICAgICAgbW9kaWZpZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IGFmdGVyT3V0cHV0ID0gZ2VuZXJhdGVGdW5jdGlvbih0YXJnZXRPcGVuaW5nRWxlbWVudCwge30pO1xuICAgICAgICAgICAgICAgIGFmdGVyQ29kZSA9IGFmdGVyT3V0cHV0LmNvZGU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChwYXJlbnRFbGVtZW50Tm9kZSAmJiB0LmlzSlNYRWxlbWVudChwYXJlbnRFbGVtZW50Tm9kZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiZWZvcmVPdXRwdXQgPSBnZW5lcmF0ZUZ1bmN0aW9uKHBhcmVudEVsZW1lbnROb2RlLCB7fSk7XG4gICAgICAgICAgICAgICAgYmVmb3JlQ29kZSA9IGJlZm9yZU91dHB1dC5jb2RlO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnROb2RlLmNoaWxkcmVuID0gW107XG4gICAgICAgICAgICAgICAgaWYgKG5ld0Z1bGxUZXh0ICYmIG5ld0Z1bGxUZXh0LnRyaW0oKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IG5ld1RleHROb2RlID0gdC5qc3hUZXh0KG5ld0Z1bGxUZXh0KTtcbiAgICAgICAgICAgICAgICAgIHBhcmVudEVsZW1lbnROb2RlLmNoaWxkcmVuLnB1c2gobmV3VGV4dE5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb2RpZmllZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3QgYWZ0ZXJPdXRwdXQgPSBnZW5lcmF0ZUZ1bmN0aW9uKHBhcmVudEVsZW1lbnROb2RlLCB7fSk7XG4gICAgICAgICAgICAgICAgYWZ0ZXJDb2RlID0gYWZ0ZXJPdXRwdXQuY29kZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW1vZGlmaWVkKSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNDA5LCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6ICdDb3VsZCBub3QgYXBwbHkgY2hhbmdlcyB0byBBU1QuJyB9KSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IG91dHB1dCA9IGdlbmVyYXRlRnVuY3Rpb24oYmFiZWxBc3QsIHt9KTtcbiAgICAgICAgICAgIGNvbnN0IG5ld0NvbnRlbnQgPSBvdXRwdXQuY29kZTtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgZnMud3JpdGVGaWxlU3luYyhhYnNvbHV0ZUZpbGVQYXRoLCBuZXdDb250ZW50LCAndXRmLTgnKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKHdyaXRlRXJyb3IpIHtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgW3ZpdGVdW3Zpc3VhbC1lZGl0b3JdIEVycm9yIGR1cmluZyBkaXJlY3Qgd3JpdGUgZm9yICR7ZmlsZVBhdGh9OmAsIHdyaXRlRXJyb3IpO1xuICAgICAgICAgICAgICB0aHJvdyB3cml0ZUVycm9yO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDIwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgICAgICBuZXdGaWxlQ29udGVudDogbmV3Q29udGVudCxcbiAgICAgICAgICAgICAgICBiZWZvcmVDb2RlLFxuICAgICAgICAgICAgICAgIGFmdGVyQ29kZSxcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yIGR1cmluZyBlZGl0IGFwcGxpY2F0aW9uLicgfSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxhcHAtYWdhcmNoLWFyXFxcXHBsdWdpbnNcXFxcdmlzdWFsLWVkaXRvclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcYXBwLWFnYXJjaC1hclxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcXFxcdmlzdWFsLWVkaXRvci1jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L2FwcC1hZ2FyY2gtYXIvcGx1Z2lucy92aXN1YWwtZWRpdG9yL3Zpc3VhbC1lZGl0b3ItY29uZmlnLmpzXCI7ZXhwb3J0IGNvbnN0IFBPUFVQX1NUWUxFUyA9IGBcbiNpbmxpbmUtZWRpdG9yLXBvcHVwIHtcbiAgd2lkdGg6IDM2MHB4O1xuICBwb3NpdGlvbjogZml4ZWQ7XG4gIHotaW5kZXg6IDEwMDAwO1xuICBiYWNrZ3JvdW5kOiAjMTYxNzE4O1xuICBjb2xvcjogd2hpdGU7XG4gIGJvcmRlcjogMXB4IHNvbGlkICM0YTU1Njg7XG4gIGJvcmRlci1yYWRpdXM6IDE2cHg7XG4gIHBhZGRpbmc6IDhweDtcbiAgYm94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDAsMCwwLDAuMik7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGdhcDogMTBweDtcbiAgZGlzcGxheTogbm9uZTtcbn1cblxuQG1lZGlhIChtYXgtd2lkdGg6IDc2OHB4KSB7XG4gICNpbmxpbmUtZWRpdG9yLXBvcHVwIHtcbiAgICB3aWR0aDogY2FsYygxMDAlIC0gMjBweCk7XG4gIH1cbn1cblxuI2lubGluZS1lZGl0b3ItcG9wdXAuaXMtYWN0aXZlIHtcbiAgZGlzcGxheTogZmxleDtcbiAgdG9wOiA1MCU7XG4gIGxlZnQ6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwLmlzLWRpc2FibGVkLXZpZXcge1xuICBwYWRkaW5nOiAxMHB4IDE1cHg7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwIHRleHRhcmVhIHtcbiAgaGVpZ2h0OiAxMDBweDtcbiAgcGFkZGluZzogNHB4IDhweDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGNvbG9yOiB3aGl0ZTtcbiAgZm9udC1mYW1pbHk6IGluaGVyaXQ7XG4gIGZvbnQtc2l6ZTogMC44NzVyZW07XG4gIGxpbmUtaGVpZ2h0OiAxLjQyO1xuICByZXNpemU6IG5vbmU7XG4gIG91dGxpbmU6IG5vbmU7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwIC5idXR0b24tY29udGFpbmVyIHtcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgZ2FwOiAxMHB4O1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cCAucG9wdXAtYnV0dG9uIHtcbiAgYm9yZGVyOiBub25lO1xuICBwYWRkaW5nOiA2cHggMTZweDtcbiAgYm9yZGVyLXJhZGl1czogOHB4O1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGZvbnQtc2l6ZTogMC43NXJlbTtcbiAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgaGVpZ2h0OiAzNHB4O1xuICBvdXRsaW5lOiBub25lO1xufVxuXG4jaW5saW5lLWVkaXRvci1wb3B1cCAuc2F2ZS1idXR0b24ge1xuICBiYWNrZ3JvdW5kOiAjNjczZGU2O1xuICBjb2xvcjogd2hpdGU7XG59XG5cbiNpbmxpbmUtZWRpdG9yLXBvcHVwIC5jYW5jZWwtYnV0dG9uIHtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGJvcmRlcjogMXB4IHNvbGlkICMzYjNkNGE7XG4gIGNvbG9yOiB3aGl0ZTtcblxuICAmOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiM0NzQ5NTg7XG4gIH1cbn1cbmA7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQb3B1cEhUTUxUZW1wbGF0ZShzYXZlTGFiZWwsIGNhbmNlbExhYmVsKSB7XG4gIHJldHVybiBgXG4gICAgPHRleHRhcmVhPjwvdGV4dGFyZWE+XG4gICAgPGRpdiBjbGFzcz1cImJ1dHRvbi1jb250YWluZXJcIj5cbiAgICAgIDxidXR0b24gY2xhc3M9XCJwb3B1cC1idXR0b24gY2FuY2VsLWJ1dHRvblwiPiR7Y2FuY2VsTGFiZWx9PC9idXR0b24+XG4gICAgICA8YnV0dG9uIGNsYXNzPVwicG9wdXAtYnV0dG9uIHNhdmUtYnV0dG9uXCI+JHtzYXZlTGFiZWx9PC9idXR0b24+XG4gICAgPC9kaXY+XG4gIGA7XG59O1xuXG5leHBvcnQgY29uc3QgRURJVF9NT0RFX1NUWUxFUyA9IGBcbiAgI3Jvb3RbZGF0YS1lZGl0LW1vZGUtZW5hYmxlZD1cInRydWVcIl0gW2RhdGEtZWRpdC1pZF0ge1xuICAgIGN1cnNvcjogcG9pbnRlcjsgXG4gICAgb3V0bGluZTogMXB4IGRhc2hlZCAjMzU3REY5OyBcbiAgICBvdXRsaW5lLW9mZnNldDogMnB4O1xuICAgIG1pbi1oZWlnaHQ6IDFlbTtcbiAgfVxuICAjcm9vdFtkYXRhLWVkaXQtbW9kZS1lbmFibGVkPVwidHJ1ZVwiXSB7XG4gICAgY3Vyc29yOiBwb2ludGVyO1xuICB9XG4gICNyb290W2RhdGEtZWRpdC1tb2RlLWVuYWJsZWQ9XCJ0cnVlXCJdIFtkYXRhLWVkaXQtaWRdOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMzU3REY5MzM7XG4gICAgb3V0bGluZS1jb2xvcjogIzM1N0RGOTsgXG4gIH1cblxuICBAa2V5ZnJhbWVzIGZhZGVJblRvb2x0aXAge1xuICAgIGZyb20ge1xuICAgICAgb3BhY2l0eTogMDtcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSg1cHgpO1xuICAgIH1cbiAgICB0byB7XG4gICAgICBvcGFjaXR5OiAxO1xuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApO1xuICAgIH1cbiAgfVxuXG4gICNpbmxpbmUtZWRpdG9yLWRpc2FibGVkLXRvb2x0aXAge1xuICAgIGRpc3BsYXk6IG5vbmU7IFxuICAgIG9wYWNpdHk6IDA7IFxuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjMUQxRTIwO1xuICAgIGNvbG9yOiB3aGl0ZTtcbiAgICBwYWRkaW5nOiA0cHggOHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICB6LWluZGV4OiAxMDAwMTtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgYm9yZGVyOiAxcHggc29saWQgIzNCM0Q0QTtcbiAgICBtYXgtd2lkdGg6IDE4NHB4O1xuICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgfVxuXG4gICNpbmxpbmUtZWRpdG9yLWRpc2FibGVkLXRvb2x0aXAudG9vbHRpcC1hY3RpdmUge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIGFuaW1hdGlvbjogZmFkZUluVG9vbHRpcCAwLjJzIGVhc2Utb3V0IGZvcndhcmRzO1xuICB9XG5gOyIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcYXBwLWFnYXJjaC1hclxcXFxwbHVnaW5zXFxcXHZpc3VhbC1lZGl0b3JcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXGFwcC1hZ2FyY2gtYXJcXFxccGx1Z2luc1xcXFx2aXN1YWwtZWRpdG9yXFxcXHZpdGUtcGx1Z2luLWVkaXQtbW9kZS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovYXBwLWFnYXJjaC1hci9wbHVnaW5zL3Zpc3VhbC1lZGl0b3Ivdml0ZS1wbHVnaW4tZWRpdC1tb2RlLmpzXCI7aW1wb3J0IHsgcmVhZEZpbGVTeW5jIH0gZnJvbSAnZnMnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBFRElUX01PREVfU1RZTEVTIH0gZnJvbSAnLi92aXN1YWwtZWRpdG9yLWNvbmZpZyc7XG5cbmNvbnN0IF9fZmlsZW5hbWUgPSBmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCk7XG5jb25zdCBfX2Rpcm5hbWUgPSByZXNvbHZlKF9fZmlsZW5hbWUsICcuLicpO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbmxpbmVFZGl0RGV2UGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICd2aXRlOmlubGluZS1lZGl0LWRldicsXG4gICAgYXBwbHk6ICdzZXJ2ZScsXG4gICAgdHJhbnNmb3JtSW5kZXhIdG1sKCkge1xuICAgICAgY29uc3Qgc2NyaXB0UGF0aCA9IHJlc29sdmUoX19kaXJuYW1lLCAnZWRpdC1tb2RlLXNjcmlwdC5qcycpO1xuICAgICAgY29uc3Qgc2NyaXB0Q29udGVudCA9IHJlYWRGaWxlU3luYyhzY3JpcHRQYXRoLCAndXRmLTgnKTtcblxuICAgICAgcmV0dXJuIFtcbiAgICAgICAge1xuICAgICAgICAgIHRhZzogJ3NjcmlwdCcsXG4gICAgICAgICAgYXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcbiAgICAgICAgICBjaGlsZHJlbjogc2NyaXB0Q29udGVudCxcbiAgICAgICAgICBpbmplY3RUbzogJ2JvZHknXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0YWc6ICdzdHlsZScsXG4gICAgICAgICAgY2hpbGRyZW46IEVESVRfTU9ERV9TVFlMRVMsXG4gICAgICAgICAgaW5qZWN0VG86ICdoZWFkJ1xuICAgICAgICB9XG4gICAgICBdO1xuICAgIH1cbiAgfTtcbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcYXBwLWFnYXJjaC1hclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcYXBwLWFnYXJjaC1hclxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovYXBwLWFnYXJjaC1hci92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCBwYXRoIGZyb20gJ25vZGU6cGF0aCc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgY3JlYXRlTG9nZ2VyLCBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnO1xuXG5jb25zdCBpc0RldiA9IHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbic7XG5sZXQgaW5saW5lRWRpdFBsdWdpbiwgZWRpdE1vZGVEZXZQbHVnaW47XG5cbmlmIChpc0Rldikge1xuXHRpbmxpbmVFZGl0UGx1Z2luID0gKGF3YWl0IGltcG9ydCgnLi9wbHVnaW5zL3Zpc3VhbC1lZGl0b3Ivdml0ZS1wbHVnaW4tcmVhY3QtaW5saW5lLWVkaXRvci5qcycpKS5kZWZhdWx0O1xuXHRlZGl0TW9kZURldlBsdWdpbiA9IChhd2FpdCBpbXBvcnQoJy4vcGx1Z2lucy92aXN1YWwtZWRpdG9yL3ZpdGUtcGx1Z2luLWVkaXQtbW9kZS5qcycpKS5kZWZhdWx0O1xufVxuXG5jb25zdCBjb25maWdIb3Jpem9uc1ZpdGVFcnJvckhhbmRsZXIgPSBgXG5jb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKChtdXRhdGlvbnMpID0+IHtcblx0Zm9yIChjb25zdCBtdXRhdGlvbiBvZiBtdXRhdGlvbnMpIHtcblx0XHRmb3IgKGNvbnN0IGFkZGVkTm9kZSBvZiBtdXRhdGlvbi5hZGRlZE5vZGVzKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdGFkZGVkTm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5FTEVNRU5UX05PREUgJiZcblx0XHRcdFx0KFxuXHRcdFx0XHRcdGFkZGVkTm9kZS50YWdOYW1lPy50b0xvd2VyQ2FzZSgpID09PSAndml0ZS1lcnJvci1vdmVybGF5JyB8fFxuXHRcdFx0XHRcdGFkZGVkTm9kZS5jbGFzc0xpc3Q/LmNvbnRhaW5zKCdiYWNrZHJvcCcpXG5cdFx0XHRcdClcblx0XHRcdCkge1xuXHRcdFx0XHRoYW5kbGVWaXRlT3ZlcmxheShhZGRlZE5vZGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxufSk7XG5cbm9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCB7XG5cdGNoaWxkTGlzdDogdHJ1ZSxcblx0c3VidHJlZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIGhhbmRsZVZpdGVPdmVybGF5KG5vZGUpIHtcblx0aWYgKCFub2RlLnNoYWRvd1Jvb3QpIHtcblx0XHRyZXR1cm47XG5cdH1cblxuXHRjb25zdCBiYWNrZHJvcCA9IG5vZGUuc2hhZG93Um9vdC5xdWVyeVNlbGVjdG9yKCcuYmFja2Ryb3AnKTtcblxuXHRpZiAoYmFja2Ryb3ApIHtcblx0XHRjb25zdCBvdmVybGF5SHRtbCA9IGJhY2tkcm9wLm91dGVySFRNTDtcblx0XHRjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XG5cdFx0Y29uc3QgZG9jID0gcGFyc2VyLnBhcnNlRnJvbVN0cmluZyhvdmVybGF5SHRtbCwgJ3RleHQvaHRtbCcpO1xuXHRcdGNvbnN0IG1lc3NhZ2VCb2R5RWxlbWVudCA9IGRvYy5xdWVyeVNlbGVjdG9yKCcubWVzc2FnZS1ib2R5Jyk7XG5cdFx0Y29uc3QgZmlsZUVsZW1lbnQgPSBkb2MucXVlcnlTZWxlY3RvcignLmZpbGUnKTtcblx0XHRjb25zdCBtZXNzYWdlVGV4dCA9IG1lc3NhZ2VCb2R5RWxlbWVudCA/IG1lc3NhZ2VCb2R5RWxlbWVudC50ZXh0Q29udGVudC50cmltKCkgOiAnJztcblx0XHRjb25zdCBmaWxlVGV4dCA9IGZpbGVFbGVtZW50ID8gZmlsZUVsZW1lbnQudGV4dENvbnRlbnQudHJpbSgpIDogJyc7XG5cdFx0Y29uc3QgZXJyb3IgPSBtZXNzYWdlVGV4dCArIChmaWxlVGV4dCA/ICcgRmlsZTonICsgZmlsZVRleHQgOiAnJyk7XG5cblx0XHR3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHtcblx0XHRcdHR5cGU6ICdob3Jpem9ucy12aXRlLWVycm9yJyxcblx0XHRcdGVycm9yLFxuXHRcdH0sICcqJyk7XG5cdH1cbn1cbmA7XG5cbmNvbnN0IGNvbmZpZ0hvcml6b25zUnVudGltZUVycm9ySGFuZGxlciA9IGBcbndpbmRvdy5vbmVycm9yID0gKG1lc3NhZ2UsIHNvdXJjZSwgbGluZW5vLCBjb2xubywgZXJyb3JPYmopID0+IHtcblx0Y29uc3QgZXJyb3JEZXRhaWxzID0gZXJyb3JPYmogPyBKU09OLnN0cmluZ2lmeSh7XG5cdFx0bmFtZTogZXJyb3JPYmoubmFtZSxcblx0XHRtZXNzYWdlOiBlcnJvck9iai5tZXNzYWdlLFxuXHRcdHN0YWNrOiBlcnJvck9iai5zdGFjayxcblx0XHRzb3VyY2UsXG5cdFx0bGluZW5vLFxuXHRcdGNvbG5vLFxuXHR9KSA6IG51bGw7XG5cblx0d2luZG93LnBhcmVudC5wb3N0TWVzc2FnZSh7XG5cdFx0dHlwZTogJ2hvcml6b25zLXJ1bnRpbWUtZXJyb3InLFxuXHRcdG1lc3NhZ2UsXG5cdFx0ZXJyb3I6IGVycm9yRGV0YWlsc1xuXHR9LCAnKicpO1xufTtcbmA7XG5cbmNvbnN0IGNvbmZpZ0hvcml6b25zQ29uc29sZUVycnJvSGFuZGxlciA9IGBcbmNvbnN0IG9yaWdpbmFsQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvcjtcbmNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbiguLi5hcmdzKSB7XG5cdG9yaWdpbmFsQ29uc29sZUVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuXG5cdGxldCBlcnJvclN0cmluZyA9ICcnO1xuXG5cdGZvciAobGV0IGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7IGkrKykge1xuXHRcdGNvbnN0IGFyZyA9IGFyZ3NbaV07XG5cdFx0aWYgKGFyZyBpbnN0YW5jZW9mIEVycm9yKSB7XG5cdFx0XHRlcnJvclN0cmluZyA9IGFyZy5zdGFjayB8fCBcXGBcXCR7YXJnLm5hbWV9OiBcXCR7YXJnLm1lc3NhZ2V9XFxgO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFlcnJvclN0cmluZykge1xuXHRcdGVycm9yU3RyaW5nID0gYXJncy5tYXAoYXJnID0+IHR5cGVvZiBhcmcgPT09ICdvYmplY3QnID8gSlNPTi5zdHJpbmdpZnkoYXJnKSA6IFN0cmluZyhhcmcpKS5qb2luKCcgJyk7XG5cdH1cblxuXHR3aW5kb3cucGFyZW50LnBvc3RNZXNzYWdlKHtcblx0XHR0eXBlOiAnaG9yaXpvbnMtY29uc29sZS1lcnJvcicsXG5cdFx0ZXJyb3I6IGVycm9yU3RyaW5nXG5cdH0sICcqJyk7XG59O1xuYDtcblxuY29uc3QgY29uZmlnV2luZG93RmV0Y2hNb25rZXlQYXRjaCA9IGBcbmNvbnN0IG9yaWdpbmFsRmV0Y2ggPSB3aW5kb3cuZmV0Y2g7XG5cbndpbmRvdy5mZXRjaCA9IGZ1bmN0aW9uKC4uLmFyZ3MpIHtcblx0Y29uc3QgdXJsID0gYXJnc1swXSBpbnN0YW5jZW9mIFJlcXVlc3QgPyBhcmdzWzBdLnVybCA6IGFyZ3NbMF07XG5cblx0Ly8gU2tpcCBXZWJTb2NrZXQgVVJMc1xuXHRpZiAodXJsLnN0YXJ0c1dpdGgoJ3dzOicpIHx8IHVybC5zdGFydHNXaXRoKCd3c3M6JykpIHtcblx0XHRyZXR1cm4gb3JpZ2luYWxGZXRjaC5hcHBseSh0aGlzLCBhcmdzKTtcblx0fVxuXG5cdHJldHVybiBvcmlnaW5hbEZldGNoLmFwcGx5KHRoaXMsIGFyZ3MpXG5cdFx0LnRoZW4oYXN5bmMgcmVzcG9uc2UgPT4ge1xuXHRcdFx0Y29uc3QgY29udGVudFR5cGUgPSByZXNwb25zZS5oZWFkZXJzLmdldCgnQ29udGVudC1UeXBlJykgfHwgJyc7XG5cblx0XHRcdC8vIEV4Y2x1ZGUgSFRNTCBkb2N1bWVudCByZXNwb25zZXNcblx0XHRcdGNvbnN0IGlzRG9jdW1lbnRSZXNwb25zZSA9XG5cdFx0XHRcdGNvbnRlbnRUeXBlLmluY2x1ZGVzKCd0ZXh0L2h0bWwnKSB8fFxuXHRcdFx0XHRjb250ZW50VHlwZS5pbmNsdWRlcygnYXBwbGljYXRpb24veGh0bWwreG1sJyk7XG5cblx0XHRcdGlmICghcmVzcG9uc2Uub2sgJiYgIWlzRG9jdW1lbnRSZXNwb25zZSkge1xuXHRcdFx0XHRcdGNvbnN0IHJlc3BvbnNlQ2xvbmUgPSByZXNwb25zZS5jbG9uZSgpO1xuXHRcdFx0XHRcdGNvbnN0IGVycm9yRnJvbVJlcyA9IGF3YWl0IHJlc3BvbnNlQ2xvbmUudGV4dCgpO1xuXHRcdFx0XHRcdGNvbnN0IHJlcXVlc3RVcmwgPSByZXNwb25zZS51cmw7XG5cdFx0XHRcdFx0Y29uc29sZS5lcnJvcihcXGBGZXRjaCBlcnJvciBmcm9tIFxcJHtyZXF1ZXN0VXJsfTogXFwke2Vycm9yRnJvbVJlc31cXGApO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2U7XG5cdFx0fSlcblx0XHQuY2F0Y2goZXJyb3IgPT4ge1xuXHRcdFx0aWYgKCF1cmwubWF0Y2goL1xcLmh0bWw/JC9pKSkge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGVycm9yKTtcblx0XHRcdH1cblxuXHRcdFx0dGhyb3cgZXJyb3I7XG5cdFx0fSk7XG59O1xuYDtcblxuY29uc3QgYWRkVHJhbnNmb3JtSW5kZXhIdG1sID0ge1xuXHRuYW1lOiAnYWRkLXRyYW5zZm9ybS1pbmRleC1odG1sJyxcblx0dHJhbnNmb3JtSW5kZXhIdG1sKGh0bWwpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0aHRtbCxcblx0XHRcdHRhZ3M6IFtcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRhZzogJ3NjcmlwdCcsXG5cdFx0XHRcdFx0YXR0cnM6IHsgdHlwZTogJ21vZHVsZScgfSxcblx0XHRcdFx0XHRjaGlsZHJlbjogY29uZmlnSG9yaXpvbnNSdW50aW1lRXJyb3JIYW5kbGVyLFxuXHRcdFx0XHRcdGluamVjdFRvOiAnaGVhZCcsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0YWc6ICdzY3JpcHQnLFxuXHRcdFx0XHRcdGF0dHJzOiB7IHR5cGU6ICdtb2R1bGUnIH0sXG5cdFx0XHRcdFx0Y2hpbGRyZW46IGNvbmZpZ0hvcml6b25zVml0ZUVycm9ySGFuZGxlcixcblx0XHRcdFx0XHRpbmplY3RUbzogJ2hlYWQnLFxuXHRcdFx0XHR9LFxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGFnOiAnc2NyaXB0Jyxcblx0XHRcdFx0XHRhdHRyczoge3R5cGU6ICdtb2R1bGUnfSxcblx0XHRcdFx0XHRjaGlsZHJlbjogY29uZmlnSG9yaXpvbnNDb25zb2xlRXJycm9IYW5kbGVyLFxuXHRcdFx0XHRcdGluamVjdFRvOiAnaGVhZCcsXG5cdFx0XHRcdH0sXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0YWc6ICdzY3JpcHQnLFxuXHRcdFx0XHRcdGF0dHJzOiB7IHR5cGU6ICdtb2R1bGUnIH0sXG5cdFx0XHRcdFx0Y2hpbGRyZW46IGNvbmZpZ1dpbmRvd0ZldGNoTW9ua2V5UGF0Y2gsXG5cdFx0XHRcdFx0aW5qZWN0VG86ICdoZWFkJyxcblx0XHRcdFx0fSxcblx0XHRcdF0sXG5cdFx0fTtcblx0fSxcbn07XG5cbmNvbnNvbGUud2FybiA9ICgpID0+IHt9O1xuXG5jb25zdCBsb2dnZXIgPSBjcmVhdGVMb2dnZXIoKVxuY29uc3QgbG9nZ2VyRXJyb3IgPSBsb2dnZXIuZXJyb3JcblxubG9nZ2VyLmVycm9yID0gKG1zZywgb3B0aW9ucykgPT4ge1xuXHRpZiAob3B0aW9ucz8uZXJyb3I/LnRvU3RyaW5nKCkuaW5jbHVkZXMoJ0Nzc1N5bnRheEVycm9yOiBbcG9zdGNzc10nKSkge1xuXHRcdHJldHVybjtcblx0fVxuXG5cdGxvZ2dlckVycm9yKG1zZywgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG5cdGN1c3RvbUxvZ2dlcjogbG9nZ2VyLFxuXHRwbHVnaW5zOiBbXG5cdFx0Li4uKGlzRGV2ID8gW2lubGluZUVkaXRQbHVnaW4oKSwgZWRpdE1vZGVEZXZQbHVnaW4oKV0gOiBbXSksXG5cdFx0cmVhY3QoKSxcblx0XHRhZGRUcmFuc2Zvcm1JbmRleEh0bWwsXG5cdFx0Vml0ZVBXQSh7XG5cdFx0XHRyZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcblx0XHRcdHdvcmtib3g6IHtcblx0XHRcdFx0Z2xvYlBhdHRlcm5zOiBbJyoqLyoue2pzLGNzcyxodG1sLGljbyxwbmcsc3ZnLHdvZmYyfSddLFxuXHRcdFx0XHRuYXZpZ2F0ZUZhbGxiYWNrOiAnL2luZGV4Lmh0bWwnLFxuXHRcdFx0XHRuYXZpZ2F0ZUZhbGxiYWNrRGVueWxpc3Q6IFsvXlxcL2FwaS8sIC9eXFwvXy8sIC9eXFwvYWRtaW4vXSxcblx0XHRcdFx0cnVudGltZUNhY2hpbmc6IFtcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2FnYXJjaC1hclxcLmNvbVxcLy4qL2ksXG5cdFx0XHRcdFx0XHRoYW5kbGVyOiAnTmV0d29ya0ZpcnN0Jyxcblx0XHRcdFx0XHRcdG9wdGlvbnM6IHtcblx0XHRcdFx0XHRcdFx0Y2FjaGVOYW1lOiAnYWdhcmNoLWFyLWNhY2hlJyxcblx0XHRcdFx0XHRcdFx0ZXhwaXJhdGlvbjoge1xuXHRcdFx0XHRcdFx0XHRcdG1heEVudHJpZXM6IDEwMCxcblx0XHRcdFx0XHRcdFx0XHRtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiA3IC8vIDcgZGF5c1xuXHRcdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdFx0XHRjYWNoZWFibGVSZXNwb25zZToge1xuXHRcdFx0XHRcdFx0XHRcdHN0YXR1c2VzOiBbMCwgMjAwXVxuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcLy4qXFwuKHBuZ3xqcGd8anBlZ3xzdmd8Z2lmfHdlYnApJC8sXG5cdFx0XHRcdFx0XHRoYW5kbGVyOiAnQ2FjaGVGaXJzdCcsXG5cdFx0XHRcdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdFx0XHRcdGNhY2hlTmFtZTogJ2ltYWdlcy1jYWNoZScsXG5cdFx0XHRcdFx0XHRcdGV4cGlyYXRpb246IHtcblx0XHRcdFx0XHRcdFx0XHRtYXhFbnRyaWVzOiAxMDAsXG5cdFx0XHRcdFx0XHRcdFx0bWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzAgLy8gMzAgZGF5c1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRdXG5cdFx0XHR9LFxuXHRcdFx0bWFuaWZlc3Q6IHtcblx0XHRcdFx0bmFtZTogJ0FHQVJDSC1BUiAtIFJlZCBTb2NpYWwnLFxuXHRcdFx0XHRzaG9ydF9uYW1lOiAnQUdBUkNILUFSJyxcblx0XHRcdFx0ZGVzY3JpcHRpb246ICdDb25cdTAwRTljdGF0ZSBjb24gcGVyc29uYXMgYWZpbmVzIGEgdm9zLCBjZXJjYSB0dXlvIHkgY29uIGdhbmFzIGRlIGhhY2VyIGxvIG1pc21vIHF1ZSB2b3MgY3VhbmRvIHF1aWVyYXMsIHNpbiBhdGFkdXJhcy4nLFxuXHRcdFx0XHR0aGVtZV9jb2xvcjogJyMwYjEyMWInLFxuXHRcdFx0XHRiYWNrZ3JvdW5kX2NvbG9yOiAnIzBiMTIxYicsXG5cdFx0XHRcdGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcblx0XHRcdFx0b3JpZW50YXRpb246ICdwb3J0cmFpdCcsXG5cdFx0XHRcdHNjb3BlOiAnLycsXG5cdFx0XHRcdHN0YXJ0X3VybDogJy8nLFxuXHRcdFx0XHRpY29uczogW1xuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNyYzogJ3B3YS0xOTJ4MTkyLnBuZycsXG5cdFx0XHRcdFx0XHRzaXplczogJzE5MngxOTInLFxuXHRcdFx0XHRcdFx0dHlwZTogJ2ltYWdlL3BuZydcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNyYzogJ3B3YS01MTJ4NTEyLnBuZycsXG5cdFx0XHRcdFx0XHRzaXplczogJzUxMng1MTInLFxuXHRcdFx0XHRcdFx0dHlwZTogJ2ltYWdlL3BuZydcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNyYzogJ3B3YS01MTJ4NTEyLnBuZycsXG5cdFx0XHRcdFx0XHRzaXplczogJzUxMng1MTInLFxuXHRcdFx0XHRcdFx0dHlwZTogJ2ltYWdlL3BuZycsXG5cdFx0XHRcdFx0XHRwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XSxcblx0XHRcdFx0c2hvcnRjdXRzOiBbXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bmFtZTogJ0Rlc2N1YnJpcicsXG5cdFx0XHRcdFx0XHRzaG9ydF9uYW1lOiAnRGVzY3VicmlyJyxcblx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiAnRGVzY3VicmUgbnVldmFzIHBlcnNvbmFzJyxcblx0XHRcdFx0XHRcdHVybDogJy9kaXNjb3ZlcicsXG5cdFx0XHRcdFx0XHRpY29uczogW3sgc3JjOiAncHdhLTE5MngxOTIucG5nJywgc2l6ZXM6ICcxOTJ4MTkyJyB9XVxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bmFtZTogJ0NoYXQnLFxuXHRcdFx0XHRcdFx0c2hvcnRfbmFtZTogJ0NoYXQnLFxuXHRcdFx0XHRcdFx0ZGVzY3JpcHRpb246ICdDb252ZXJzYSBjb24gdHVzIG1hdGNoZXMnLFxuXHRcdFx0XHRcdFx0dXJsOiAnL2NoYXQnLFxuXHRcdFx0XHRcdFx0aWNvbnM6IFt7IHNyYzogJ3B3YS0xOTJ4MTkyLnBuZycsIHNpemVzOiAnMTkyeDE5MicgfV1cblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdG5hbWU6ICdQZXJmaWwnLFxuXHRcdFx0XHRcdFx0c2hvcnRfbmFtZTogJ1BlcmZpbCcsXG5cdFx0XHRcdFx0XHRkZXNjcmlwdGlvbjogJ0dlc3Rpb25hIHR1IHBlcmZpbCcsXG5cdFx0XHRcdFx0XHR1cmw6ICcvcHJvZmlsZScsXG5cdFx0XHRcdFx0XHRpY29uczogW3sgc3JjOiAncHdhLTE5MngxOTIucG5nJywgc2l6ZXM6ICcxOTJ4MTkyJyB9XVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XVxuXHRcdFx0fVxuXHRcdH0pLFxuXHRdLFxuXHRzZXJ2ZXI6IHtcblx0XHRjb3JzOiB0cnVlLFxuXHRcdGhlYWRlcnM6IHtcblx0XHRcdCdDcm9zcy1PcmlnaW4tRW1iZWRkZXItUG9saWN5JzogJ2NyZWRlbnRpYWxsZXNzJyxcblx0XHR9LFxuXHRcdGFsbG93ZWRIb3N0czogdHJ1ZSxcblx0fSxcblx0cmVzb2x2ZToge1xuXHRcdGV4dGVuc2lvbnM6IFsnLmpzeCcsICcuanMnLCAnLnRzeCcsICcudHMnLCAnLmpzb24nLCBdLFxuXHRcdGFsaWFzOiB7XG5cdFx0XHQnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuXHRcdH0sXG5cdH0sXG5cdGJ1aWxkOiB7XG5cdFx0Ly8gT3B0aW1pemFjaW9uZXMgcGFyYSByZWR1Y2lyIHRpZW1wbyBkZSBidWlsZFxuXHRcdG1pbmlmeTogJ3RlcnNlcicsXG5cdFx0dGVyc2VyT3B0aW9uczoge1xuXHRcdFx0Y29tcHJlc3M6IHtcblx0XHRcdFx0ZHJvcF9jb25zb2xlOiB0cnVlLFxuXHRcdFx0XHRkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuXHRcdFx0fSxcblx0XHR9LFxuXHRcdHJvbGx1cE9wdGlvbnM6IHtcblx0XHRcdGV4dGVybmFsOiBbXG5cdFx0XHRcdCdAYmFiZWwvcGFyc2VyJyxcblx0XHRcdFx0J0BiYWJlbC90cmF2ZXJzZScsXG5cdFx0XHRcdCdAYmFiZWwvZ2VuZXJhdG9yJyxcblx0XHRcdFx0J0BiYWJlbC90eXBlcydcblx0XHRcdF0sXG5cdFx0XHRvdXRwdXQ6IHtcblx0XHRcdFx0bWFudWFsQ2h1bmtzOiB7XG5cdFx0XHRcdFx0Ly8gU2VwYXJhciB2ZW5kb3IgY2h1bmtzIHBhcmEgbWVqb3IgY2FjaGluZ1xuXHRcdFx0XHRcdHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcblx0XHRcdFx0XHRzdXBhYmFzZTogWydAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXSxcblx0XHRcdFx0XHR1aTogWydAcmFkaXgtdWkvcmVhY3QtZGlhbG9nJywgJ0ByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51JywgJ0ByYWRpeC11aS9yZWFjdC1zZWxlY3QnXSxcblx0XHRcdFx0XHR1dGlsczogWydmcmFtZXItbW90aW9uJywgJ2RhdGUtZm5zJywgJ2x1Y2lkZS1yZWFjdCddXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdC8vIENvbmZpZ3VyYWNpb25lcyBhZGljaW9uYWxlcyBwYXJhIG9wdGltaXphY2lcdTAwRjNuXG5cdFx0Y2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuXHRcdHNvdXJjZW1hcDogZmFsc2UsIC8vIERlc2hhYmlsaXRhciBzb3VyY2VtYXBzIGVuIHByb2R1Y2NpXHUwMEYzblxuXHRcdHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSwgLy8gRGVzaGFiaWxpdGFyIHJlcG9ydGUgZGUgdGFtYVx1MDBGMW8gY29tcHJpbWlkb1xuXHR9XG59KTsiXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQW9WLE9BQU8sVUFBVTtBQUNyVyxTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGFBQWE7QUFDdEIsT0FBTyxtQkFBbUI7QUFDMUIsT0FBTyxjQUFjO0FBQ3JCLFlBQVksT0FBTztBQUNuQixPQUFPLFFBQVE7QUFPZixTQUFTLFlBQVksUUFBUTtBQUMzQixRQUFNLFFBQVEsT0FBTyxNQUFNLEdBQUc7QUFFOUIsTUFBSSxNQUFNLFNBQVMsR0FBRztBQUNwQixXQUFPO0FBQUEsRUFDVDtBQUVBLFFBQU0sU0FBUyxTQUFTLE1BQU0sR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUN4QyxRQUFNLE9BQU8sU0FBUyxNQUFN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QUFNO0FBQUEsWUFDTixZQUFZO0FBQUEsWUFDWixhQUFhO0FBQUEsWUFDYixLQUFLO0FBQUEsWUFDTCxPQUFPLENBQUMsRUFBRSxLQUFLLG1CQUFtQixPQUFPLFVBQVUsQ0FBQztBQUFBLFVBQ3JEO0FBQUEsVUFDQTtBQUFBLFlBQ0MsTUFBTTtBQUFBLFlBQ04sWUFBWTtBQUFBLFlBQ1osYUFBYTtBQUFBLFlBQ2IsS0FBSztBQUFBLFlBQ0wsT0FBTyxDQUFDLEVBQUUsS0FBSyxtQkFBbUIsT0FBTyxVQUFVLENBQUM7QUFBQSxVQUNyRDtBQUFBLFVBQ0E7QUFBQSxZQUNDLE1BQU07QUFBQSxZQUNOLFlBQVk7QUFBQSxZQUNaLGFBQWE7QUFBQSxZQUNiLEtBQUs7QUFBQSxZQUNMLE9BQU8sQ0FBQyxFQUFFLEtBQUssbUJBQW1CLE9BQU8sVUFBVSxDQUFDO0FBQUEsVUFDckQ7QUFBQSxRQUNEO0FBQUEsTUFDRDtBQUFBLElBQ0QsQ0FBQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNSLGdDQUFnQztBQUFBLElBQ2pDO0FBQUEsSUFDQSxjQUFjO0FBQUEsRUFDZjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1IsWUFBWSxDQUFDLFFBQVEsT0FBTyxRQUFRLE9BQU8sT0FBUztBQUFBLElBQ3BELE9BQU87QUFBQSxNQUNOLEtBQUtDLE1BQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDckM7QUFBQSxFQUNEO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVOLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNkLFVBQVU7QUFBQSxRQUNULGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxNQUNoQjtBQUFBLElBQ0Q7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNkLFVBQVU7QUFBQSxRQUNUO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRDtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ1AsY0FBYztBQUFBO0FBQUEsVUFFYixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsVUFBVSxDQUFDLHVCQUF1QjtBQUFBLFVBQ2xDLElBQUksQ0FBQywwQkFBMEIsaUNBQWlDLHdCQUF3QjtBQUFBLFVBQ3hGLE9BQU8sQ0FBQyxpQkFBaUIsWUFBWSxjQUFjO0FBQUEsUUFDcEQ7QUFBQSxNQUNEO0FBQUEsSUFDRDtBQUFBO0FBQUEsSUFFQSx1QkFBdUI7QUFBQSxJQUN2QixXQUFXO0FBQUE7QUFBQSxJQUNYLHNCQUFzQjtBQUFBO0FBQUEsRUFDdkI7QUFDRCxDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgIl9fZGlybmFtZSIsICJmaWxlVVJMVG9QYXRoIiwgIl9fZGlybmFtZSIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsIiwgIl9fZmlsZW5hbWUiLCAicGF0aCIsICJpbmxpbmVFZGl0UGx1Z2luIiwgInBhdGgiXQp9Cg==
