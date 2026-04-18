import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env vars
const supabaseUrl = 'https://eavqytqxeaswfbytguxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhdnF5dHF4ZWFzd2ZieXRndXhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI5NzE1NCwiZXhwIjoyMDg4ODczMTU0fQ.f8SzbOExNQX8DUgO15JGJWI1JOgpYD5KQ3P0Q-yoH-k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedKeta() {
    console.log('Seeding Keta Lagoon Complex Pilot...');
    const sourceDir = '/Users/danielnsowah/Desktop/Blue-Carbon-Project-Final-Report/source_reports';
    const ketaBoundaryFile = path.join(sourceDir, 'keta_lagoon_boundary.geojson');
    const saloPspFile = path.join(sourceDir, 'salo_permanent_sampla_plot_1_ndmi_03mar2026_boundary.geojson');
    
    // 0. Cleanup existing pilot projects to keep it clean
    await supabase.from('projects').delete().eq('name', 'Keta Lagoon Complex Pilot');

    // 1. Create Project
    const { data: project, error: pErr } = await supabase.from('projects').insert({
        name: 'Keta Lagoon Complex Pilot',
        region: 'Volta',
        district: 'Keta',
        project_types: ['restoration', 'conservation'],
        description: 'Official WACA MRV Pilot Site based on the comprehensive 2025 eco-social baseline.'
    }).select().single();

    if (pErr) {
        console.error('Error creating project:', pErr);
        return;
    }
    console.log(`Project created with ID: ${project.id}`);

    // If PostGIS insertion fails via REST, we will catch it.
    try {
        console.log('Reading Keta boundary...');
        if (fs.existsSync(ketaBoundaryFile)) {
            const raw = fs.readFileSync(ketaBoundaryFile, 'utf8');
            const parsed = JSON.parse(raw);
            for (const feature of parsed.features || []) {
                // Convert Polygon to MultiPolygon
                let geom = feature.geometry;
                if (geom.type === 'Polygon') {
                    geom = { type: 'MultiPolygon', coordinates: [geom.coordinates] };
                }
                const { error: geomErr } = await supabase.from('project_areas').insert({
                    project_id: project.id,
                    area_name: 'Keta Lagoon Boundary',
                    area_type: 'conservation', // Must be one of: restoration, conservation, protection, buffer, reference
                    geom: geom,
                });
                if (geomErr) console.error('Geom Insert Error:', geomErr.message);
                else console.log('Successfully inserted Keta Boundary Geom via REST.');
            }
        }
    } catch (e) {
        console.error('Failed to parse or insert boundary via REST', e);
    }
    
    try {
        console.log('Reading Salo PSP...');
        if (fs.existsSync(saloPspFile)) {
            const raw = fs.readFileSync(saloPspFile, 'utf8');
            const parsed = JSON.parse(raw);
            for (const feature of parsed.features || []) {
                // To get a point from a polygon, just grab the first coordinate of the outer ring
                let ptCoord = feature.geometry.coordinates[0][0];
                let ptGeom = { type: 'Point', coordinates: ptCoord };
                
                const { data: pspTarget, error: pspTargetErr } = await supabase.from('sample_plots').insert({
                    project_id: project.id,
                    plot_name: 'Salo Permanent Sample Plot 1',
                    stratum: 'Basin', // Must be one of: Fringing, Basin, Riverine, Overwash, Scrub, Hammock
                    location: ptGeom
                }).select().single();
                
                if (pspTargetErr) console.error('PSP Point Err:', pspTargetErr.message);
                else {
                    console.log(`Created PSP Point: ${pspTarget.id}`);
                    
                    // Also create the Sample Plot Boundary (which expects MultiPolygon)
                    let boundGeom = feature.geometry;
                    if (boundGeom.type === 'Polygon') {
                        boundGeom = { type: 'MultiPolygon', coordinates: [boundGeom.coordinates] };
                    }
                    const { error: boundErr } = await supabase.from('sample_plot_boundaries').insert({
                        project_id: project.id,
                        sample_plot_id: pspTarget.id,
                        boundary_name: 'Salo PSP 1 Footprint',
                        geom: boundGeom
                    });
                    if (boundErr) console.error('PSP Boundary Err:', boundErr.message);
                    else console.log('Successfully inserted PSP Boundary Geom.');
                }
            }
        }
    } catch (e) {
        console.error('Failed to insert PSP.', e);
    }

    try {
        console.log('Reading Dzita restoration areas...');
        const dzitaRestFile = path.join(sourceDir, 'dzita_restoration_areas_ndmi_03mar2026_boundary.geojson');
        if (fs.existsSync(dzitaRestFile)) {
            const raw = fs.readFileSync(dzitaRestFile, 'utf8');
            const parsed = JSON.parse(raw);
            for (let i = 0; i < (parsed.features || []).length; i++) {
                const feature = parsed.features[i];
                let geom = feature.geometry;
                if (geom.type === 'Polygon') {
                    geom = { type: 'MultiPolygon', coordinates: [geom.coordinates] };
                }
                const { error: geomErr } = await supabase.from('project_areas').insert({
                    project_id: project.id,
                    area_name: `Dzita Restoration Area ${i + 1}`,
                    area_type: 'restoration', // Lowercase restoration is allowed
                    geom: geom,
                });
                if (geomErr) console.error(`Dzita ${i+1} Insert Error:`, geomErr.message);
                else console.log(`Successfully inserted Dzita Restoration Area ${i+1}.`);
            }
        }
    } catch (e) {
        console.error('Failed to parse or insert Dzita areas.', e);
    }

    try {
        console.log('Ingesting specific Drone Survey AoIs...');
        const droneAoIs = [
            {
                name: 'Aborlove Nolopi Drone AoI',
                type: 'conservation',
                coordinates: [[[0.9326871071896559,6.040038733692598],[0.93097002984047,6.038353662065628],[0.9310735119282487,6.036322765955993],[0.9296157526765381,6.034721840519188],[0.9309035912431063,6.032793183259453],[0.9322889741730611,6.032765677128523],[0.9341658743160464,6.033886284216582],[0.9350187564077772,6.035362117342313],[0.9358690207426568,6.036707731276524],[0.9365645548899137,6.037865007005554],[0.9373203205813629,6.038356772731702],[0.9382666057055222,6.038376959024533],[0.9391614659784842,6.038469419007066],[0.9391904088249237,6.039699698391765],[0.9366120193765148,6.040130917516078],[0.9365960409045693,6.041207286969969],[0.934253539620602,6.041798527829477],[0.9326871071896559,6.040038733692598]]]
            },
            {
                name: 'Agbatsivi-Agortoe Drone AoI',
                type: 'conservation',
                coordinates: [[[0.7385352702690673,5.871220245848059],[0.7306148992905914,5.859243421448038],[0.7476956001570123,5.835961592984109],[0.7544630863838431,5.837337246116758],[0.7631096974137752,5.850873574992765],[0.7527106936967431,5.862622550758184],[0.7385352702690673,5.871220245848059]]]
            },
            {
                name: 'Anyanui Combine System Drone AoI',
                type: 'restoration',
                coordinates: [[[0.7155105278344753,5.795030817150749],[0.7167761668312211,5.794353357398567],[0.7182893502697918,5.793745326601869],[0.7193372843529611,5.792460944285944],[0.7198397180638971,5.790052997341398],[0.7220934942462587,5.791982339449476],[0.7253173644335065,5.79324408729984],[0.7243365364671206,5.798546002364682],[0.7234519846584009,5.801592934462729],[0.7203480903217874,5.801804434675576],[0.7194240279464892,5.801667147015467],[0.7191470486232521,5.800279145795209],[0.7176775723894369,5.800279952749286],[0.7155105278344753,5.795030817150749]]]
            },
            {
                name: 'Salo-Agortoe Stretch Drone AoI',
                type: 'conservation',
                coordinates: [[[0.7684288479714096,5.852602191735301],[0.755703690065328,5.835299825170591],[0.762929753999646,5.82620180237566],[0.7838658089821227,5.830819627489881],[0.7792494977225295,5.839325344828911],[0.7787734708141181,5.844049260567706],[0.7757016261995009,5.847962048666745],[0.7684288479714096,5.852602191735301]]]
            }
        ];

        for (const aoi of droneAoIs) {
            const geom = { type: 'MultiPolygon', coordinates: [aoi.coordinates] };
            const { error: geomErr } = await supabase.from('project_areas').insert({
                project_id: project.id,
                area_name: aoi.name,
                area_type: aoi.type,
                geom: geom as any,
            });
            if (geomErr) console.error(`${aoi.name} Insert Error:`, geomErr.message);
            else console.log(`Successfully inserted ${aoi.name}.`);
        }
    } catch (e) {
        console.error('Failed to insert Drone AoIs.', e);
    }
}

seedKeta().catch(console.error);
