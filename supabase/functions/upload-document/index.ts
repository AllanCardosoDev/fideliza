// Supabase Edge Function — upload-document
// Faz upload de arquivo para Supabase Storage

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Obter token do header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Sem autenticação" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Inicializar Supabase com token do usuário
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Parsear FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string | null;
    const clientName = formData.get("clientName") as string | null;
    const documentType = formData.get("documentType") as string | null;

    if (!file || !clientId || !clientName) {
      return new Response(
        JSON.stringify({
          error: "Campos obrigatórios: file, clientId, clientName",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Sanitizar nome do cliente
    const safeName = clientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const docType = (documentType || "documento").replace(/\s+/g, "_");

    // Caminho: clientes/{clientId}/{docType}/{filename}
    const path = `clientes/${clientId}/${docType}/${Date.now()}_${file.name}`;

    // Fazer upload para storage
    const fileBuffer = await file.arrayBuffer();
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(path, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Erro ao fazer upload:", error);
      throw new Error(`Erro no storage: ${error.message}`);
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(path);

    return new Response(
      JSON.stringify({
        success: true,
        fileName: file.name,
        path,
        url: publicUrl,
        size: file.size,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Erro:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
