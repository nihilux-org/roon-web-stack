describe("roon-server-address.ts test suite", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("should default to null ip and port 9100 when no env vars are set", async () => {
    delete process.env.ROON_SERVER_IP;
    delete process.env.ROON_SERVER_PORT;

    const { roonServerAddress } = await import("./roon-server-address");

    expect(roonServerAddress).toEqual({ host: undefined, port: 9330 });
  });

  it("should read the ip and port from env vars", async () => {
    vi.stubEnv("ROON_SERVER_IP", "10.0.0.42");
    vi.stubEnv("ROON_SERVER_PORT", "9333");

    const { roonServerAddress } = await import("./roon-server-address");

    expect(roonServerAddress).toEqual({ host: "10.0.0.42", port: 9333 });
  });

  it("should treat an empty ip as absent and default the port", async () => {
    vi.stubEnv("ROON_SERVER_IP", "");

    const { roonServerAddress } = await import("./roon-server-address");

    expect(roonServerAddress).toEqual({ host: undefined, port: 9330 });
  });

  it("should fall back to the default port when the port env var is not a number", async () => {
    vi.stubEnv("ROON_SERVER_IP", "10.0.0.42");
    vi.stubEnv("ROON_SERVER_PORT", "not_a_port");

    const { roonServerAddress } = await import("./roon-server-address");

    expect(roonServerAddress).toEqual({ host: "10.0.0.42", port: 9330 });
  });
});
