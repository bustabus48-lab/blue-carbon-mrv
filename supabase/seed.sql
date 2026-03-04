-- Insert Dummy Data for Mangrove Plots (Polygons around Keta Lagoon area)
INSERT INTO public.mangrove_plots (stratum_name, area_ha, planting_date, geom)
VALUES (
        'Keta Restoration Zone A',
        15.5,
        '2025-06-12',
        ST_GeomFromText(
            'POLYGON((0.957 5.865, 0.960 5.865, 0.960 5.860, 0.957 5.860, 0.957 5.865))',
            4326
        )
    ),
    (
        'Songor Protection Area',
        250.0,
        NULL,
        ST_GeomFromText(
            'POLYGON((0.550 5.800, 0.580 5.800, 0.580 5.750, 0.550 5.750, 0.550 5.800))',
            4326
        )
    ),
    (
        'Muni-Pomadze Reserve',
        85.2,
        '2023-11-20',
        ST_GeomFromText(
            'POLYGON((-0.670 5.380, -0.650 5.380, -0.650 5.350, -0.670 5.350, -0.670 5.380))',
            4326
        )
    );
-- Insert Dummy Deforestation Alerts
INSERT INTO public.sar_change_alerts (
        alert_type,
        severity,
        confidence_score,
        status,
        detected_area_ha,
        event_date,
        geom
    )
VALUES (
        'Deforestation',
        'High',
        95.5,
        'Pending Verification',
        1.2,
        '2026-02-21',
        ST_GeomFromText(
            'POLYGON((0.958 5.863, 0.959 5.863, 0.959 5.862, 0.958 5.862, 0.958 5.863))',
            4326
        )
    ),
    (
        'Vegetation Stress',
        'Medium',
        78.2,
        'Under Review',
        4.5,
        '2026-02-15',
        ST_GeomFromText(
            'POLYGON((0.560 5.780, 0.565 5.780, 0.565 5.775, 0.560 5.775, 0.560 5.780))',
            4326
        )
    ),
    (
        'Encroachment',
        'Critical',
        99.1,
        'Verified - Illegal Logging',
        0.8,
        '2026-01-10',
        ST_GeomFromText(
            'POLYGON((-0.660 5.370, -0.662 5.370, -0.662 5.368, -0.660 5.368, -0.660 5.370))',
            4326
        )
    ),
    (
        'New Planting',
        'Low',
        88.0,
        'Logged',
        2.0,
        '2026-02-01',
        ST_GeomFromText(
            'POLYGON((0.959 5.861, 0.960 5.861, 0.960 5.860, 0.959 5.860, 0.959 5.861))',
            4326
        )
    );
-- Insert Dummy Permanent Sample Plots
INSERT INTO public.sample_plots (
        id,
        plot_name,
        stratum,
        status,
        location,
        created_at
    )
VALUES (
        'b6d21c35-1111-4a12-9c2b-68b6d21c35e1',
        'PSP-KETA-001',
        'Fringing',
        'Active',
        ST_GeomFromText('POINT(0.9585 5.8625)', 4326),
        '2025-01-15'
    ),
    (
        'c7e32d46-2222-5b23-0d3c-79c7e32d46f2',
        'PSP-KETA-002',
        'Basin',
        'Degraded',
        ST_GeomFromText('POINT(0.9565 5.8615)', 4326),
        '2025-01-16'
    ),
    (
        'd8f43e57-3333-6c34-1e4d-8ad8f43e57a3',
        'PSP-SONG-001',
        'Riverine',
        'Restoring',
        ST_GeomFromText('POINT(0.5650 5.7750)', 4326),
        '2025-02-10'
    );
-- Insert Dummy Plot Measurements (Historical Data)
INSERT INTO public.plot_measurements (
        plot_id,
        measurement_date,
        canopy_cover_percent,
        avg_tree_height_m,
        above_ground_biomass_tc_ha,
        notes,
        is_qa_survey
    )
