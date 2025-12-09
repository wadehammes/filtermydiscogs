import crypto from "node:crypto";
import OAuth from "oauth-1.0a";
import type { DiscogsCollection, DiscogsSearchResponse } from "src/types";

interface OAuthHeaders {
  Authorization: string;
}

interface FetchOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

interface DiscogsIdentity {
  id: number;
  username: string;
  resource_url: string;
  consumer_name: string;
  [key: string]: unknown;
}

interface DiscogsTokens {
  oauth_token: string;
  oauth_token_secret: string;
}

interface DiscogsAccessTokens {
  oauth_token: string;
  oauth_token_secret: string;
}

class DiscogsOAuthService {
  private oauth: OAuth;
  private consumerKey: string;
  private consumerSecret: string;
  private callbackUrl: string;

  constructor() {
    this.consumerKey = process.env.DISCOGS_CONSUMER_KEY || "";
    this.consumerSecret = process.env.DISCOGS_CONSUMER_SECRET || "";
    this.callbackUrl =
      process.env.DISCOGS_CALLBACK_URL ||
      "http://localhost:6767/api/auth/callback";

    if (!(this.consumerKey && this.consumerSecret)) {
      throw new Error("Discogs OAuth credentials not configured");
    }

    this.oauth = new OAuth({
      consumer: {
        key: this.consumerKey,
        secret: this.consumerSecret,
      },
      signature_method: "HMAC-SHA1",
      hash_function(base_string, key) {
        return crypto
          .createHmac("sha1", key)
          .update(base_string)
          .digest("base64");
      },
    });
  }

  private getOAuthHeaders(
    url: string,
    method: string,
    oauthToken: string,
    oauthTokenSecret: string,
    _additionalData: Record<string, string> = {},
  ): OAuthHeaders {
    const request_data = {
      url,
      method,
    };

    const token = {
      key: oauthToken,
      secret: oauthTokenSecret,
    };

    const oauthHeaders = this.oauth.toHeader(
      this.oauth.authorize(request_data, token),
    );

    return oauthHeaders as OAuthHeaders;
  }

  async makeAuthenticatedRequest(
    url: string,
    method: string = "GET",
    oauthToken: string,
    oauthTokenSecret: string,
    additionalData: Record<string, string> = {},
  ): Promise<unknown> {
    try {
      // For GET requests, add additional data as query parameters
      let requestUrl = url;
      if (method === "GET" && Object.keys(additionalData).length > 0) {
        const urlObj = new URL(url);
        Object.entries(additionalData).forEach(([key, value]) => {
          urlObj.searchParams.append(key, value);
        });
        requestUrl = urlObj.toString();
      }

      const oauthHeaders = this.getOAuthHeaders(
        requestUrl,
        method,
        oauthToken,
        oauthTokenSecret,
        additionalData,
      );

      console.log("OAuth authorization:", oauthHeaders);

      const fetchOptions: FetchOptions = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...oauthHeaders,
        },
      };

      // For POST requests, add body
      if (method === "POST" && Object.keys(additionalData).length > 0) {
        fetchOptions.body = JSON.stringify(additionalData);
      }

      const response = await fetch(requestUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error("OAuth request failed:", error);
      throw error;
    }
  }

  async getRequestToken(callbackUrl?: string): Promise<DiscogsTokens> {
    const url = "https://api.discogs.com/oauth/request_token";
    const method = "POST";
    const callback = callbackUrl || this.callbackUrl;

    const body = new URLSearchParams({
      oauth_callback: callback,
    });

    const request_data = {
      url,
      method,
      data: { oauth_callback: callback },
    };

    const oauthHeaders = this.oauth.toHeader(
      this.oauth.authorize(request_data),
    );

    console.log("Request token request:", {
      url,
      method,
      headers: oauthHeaders,
      body: body.toString(),
    });

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...oauthHeaders,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Request token error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Failed to get request token: ${response.status}`);
    }

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);

    return {
      oauth_token: params.get("oauth_token") || "",
      oauth_token_secret: params.get("oauth_token_secret") || "",
    };
  }

  getAuthorizationUrl(oauthToken: string): string {
    return `https://www.discogs.com/oauth/authorize?oauth_token=${oauthToken}`;
  }

  async getAccessToken(
    oauthToken: string,
    oauthTokenSecret: string,
    oauthVerifier: string,
  ): Promise<DiscogsAccessTokens> {
    const url = "https://api.discogs.com/oauth/access_token";
    const method = "POST";

    const body = new URLSearchParams({
      oauth_verifier: oauthVerifier,
    });

    const request_data = {
      url,
      method,
      data: { oauth_verifier: oauthVerifier },
    };

    const token = {
      key: oauthToken,
      secret: oauthTokenSecret,
    };

    const oauthHeaders = this.oauth.toHeader(
      this.oauth.authorize(request_data, token),
    );

    console.log("Access token request:", {
      url,
      method,
      headers: oauthHeaders,
      body: body.toString(),
    });

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...oauthHeaders,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Access token error response:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Failed to get access token: ${response.status}`);
    }

    const responseText = await response.text();
    const params = new URLSearchParams(responseText);

    return {
      oauth_token: params.get("oauth_token") || "",
      oauth_token_secret: params.get("oauth_token_secret") || "",
    };
  }

  async getIdentity(
    oauthToken: string,
    oauthTokenSecret: string,
  ): Promise<DiscogsIdentity> {
    return this.makeAuthenticatedRequest(
      "https://api.discogs.com/oauth/identity",
      "GET",
      oauthToken,
      oauthTokenSecret,
    ) as Promise<DiscogsIdentity>;
  }

  async getCollection(
    username: string,
    oauthToken: string,
    oauthTokenSecret: string,
    page: number = 1,
    perPage: number = 500,
    sort: string = "added",
    sortOrder: string = "desc",
  ): Promise<DiscogsCollection> {
    const url = `https://api.discogs.com/users/${username}/collection/folders/0/releases`;

    try {
      const result = await this.makeAuthenticatedRequest(
        url,
        "GET",
        oauthToken,
        oauthTokenSecret,
        {
          page: page.toString(),
          per_page: perPage.toString(),
          sort,
          sort_order: sortOrder,
        },
      );

      return result as DiscogsCollection;
    } catch (error) {
      console.error("getCollection error:", error);
      throw error;
    }
  }

  async searchReleases(
    oauthToken: string,
    oauthTokenSecret: string,
    query: string,
    page: number = 1,
    perPage: number = 100,
    type: string = "release",
    format?: string,
    year?: string,
    genre?: string,
    style?: string,
  ): Promise<DiscogsSearchResponse> {
    const url = "https://api.discogs.com/database/search";

    const searchParams: Record<string, string> = {
      q: query,
      type,
      page: page.toString(),
      per_page: perPage.toString(),
    };

    // Add optional filters
    if (format) searchParams.format = format;
    if (year) searchParams.year = year;
    if (genre) searchParams.genre = genre;
    if (style) searchParams.style = style;

    try {
      const result = await this.makeAuthenticatedRequest(
        url,
        "GET",
        oauthToken,
        oauthTokenSecret,
        searchParams,
      );

      return result as DiscogsSearchResponse;
    } catch (error) {
      console.error("searchReleases error:", error);
      throw error;
    }
  }
}

export const discogsOAuthService = new DiscogsOAuthService();
