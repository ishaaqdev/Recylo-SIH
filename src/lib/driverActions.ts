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

// Task verification functions
export interface TaskVerificationData {
  type: "task_verification";
  taskId: string;
  householdId: string;
  timestamp: number;
}

export const parseTaskQRCode = (qrData: string): TaskVerificationData | null => {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.type === "task_verification" && parsed.taskId && parsed.householdId) {
      return parsed as TaskVerificationData;
    }
    return null;
  } catch {
    return null;
  }
};

export const getTaskDetails = async (taskId: string) => {
  const { data, error } = await supabase
    .from("rewards_tasks")
    .select("*")
    .eq("id", taskId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const getHouseholdById = async (householdId: string) => {
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .eq("id", householdId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const confirmTaskCompletion = async (
  taskId: string,
  householdId: string,
  pointsReward: number,
  levelReward: number
) => {
  // Get current household data
  const household = await getHouseholdById(householdId);
  if (!household) throw new Error("Household not found");

  // Update household points and level
  const { error: updateError } = await supabase
    .from("households")
    .update({
      points: household.points + pointsReward,
      level: household.level + levelReward,
    })
    .eq("id", householdId);

  if (updateError) throw updateError;

  // Update or create user_tasks record
  const { error: taskError } = await supabase
    .from("user_tasks")
    .insert({
      task_id: taskId,
      household_id: householdId,
      status: "completed",
      completed_at: new Date().toISOString(),
    });

  if (taskError) throw taskError;

  return { success: true, pointsAwarded: pointsReward, levelAwarded: levelReward };
};