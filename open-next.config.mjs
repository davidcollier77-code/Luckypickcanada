const config = {
  default: {
    override: {
      wrapper: "cloudflare",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
};

export default config;
