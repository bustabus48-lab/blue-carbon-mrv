import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

console.log("Carbon Accounting Engine Loaded!");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plot_id } = await req.json();

    if (!plot_id) {
      throw new Error('plot_id is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch Plot Data
    const { data: plot, error: plotError } = await supabase
      .from('sample_plots')
      .select('*')
      .eq('id', plot_id)
      .single();

    if (plotError || !plot) throw new Error(`Plot not found: ${plotError?.message}`);

    // 2. Fetch Latest Plot Measurement (Above Ground Biomass)
    const { data: latestMeasurement, error: measurementError } = await supabase
      .from('plot_measurements')
      .select('above_ground_biomass_tc_ha')
      .eq('plot_id', plot_id)
      .order('measurement_date', { ascending: false })
      .limit(1)
      .single();

    if (measurementError || !latestMeasurement) throw new Error("No above ground biomass measurements found for this plot.");

    // 3. Fetch Latest Soil C Density
    const { data: latestSoil, error: soilError } = await supabase
      .from('soil_samples')
      .select('soil_carbon_density')
      .eq('plot_id', plot_id)
      .not('soil_carbon_density', 'is', null) // Only get completed analyses
      .order('collected_date', { ascending: false })
      .limit(1)
      .single();

    const soilCDensity = latestSoil ? Number(latestSoil.soil_carbon_density) : 0;

    // 4. Fetch Emission Factors for this Stratum
    let { data: emissionFactors, error: efError } = await supabase
      .from('emission_factors')
      .select('*')
      .eq('stratum', plot.stratum)
      .single();

    // Fallback to 'Default' if specific stratum EF doesn't exist
    if (efError || !emissionFactors) {
      console.warn(`No specific emission factors for ${plot.stratum}, falling back to Default.`);
      const { data: defaultEf } = await supabase
        .from('emission_factors')
        .select('*')
        .eq('stratum', 'Default')
        .single();
      emissionFactors = defaultEf;
    }

    if (!emissionFactors) throw new Error("CRITICAL: No Emission Factors found in database.");

    // --- THE MATHEMATICS (IPCC Tier 1/2 Approximations) ---

    const AGB = Number(latestMeasurement.above_ground_biomass_tc_ha);
    const carbonFraction = Number(emissionFactors.carbon_fraction);
    const rootShootRatio = Number(emissionFactors.root_shoot_ratio);
    const co2Multiplier = Number(emissionFactors.co2_conversion_factor);

    // Calculate Carbon Pools (tonnes C / ha)
    const totalAboveGroundCarbon = AGB * carbonFraction;
    const totalBelowGroundCarbon = totalAboveGroundCarbon * rootShootRatio;
    const totalSoilCarbon = soilCDensity;

    // Total Ecosystem Carbon (tC/ha)
    const totalEcosystemCarbon = totalAboveGroundCarbon + totalBelowGroundCarbon + totalSoilCarbon;

    // Gross CO2 Equivalent (tCO2e/ha)
    // Note: For total plot issuance, we also multiply by the Plot Area (ha)
    const gross_tco2e_per_ha = totalEcosystemCarbon * co2Multiplier;
    const gross_tco2e = gross_tco2e_per_ha * Number(plot.area_ha);

    // Deductions (Standardized)
    // 10% for Leakage (displacement of emissions)
    // 15% for Buffer Pool (non-permanence risk)
    const LEAKAGE_RATE = 0.10;
    const BUFFER_RATE = 0.15;

    const leakage_deduction = gross_tco2e * LEAKAGE_RATE;
    const buffer_deduction = gross_tco2e * BUFFER_RATE;

    // Final Issuable Credits
    const net_issuable = gross_tco2e - leakage_deduction - buffer_deduction;

    // --- STORE RESULTS ---

    const { data: calculationResult, error: insertError } = await supabase
      .from('carbon_calculations')
      .insert({
        plot_id: plot_id,
        measured_agb_tc_ha: AGB,
        measured_soil_c_density: soilCDensity,
        total_above_ground_c_t: totalAboveGroundCarbon * Number(plot.area_ha),
        total_below_ground_c_t: totalBelowGroundCarbon * Number(plot.area_ha),
        total_soil_c_t: totalSoilCarbon * Number(plot.area_ha),
        total_ecosystem_c_t: totalEcosystemCarbon * Number(plot.area_ha),
        gross_tco2e: gross_tco2e,
        leakage_deduction_t: leakage_deduction,
        buffer_deduction_t: buffer_deduction,
        net_issuable_tco2e: net_issuable,
        calculated_by: 'System Auto-Run' // Could extract from JWT if triggered by user
      })
      .select()
      .single();

    if (insertError) throw new Error(`Failed to save calculation: ${insertError.message}`);

    return new Response(
      JSON.stringify(calculationResult),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Carbon Engine Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
