import type { NextRequest } from "next/server";
import {
  createErrorResponse,
  getVerifiedUserFromRequestWithRateLimit,
} from "src/lib/api-helpers";
import { interpretCollectionCommandPrompt } from "src/lib/collection-command-interpret.server";
import { privateRouteJson } from "src/lib/private-route-response";
import { collectionCommandPromptBodySchema } from "src/lib/validation/collectionCommand.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

export async function POST(request: NextRequest) {
  try {
    const verified = await getVerifiedUserFromRequestWithRateLimit(
      request,
      true,
    );
    if ("error" in verified) {
      return verified.error;
    }

    const parsedBody = await parseRequestBody(
      request,
      collectionCommandPromptBodySchema,
    );
    if ("error" in parsedBody) {
      return privateRouteJson({ error: parsedBody.error }, { status: 400 });
    }

    const result = await interpretCollectionCommandPrompt(
      parsedBody.data.prompt,
    );

    if ("error" in result) {
      if (result.error === "not_configured") {
        return privateRouteJson(
          { error: "Collection command AI is not configured" },
          { status: 503 },
        );
      }

      return privateRouteJson(
        { error: "Could not interpret that command" },
        { status: 502 },
      );
    }

    return privateRouteJson({ intent: result.intent });
  } catch (error) {
    return createErrorResponse(error, {
      route: "/api/collection/interpret-prompt",
    });
  }
}
