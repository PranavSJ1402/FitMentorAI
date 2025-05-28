// lib/vapi.ts
import Vapi from '@vapi-ai/web';

export const VapiInstance = new Vapi(
  process.env.NEXT_PUBLIC_VAPI_API_KEY || ""
);
