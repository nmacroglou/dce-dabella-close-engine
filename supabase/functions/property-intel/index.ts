// Property Intelligence — live provider (ATTOM Data) with graceful demo fallback.
// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ATTOM_KEY = Deno.env.get('ATTOM_API_KEY');
const ATTOM_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

interface ReqBody {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
}

function conf(score: number, reasons: string[], conflicts: string[] = []) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const label =
    s >= 90 ? 'Very High' : s >= 75 ? 'High' : s >= 60 ? 'Moderate' : s >= 40 ? 'Low' : 'Very Low';
  return { score: s, label, reasons, conflicts };
}

async function attomFetch(path: string, params: Record<string, string>) {
  const url = new URL(ATTOM_BASE + path);
  Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { apikey: ATTOM_KEY!, Accept: 'application/json' },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`ATTOM ${path} [${res.status}]: ${body.slice(0, 400)}`);
  try { return JSON.parse(body); } catch { throw new Error(`ATTOM ${path}: invalid JSON`); }
}

function splitAddress(input: ReqBody): { address1: string; address2: string } | null {
  if (input.address && input.city && input.state) {
    return {
      address1: input.address,
      address2: `${input.city}, ${input.state}${input.zip ? ' ' + input.zip : ''}`,
    };
  }
  if (input.address) {
    // Try to parse "123 Main St, Phoenix, AZ 85013"
    const parts = input.address.split(',').map((s) => s.trim());
    if (parts.length >= 3) return { address1: parts[0], address2: parts.slice(1).join(', ') };
  }
  return null;
}

function detectOwnerType(name: string): 'individual' | 'joint' | 'trust' | 'llc' | 'corporation' | 'unknown' {
  const n = name.toUpperCase();
  if (/\bTRUST\b|\bTR\b|\bLIVING TRUST\b/.test(n)) return 'trust';
  if (/\bLLC\b|L\.L\.C\.|LIMITED LIABILITY/.test(n)) return 'llc';
  if (/\bINC\b|\bCORP\b|CORPORATION|COMPANY|\bCO\.\b/.test(n)) return 'corporation';
  if (/\s&\s|\bAND\b|;/.test(n)) return 'joint';
  if (name.trim().length > 0) return 'individual';
  return 'unknown';
}