VALUES -- Measurements for PSP-KETA-001
    (
        'b6d21c35-1111-4a12-9c2b-68b6d21c35e1',
        '2025-01-20',
        45.5,
        3.2,
        120.5,
        'Initial baseline recorded. Healthy growth.',
        false
    ),
    (
        'b6d21c35-1111-4a12-9c2b-68b6d21c35e1',
        '2025-07-20',
        52.0,
        3.5,
        128.8,
        'Mid-year growth observed.',
        false
    ),
    (
        'b6d21c35-1111-4a12-9c2b-68b6d21c35e1',
        '2026-01-20',
        58.5,
        3.9,
        135.2,
        'Annual survey. Canopy expanding well.',
        false
    ),
    -- Measurements for PSP-KETA-002
    (
        'c7e32d46-2222-5b23-0d3c-79c7e32d46f2',
        '2025-01-25',
        20.0,
        1.8,
        45.0,
        'Site looks heavily degraded, evidence of recent cutting.',
        false
    ),
    (
        'c7e32d46-2222-5b23-0d3c-79c7e32d46f2',
        '2026-01-25',
        18.5,
        1.8,
        42.5,
        'Continued degradation. Logging alert verified near here.',
        false
    ),
    -- Measurements for PSP-SONG-001
    (
        'd8f43e57-3333-6c34-1e4d-8ad8f43e57a3',
        '2025-02-15',
        75.0,
        6.5,
        210.0,
        'Dense riverine patch. Roots are robust.',
        false
    ),
    (
        'd8f43e57-3333-6c34-1e4d-8ad8f43e57a3',
        '2025-02-16',
        76.5,
        6.4,
        212.0,
        'QA/QC survey by auditor. Measurements verified within acceptable margins.',
        true
    );
-- Insert Dummy Soil Lab Data
INSERT INTO public.soil_samples (
        plot_id,
        sample_id,
        collected_date,
        collected_by,
        received_date,
        received_by,
        analysis_date,
        depth_interval,
        core_volume_cm3,
        dry_weight_g,
        organic_carbon_percent,
        bulk_density_g_cm3,
        soil_carbon_density,
        analysis_status,
        notes
    )
VALUES -- Plot KETA-001 Soil Cores
    (
        'b6d21c35-1111-4a12-9c2b-68b6d21c35e1',
        'SOIL-KETA001-C1',
        '2026-02-10',
        'agent@gab.com',
        '2026-02-12',
        'LAB-TECH-01',
        '2026-02-15',
        '0-15cm',
        500.0,
        320.5,
        2.4,
        0.641,
        -- 320.5 / 500
        23.08,
        -- 0.641 * 0.024 * 15 (depth) * 100 (conversion factor)
        'Analysed',
        'Sample intact, high organic matter visible.'
    ),
    (
        'b6d21c35-1111-4a12-9c2b-68b6d21c35e1',
        'SOIL-KETA001-C2',
        '2026-02-10',
        'agent@gab.com',
        '2026-02-12',
        'LAB-TECH-01',
        NULL,
        '15-30cm',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'Pending',
        'Awaiting drying oven space.'
    ),
    -- Plot SONG-001 Soil Cores
    (
        'd8f43e57-3333-6c34-1e4d-8ad8f43e57a3',
        'SOIL-SONG001-C1',
        '2026-01-20',
        'agent@gab.com',
        '2026-01-22',
        'LAB-TECH-02',
        '2026-01-28',
        '0-30cm',
        1000.0,
        850.0,
        1.8,
        0.850,
        45.9,
        'Analysed',
        'Sandy texture, lower organic content.'
    );
-- Insert Dummy Carbon Calculations
INSERT INTO public.carbon_calculations (
        plot_id,
        calculation_date,
        measured_agb_tc_ha,
        measured_soil_c_density,
        total_above_ground_c_t,
        total_below_ground_c_t,
        total_soil_c_t,
        total_ecosystem_c_t,
        gross_tco2e,
        leakage_deduction_t,
        buffer_deduction_t,
        net_issuable_tco2e,
        calculated_by
    )
VALUES -- Plot KETA-001 (Fringing -> CF: 0.48, RSR: 0.28, Area: 15.5)
    (
        'b6d21c35-1111-4a12-9c2b-68b6d21c35e1',
        '2026-02-28',
        135.2,
        -- Latest AGB
        23.08,
        -- Latest Soil C
        1005.88,
        -- Above Ground Total C
        281.64,
        -- Below Ground (1005.88 * 0.28)
        357.74,
        -- Soil C (23.08 * 15.5)
        1645.26,
        -- Total Eco C (1005.88 + 281.64 + 357.74)
        6038.10,
        -- Gross CO2e (1645.26 * 3.67)
        603.81,
        -- Leakage 10%
        905.71,
        -- Buffer 15%
        4528.58,
        -- Net Issuable (6038.10 - 603.81 - 905.71)
        'System Auto-Run'
    ),
    -- Plot SONG-001 (Riverine -> CF: 0.49, RSR: 0.30, Area: 250)
    (
        'd8f43e57-3333-6c34-1e4d-8ad8f43e57a3',
        '2026-02-28',
        212.0,
        -- Latest AGB
        45.9,
        -- Latest Soil C
        25970.0,
        -- AG Total C
        7791.0,
        -- BG Total C
        11475.0,
        -- Soil C Total
        45236.0,
        -- Total Eco C
        165985.12,
        -- Gross CO2e
        16598.51,
        -- Leakage 10%
        24897.77,
        -- Buffer 15%
        124488.84,
        -- Net Issuable
        'System Auto-Run'
    );
