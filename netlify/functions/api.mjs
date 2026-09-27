import worker from "../../worker.js";

export default async function handler(request) {
  try {
    return await worker.fetch(request, process.env);
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        message: "XKiss Netlify backend error."
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=UTF-8"
        }
      }
    );
  }
}
