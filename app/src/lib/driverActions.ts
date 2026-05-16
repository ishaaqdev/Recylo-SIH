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

export const createCollectionLog = async (
  household_id: string, 
  driver_id?: string,
  segregation_status: "pass" | "mixed" = "pass"
) => {
  // Get current session to identify driver
  const { data: { session } } = await supabase.auth.getSession();
  
  // Get driver info if logged in
  let driverIdToUse = driver_id;
  if (session?.user?.id && !driverIdToUse) {
    const { data: driverData } = await supabase
      .from("drivers")
      .select("driver_id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    driverIdToUse = driverData?.driver_id;
  }

  // Create collection log
  const { data, error } = await supabase
    .from("collection_logs")
    .insert({
      household_id,
      status: "collected",
      driver_id: driverIdToUse || null,
      segregation_status,
    })
    .select()
    .single();
  
  if (error) throw error;

  // Award points based on current level and advance level for proper collection
  if (segregation_status === "pass") {
    const household = await getHouseholdById(household_id);
    if (household) {
      const currentLevel = household.level || 1;
      const pointsToAward = currentLevel * 50; // Level 1 = 50 pts, Level 2 = 100 pts, etc.
      const newPoints = (household.points || 0) + pointsToAward;
      const newLevel = currentLevel + 1; // Advance to next level
      
      const { error: updateError } = await supabase
        .from("households")
        .update({
          points: newPoints,
          level: newLevel,
        })
        .eq("id", household_id);
      
      if (updateError) {
        console.error("Failed to update household points/level:", updateError);
      } else {
        console.log(`Household ${household_id} earned ${pointsToAward} points (now ${newPoints}) and advanced to level ${newLevel}`);
      }
    }
  }

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
  // Get current session to identify driver
  const { data: { session } } = await supabase.auth.getSession();
  
  // Get driver info
  let driverId: string | null = null;
  if (session?.user?.id) {
    const { data: driverData } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();
    driverId = driverData?.id || null;
  }

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

  // Update user_tasks record to completed
  const { error: taskError } = await supabase
    .from("user_tasks")
    .upsert({
      task_id: taskId,
      household_id: householdId,
      status: "completed",
      completed_at: new Date().toISOString(),
    }, { onConflict: 'task_id,household_id' });

  if (taskError) {
    // If upsert fails, try insert
    await supabase
      .from("user_tasks")
      .insert({
        task_id: taskId,
        household_id: householdId,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
  }

  // Log task completion with driver info
  await supabase
    .from("task_completions")
    .insert({
      task_id: taskId,
      household_id: householdId,
      driver_id: driverId,
      points_awarded: pointsReward,
      level_awarded: levelReward,
    });

  return { success: true, pointsAwarded: pointsReward, levelAwarded: levelReward };
};