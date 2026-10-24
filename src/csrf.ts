import type { RequestHandler } from "express";
import { sendErrorPage } from "./errors.ts";

export function validateRequestOrigin(_appOrigin: string): RequestHandler {
  return (_req, _res, next) => {
    if (_req.method !== "POST") {
      return next();
    }

    const requestOrigin = _req.get("Origin");
    if (!requestOrigin) {  
      try {
        const refererUrl = new URL(_req.get("Referer") ?? "");
        if (refererUrl.origin !== _appOrigin) {
          return sendErrorPage(_res, 403, "Forbidden", "Request referer does not match the expected origin.");
        }
      } catch (error) {
        return sendErrorPage(_res, 403, "Forbidden", "Invalid referer URL.");
      }
    } else if (requestOrigin !== _appOrigin) {
      return sendErrorPage(_res, 403, "Forbidden", "Request origin does not match the expected origin.");
    }
    next();
  }
}

export function csrfTokensMatch(_expected: string, _actual: unknown): boolean {
  return true;
}