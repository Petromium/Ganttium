import { describe, expect, it } from "vitest";

type Env = NodeJS.ProcessEnv;

const baseEnv: Env = {
  NODE_ENV: "production",
};

async function loadResolver() {
  const mod: any = await import("../../server/db");
  if (typeof mod.resolveDbDriver !== "function") {
    throw new Error("resolveDbDriver export missing from server/db.ts");
  }
  return mod.resolveDbDriver as (env?: Env) => "pg" | "neon";
}

describe("resolveDbDriver", () => {
  it("defaults to pg driver", async () => {
    const resolve = await loadResolver();
    expect(resolve(baseEnv)).toBe("pg");
  });

  it("forces pg driver when running on Cloud Run (K_SERVICE)", async () => {
    const resolve = await loadResolver();
    expect(resolve({ ...baseEnv, K_SERVICE: "ganttium" })).toBe("pg");
  });

  it("forces pg driver when running inside Docker", async () => {
    const resolve = await loadResolver();
    expect(resolve({ ...baseEnv, DOCKER_ENV: "true" })).toBe("pg");
  });

  it("forces pg driver in development and test environments", async () => {
    const resolve = await loadResolver();
    expect(resolve({ NODE_ENV: "development" })).toBe("pg");
    expect(resolve({ NODE_ENV: "test" })).toBe("pg");
  });

  it("only enables neon driver when explicitly requested", async () => {
    const resolve = await loadResolver();
    expect(resolve({ ...baseEnv, USE_NEON_WEBSOCKETS: "true" })).toBe("neon");
  });

  it("allows forcing pg driver even when neon override is set", async () => {
    const resolve = await loadResolver();
    expect(
      resolve({
        ...baseEnv,
        USE_NEON_WEBSOCKETS: "true",
        FORCE_PG_DRIVER: "true",
      }),
    ).toBe("pg");
  });

  it("ignores neon override when Cloud Run requires pg driver", async () => {
    const resolve = await loadResolver();
    expect(
      resolve({
        ...baseEnv,
        USE_NEON_WEBSOCKETS: "true",
        K_SERVICE: "ganttium",
      }),
    ).toBe("pg");
  });
});

