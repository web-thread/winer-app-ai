/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OpenAI from 'openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://winer-app-ai.pages.dev',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env, ctx) {
	// Handle CORS preflight requests
	if (request.method === 'OPTIONS') {
	  return new Response(null, { headers: corsHeaders });
	}
	
	// Only process POST requests
	if (request.method !== 'POST') {
	  return new Response(JSON.stringify({ error: `${request.method} method not allowed.`}), { status: 405, headers: corsHeaders })
	}
	
	const openai = new OpenAI({
	  apiKey: env.OPENAI_API_KEY,
	  baseURL: 'https://gateway.ai.cloudflare.com/v1/03d6cfea54157c57bbec75de407eb8fb/winer-app/openai'
	});
	
	try {
	  const chatMessages = await request.json()

	  const { choices } = await openai.chat.completions.create({
		model: 'gpt-4',
		messages: chatMessages,
		temperature: 0.65,
		frequency_penalty: 0.5
	  });
	  
	  return new Response(JSON.stringify(choices), { headers: corsHeaders });
	} catch(e) {
	  return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
	}
  },
};