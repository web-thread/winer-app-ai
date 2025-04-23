/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { createClient } from "@supabase/supabase-js";

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
	
	
	const publickey = env.SUPABASE_API_KEY;
	if (!publickey) throw new Error(`Expected SUPABASE_API_KEY`);
	const url = 'https://ttyiyrfhnmzrguraslct.supabase.co';
	if (!url) throw new Error(`Expected SUPABASE_URL`);

	try {
	  const embedding = await request.json()

	  const supabase = createClient(url, publickey);

	  const { data } = await supabase.rpc('match_wines', {
		query_embedding: embedding,
		match_threshold: 0.40,
		match_count: 4
	  });
	  
	  return new Response(JSON.stringify(data), { headers: corsHeaders });
	} catch(e) {
	  return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
	}
  },
};