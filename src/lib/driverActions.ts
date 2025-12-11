import { supabase } from "@/integrations/supabase/client";

export const searchHouseholdByPhone = async (phone: string) => {
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .ilike("phone", `%${phone}%`)
    .limit(10);
  
  if (error) throw error;
  return data;
};

export const getHouseholdByQRCode = async (code: string) => {
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .eq("qr_code", code)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createCollectionLog = async (household_id: string) => {
  const { data, error } = await supabase
    .from("collection_logs")
    .insert({
      household_id,
      status: "collected",
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};