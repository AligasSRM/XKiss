export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    return new Response(
      JSON.stringify({
        service: "XKiss Worker",
        status: "online",
        path: url.pathname
      }),
      {
        headers: {
          "content-type": "application/json; charset=UTF-8"
        }
      }
    );
  }
};