-- Insert Dummy Risk Scoring
INSERT INTO public.risk_scoring (
        assessment_date,
        internal_risk_score,
        external_risk_score,
        natural_risk_score,
        assessor,
        notes
    )
VALUES (
        '2026-01-10',
        5.00,
        -- e.g., Project Management Risk
        2.50,
        -- e.g., Land Tenure Risk
        7.50,
        -- e.g., Fire/Storm Risk
        'auditor@gab.com',
        'Initial project risk assessment. Total expected buffer is 15%.'
    );
-- Insert Dummy Market Surveys (Leakage)
INSERT INTO public.market_surveys (
        survey_date,
        surveyed_by,
        location,
        fuelwood_price_ghs,
        charcoal_price_ghs,
        estimated_displacement_volume,
        notes
    )
VALUES (
        '2026-02-15',
        'agent@gab.com',
        -- Agent ID
        'Keta Municipal Market',
        50.00,
        120.00,
        15.5,
        'Slight increase in fuelwood prices observed post-project implementation.'
    );
-- Insert Dummy Reversal Events
INSERT INTO public.reversal_events (
        plot_id,
        event_date,
        event_type,
        estimated_tco2e_lost,
        status,
        notes,
        reported_by
    )
VALUES (
        'b6d21c35-1111-4a12-9c2b-68b6d21c35e1',
        -- KETA-001
        '2026-02-20',
        'Storm',
        150.50,
        'Investigating',
        'High winds caused canopy damage in the northern quadrant.',
        'agent@gab.com'
    );
-- Insert Dummy Safeguard Documents
INSERT INTO public.safeguard_documents (
        document_type,
        community_name,
        file_url,
        verification_status,
        uploaded_by,
        notes
    )
VALUES (
        'FPIC',
        'Anyanui Community',
        'fpic_anyanui_2025.pdf',
        'Verified',
        'agent@gab.com',
        'Signed FPIC consent form from the local chief and elders.'
    ),
    (
        'Benefit-Sharing Agreement',
        'Songor Salt Miners Cooperative',
        'bsa_songor_2025.pdf',
        'Pending',
        'agent@gab.com',
        'Draft agreement awaiting final legal review.'
    );
-- Insert Dummy Grievances
INSERT INTO public.grievances (
        community_name,
        category,
        description,
        status,
        reported_by_phone,
        logged_by
    )
VALUES (
        'Fuveme Village',
        'Land Dispute',
        'Community members concerned about exact boundaries of the restoration zone overlapping with fishing grounds.',
        'Under Investigation',
        '+233550000000',
        'agent@gab.com'
    ),
    (
        'Dzita Community',
        'Employment',
        'Request for more local youth to be employed in the mangrove nursery operations.',
        'Resolved',
        '+233240000000',
        'agent@gab.com'
    );
-- Insert Dummy Monitoring Cycles
INSERT INTO public.monitoring_cycles (
        id,
        start_date,
        end_date,
        name,
        status
    )
VALUES (
        '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        '2025-01-01',
        '2025-12-31',
        '2025 Annual Verra Audit',
        'Active'
    ),
    (
        'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
        '2024-01-01',
        '2024-12-31',
        '2024 Baseline Establishment',
        'Verified'
    );
-- Insert Dummy Compliance Checklists
INSERT INTO public.compliance_checklists (
        cycle_id,
        requirement_type,
        is_met,
        verified_by,
        notes
    )
VALUES -- 2025 Active Audit Checklists
    (
        '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        'FPIC Signed',
        true,
        'admin@gab.com',
        'Consent obtained and document verified on Feb 15.'
    ),
    (
        '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        'Biomass Survey',
        false,
        NULL,
        'Q1 surveys underway; awaiting Q2/Q3 data.'
    ),
    (
        '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
        'Leakage Monitored',
        false,
        NULL,
        'Market surveys pending for major coastal communities.'
    ),
    -- 2024 Verified Audit Checklists
    (
        'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
        'FPIC Signed',
        true,
        'admin@gab.com',
        'Initial project FPIC completed.'
    ),
    (
        'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
        'Biomass Survey',
        true,
        'admin@gab.com',
        'Baseline inventory successfully audited.'
    ),
    (
        'a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6',
        'Leakage Monitored',
        true,
        'admin@gab.com',
        'No significant deforestation displacement observed.'
    );