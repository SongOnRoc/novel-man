const NEXT_BUILD_PHASE = "phase-production-build";

export function isStrictProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== NEXT_BUILD_PHASE;
}