function normalize(attom: any, secondaryAttom: any | null, input: ReqBody) {
  const p = attom?.property?.[0];
  if (!p) return null;

  const addr = p.address ?? {};
  const owner = p.owner ?? {};
  const summary = p.summary ?? {};
  const building = p.building ?? {};
  const rooms = building.rooms ?? {};
  const size = building.size ?? {};
  const lot = p.lot ?? {};
  const assessment = p.assessment ?? {};
  const sale = p.sale ?? {};
  const location = p.location ?? {};

  const ownerName =
    [owner.owner1?.fullname, owner.owner2?.fullname].filter(Boolean).join(' & ') || null;
  const ownerType = ownerName ? detectOwnerType(ownerName) : 'unknown';

  const mailingAddr = owner.mailingaddressoneline ?? null;
  const propAddrOneline = addr.oneLine ?? null;
  const taxMatch = !!(mailingAddr && propAddrOneline &&
    mailingAddr.replace(/\s+/g, ' ').toUpperCase() === propAddrOneline.replace(/\s+/g, ' ').toUpperCase());

  const yearBuilt = summary.yearbuilt ?? building.yearbuilt ?? null;
  const roofMaterial = building.construction?.roofcover ?? null;
  const estRoofAge = yearBuilt ? new Date().getFullYear() - Number(yearBuilt) : null;

  const salesHistory = secondaryAttom?.property?.[0]?.salehistory ?? [];
  const latestSale = salesHistory[0] ?? sale ?? {};
  const saleDate = latestSale?.saleTransDate ?? latestSale?.salesearchdate ?? sale?.salesearchdate ?? null;
  const salePrice = Number(latestSale?.amount?.saleamt ?? sale?.amount?.saleamt ?? 0) || null;

  const matchScore =
    (addr.line1 ? 25 : 0) + (p.identifier?.apn ? 25 : 0) + (location.latitude ? 15 : 0) + 20;
  const matchReasons: string[] = [];
  if (p.identifier?.apn) matchReasons.push(`Parcel APN ${p.identifier.apn}`);
  if (addr.line1) matchReasons.push('Address standardized by county record');
  if (location.latitude) matchReasons.push('Geocoded to parcel centroid');

  const ownershipScore = 60 +
    (ownerName ? 15 : -20) +
    (taxMatch ? 10 : -12) +
    (ownerType === 'trust' || ownerType === 'llc' ? -15 : 0);
  const ownershipReasons: string[] = [];
  const ownershipConflicts: string[] = [];
  if (ownerName) ownershipReasons.push(`Recorded owner: ${ownerName}`);
  if (taxMatch) ownershipReasons.push('Tax mailing address matches property');
  else if (mailingAddr) ownershipConflicts.push(`Tax mail differs: ${mailingAddr}`);
  if (ownerType === 'trust' || ownerType === 'llc') {
    ownershipConflicts.push(`Owned by ${ownerType.toUpperCase()} — occupant identity requires confirmation`);
  }

  const identityScore = ownershipScore - (ownerType === 'trust' || ownerType === 'llc' ? 10 : 0);
  const likelyOwner =
    ownerType === 'individual' || ownerType === 'joint' ? ownerName : null;
  const occupancyStatus =
    ownerType === 'individual' || ownerType === 'joint' ? 'likely_owner_occupied' :
    ownerType === 'llc' || ownerType === 'corporation' ? 'likely_non_owner_occupied' : 'unknown';

  const propertyMatch = {
    standardized_address: propAddrOneline ?? input.address ?? '',
    parcel_number: p.identifier?.apn ?? null,
    city: addr.locality ?? input.city ?? null,
    state: addr.countrySubd ?? input.state ?? null,
    postal_code: addr.postal1 ?? input.zip ?? null,
    latitude: Number(location.latitude) || input.lat || null,
    longitude: Number(location.longitude) || input.lng || null,
    property_type: summary.proptype ?? summary.propclass ?? 'Single-family residence',
    data_sources: ['ATTOM Data — County Assessor', 'ATTOM Data — Recorder'],
    last_updated: new Date().toISOString(),
    confidence: conf(matchScore, matchReasons),
  };

  const ownership = {
    owner_name: ownerName,
    owner_type: ownerType,
    tax_mailing_name: owner.owner1?.fullname ?? null,
    tax_mailing_address: mailingAddr,
    tax_mailing_matches_property: taxMatch,
    ownership_start_date: sale?.salesearchdate ?? null,
    document_type: sale?.saleTransType ?? 'Deed',
    recording_number: sale?.saleRecDate ?? null,
    source: 'ATTOM Data — County Recorder',
    source_record_date: sale?.salesearchdate ?? null,
    confidence: conf(ownershipScore, ownershipReasons, ownershipConflicts),
  };

  const saleRecord = {
    sale_date: saleDate,
    buyer_name: ownerName,
    seller_name: latestSale?.sellerName ?? null,
    sale_price: salePrice,
    document_type: latestSale?.saleTransType ?? 'Deed',
    recording_number: latestSale?.saleRecDate ?? null,
    source: 'ATTOM Data — County Recorder',
    confidence: conf(saleDate ? 82 : 40, saleDate ? ['Deed recorded'] : ['No sale on file']),
  };

  const identity = {
    likely_owner_name: likelyOwner,
    likely_occupant_name: likelyOwner,
    owner_occupancy_status: occupancyStatus as any,
    confidence: conf(identityScore, ownershipReasons, ownershipConflicts),
  };

  const info = {
    year_built: yearBuilt ? Number(yearBuilt) : null,
    square_feet: Number(size.universalsize ?? size.livingsize ?? 0) || null,
    lot_size: Number(lot.lotsize2 ?? lot.lotsize1 * 43560 ?? 0) || null,
    stories: Number(building.summary?.levels ?? 0) || null,
    bedrooms: Number(rooms.beds ?? 0) || null,
    bathrooms: Number(rooms.bathstotal ?? 0) || null,
    assessed_value: Number(assessment.assessed?.assdttlvalue ?? 0) || null,
    estimated_market_value: Number(assessment.market?.mktttlvalue ?? 0) || null,
    roof_material: roofMaterial,
    estimated_roof_age: estRoofAge,
    is_roof_age_estimated: true,
    exterior_material: building.construction?.wallType ?? null,
    solar_present: null,
    permits: [],
    storm_exposure: null,
    heat_exposure: null,
    visible_condition_notes: null,
    previous_dabella_interaction: false,
    existing_customer: false,
    do_not_knock: false,
  };

  // Simple opportunity heuristic — mirrors mockOpportunity.
  const roofAge = info.estimated_roof_age ?? 0;
  let oppScore = 40;
  const oppReasons: string[] = [];
  if (roofAge >= 18) { oppScore += 25; oppReasons.push(`Estimated roof age ${roofAge}y`); }
  if (info.year_built && info.year_built < 2005) { oppScore += 8; oppReasons.push('Predates modern roofing systems'); }
  const opportunity = {
    primary_product: 'roofing' as const,
    secondary_product: 'windows' as const,
    opportunity_score: Math.min(100, oppScore),
    recommendation_confidence: conf(65, oppReasons),
    reasons: oppReasons,
    missing_info: ['Visible exterior condition photos'],
    suggested_inspection_focus: [
      'Photograph south/west roof faces for granule loss',
      'Note flashing condition around penetrations',
    ],
  };

  return { propertyMatch, ownership, saleRecord, identity, info, opportunity };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body: ReqBody = await req.json();

    if (!ATTOM_KEY) {
      return new Response(
        JSON.stringify({ error: 'ATTOM_API_KEY not configured', is_demo: true }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const parts = splitAddress(body);
    if (!parts) {
      return new Response(
        JSON.stringify({ error: 'address required (full address or address+city+state)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Primary detail + sales history in parallel.
    const [detail, saleHist] = await Promise.all([
      attomFetch('/property/expandedprofile', parts).catch((e) => ({ __err: String(e) })),
      attomFetch('/saleshistory/detail', parts).catch(() => null),
    ]);

    if ((detail as any).__err) {
      return new Response(
        JSON.stringify({ error: 'ATTOM lookup failed', details: (detail as any).__err }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const normalized = normalize(detail, saleHist, body);
    if (!normalized) {
      return new Response(
        JSON.stringify({ error: 'No property found for address', is_demo: false }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ ...normalized, is_demo: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('property-intel error:', e);
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
