import type { Request, Response } from "express";

type ExpressApp = (req: Request, res: Response) => void | Promise<void>;

let cachedApp: ExpressApp | null = null;

async function getApp(): Promise<ExpressApp> {
  if (cachedApp) {
    return cachedApp;
  }

  const module = await import("../backend/dist/server.js");
  cachedApp = module.default as ExpressApp;
  return cachedApp;
}

export default async function handler(
  req: Request,
  res: Response,
): Promise<void> {
  const app = await getApp();
  await app(req, res);
}
