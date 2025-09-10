class OpenRouterBackend {
  constructor(settings) {
    this.settings = {
      apiUrl: "https://openrouter.ai/api/v1",
      ...settings,
    };
    this.controller = new AbortController();
  }

  async getResponse(prompt, params = {}, onToken) {
    const body = {
      model: this.settings.model,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      ...params,
    };

    const response = await fetch(`${this.settings.apiUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Title": "Waidrin",
        Authorization: `Bearer ${this.settings.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: this.controller.signal,
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    if (onToken) {
      onToken("", 0);
      onToken(content, 1);
    }

    return content;
  }

  async getResponseAsObject(prompt, schema, onToken) {
    const response = await this.getResponse(
      prompt,
      {
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "schema",
            strict: true,
            schema,
          },
        },
      },
      onToken,
    );

    return JSON.parse(response);
  }

  abort() {
    this.controller.abort();
  }

  isAbortError(error) {
    return error.name === "AbortError";
  }
}

export default class OpenRouterPlugin {
  async init(settings, context) {
    this.settings = settings;
    this.context = context;
  }

  async getBackends() {
    return {
      openrouter: new OpenRouterBackend(this.settings),
    };
  }
}