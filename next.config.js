const path = require("path");

module.exports = {
  experimental: {
    turbo: {
      resolveAlias: {
        "@": path.resolve(__dirname, "Client/src"),
      },
    },
  },
};
