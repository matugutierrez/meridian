const { createKernel } = require("./core/kernel");

const kernel = createKernel();
kernel.start();

process.on("SIGTERM", () => kernel.stop());
process.on("SIGINT", () => { kernel.stop(); process.exit(0); });
