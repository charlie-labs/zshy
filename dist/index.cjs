#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const main_js_1 = require("./main.cjs");
const utils_js_1 = require("./utils.cjs");
// Run the script
(0, main_js_1.main)().catch((error) => {
    (0, utils_js_1.emojiLog)("❌", `Build failed: ${error}`, "error");
    process.exit(1);
});
//# sourceMappingURL=index.js.map