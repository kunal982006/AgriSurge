import fs from "fs";
import path from "path";
import { getDb } from "@/db";
import { policies, farms, farmers, riskPredictions, premiumPredictions } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UnderwritingStatus = "DRAFT" | "UNDER_REVIEW" | "NEEDS_INFORMATION" | "APPROVED" | "REJECTED";

export type AuditEvent = {
  id: string;
  timestamp: string;
  action: string;
  actor: string; // e.g. "System" or "Underwriter (Senior)"
  status: UnderwritingStatus;
  notes?: string;
  reason?: string;
};

export type UnderwritingRecord = {
  id: string; // e.g. "UW-2026-84433"
  farmCode: string; // e.g. "F-10293"
  farmerName: string;
  farmName: string;
  region: string;
  district: string;
  taluka?: string;
  village?: string;
  latitude: number;
  longitude: number;
  cropCategory: string;
  crop: string;
  cropVariety: string;
  sowingDate?: string;
  growthStage?: string;
  irrigationType: string;
  soilType: string;
  areaAcres: number;
  areaHectares: number;
  geoJson?: any;
  
  // Step 3 Environmental Data
  environmentalData?: any;

  // Step 4 Risk Assessment
  riskScore: number;
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "low" | "moderate" | "high";
  predictedYieldKgHa: number;
  expectedYieldKgHa: number;
  yieldDeviationPct: number;
  riskFactors?: any[];
  modelMetadata?: any;

  // Step 5 Premium Recommendation
  coverageAmount: number;
  baseExposure: number;
  riskMultiplier: number;
  underwritingAdjAmount: number;
  recommendedPremium: number;
  pricingModelVersion: string;

  // Underwriting Decision State
  status: UnderwritingStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  decisionReason?: string;
  underwriterNotes?: string;
  informationRequest?: string;
  rejectionReason?: string;

  // Timestamps & Audit
  submittedAt: string;
  auditTrail: AuditEvent[];

  // Attachments
  boundaryImageBase64?: string;
  certificatePdf?: string;
};

const DATA_FILE_PATH = path.join(process.cwd(), "data", "underwriting_records.json");

// In-memory store fallback when DB is not configured or for fast query caching
let _memoryStore: Map<string, UnderwritingRecord> = new Map();
let _isLoaded = false;

function loadStoreFromFile() {
  if (_isLoaded) return;
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      const list: UnderwritingRecord[] = JSON.parse(raw);
      list.forEach((rec) => _memoryStore.set(rec.id, rec));
    }
  } catch (err) {
    console.error("Error loading underwriting_records.json:", err);
  }
  _isLoaded = true;
}

function persistStoreToFile() {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const list = Array.from(_memoryStore.values());
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.error("Error persisting underwriting_records.json:", err);
  }
}

export async function getAllUnderwritingRecords(): Promise<UnderwritingRecord[]> {
  loadStoreFromFile();

  // Try reading from Postgres DB if available
  try {
    const db = getDb();
    const dbPolicies = await db
      .select({
        policy: policies,
        farm: farms,
        farmer: farmers,
        risk: riskPredictions,
        premium: premiumPredictions,
      })
      .from(policies)
      .leftJoin(farms, eq(policies.farmId, farms.id))
      .leftJoin(farmers, eq(farms.farmerId, farmers.id))
      .leftJoin(premiumPredictions, eq(policies.premiumPredictionId, premiumPredictions.id))
      .leftJoin(riskPredictions, eq(premiumPredictions.riskPredictionId, riskPredictions.id));

    if (dbPolicies && dbPolicies.length > 0) {
      dbPolicies.forEach(({ policy, farm, farmer, risk, premium }) => {
        if (!policy) return;
        const snapshot = (policy.assessmentSnapshot as any) || {};
        const id = policy.policyCode;
        
        const record: UnderwritingRecord = {
          id,
          farmCode: farm?.farmCode || snapshot.farmCode || "F-1000",
          farmerName: farmer?.name || snapshot.farmerName || "Demo Farmer",
          farmName: farm?.name || snapshot.farmName || "Farm #1",
          region: farm?.region || snapshot.region || "Maharashtra",
          district: snapshot.district || farm?.region || "Ahilyanagar",
          taluka: snapshot.taluka,
          village: snapshot.village,
          latitude: Number(farm?.latitude || snapshot.latitude || 19.123),
          longitude: Number(farm?.longitude || snapshot.longitude || 74.456),
          cropCategory: snapshot.cropCategory || "Cereals / Grains",
          crop: farm?.crop || snapshot.crop || "RICE",
          cropVariety: farm?.cropVariety || snapshot.cropVariety || "Basmati",
          sowingDate: snapshot.sowingDate,
          growthStage: snapshot.growthStage,
          irrigationType: farm?.irrigationType || snapshot.irrigationType || "Rainfed",
          soilType: farm?.soilType || snapshot.soilType || "Black Soil",
          areaAcres: Number(farm?.areaAcres || snapshot.areaAcres || 5.0),
          areaHectares: Number(snapshot.areaHectares || (Number(farm?.areaAcres || 5.0) * 0.404686)),
          geoJson: farm?.boundaryGeoJson || snapshot.geoJson,
          boundaryImageBase64: farm?.boundaryImage || snapshot.boundaryImageBase64,

          environmentalData: snapshot.environmentalData,

          riskScore: Number(risk?.riskScore || snapshot.riskScore || 25),
          riskLevel: (risk?.riskLevel as any) || snapshot.riskLevel || "LOW",
          predictedYieldKgHa: Number(snapshot.predictedYieldKgHa || 1838.5),
          expectedYieldKgHa: Number(snapshot.expectedYieldKgHa || 1522.0),
          yieldDeviationPct: Number(snapshot.yieldDeviationPct || 20.8),
          riskFactors: (risk?.factors as any) || snapshot.riskFactors || [],
          modelMetadata: snapshot.modelMetadata,

          coverageAmount: Number(policy.coverageAmount || snapshot.coverageAmount || 85300),
          baseExposure: Number(premium?.basePremium || snapshot.baseExposure || 9206.75),
          riskMultiplier: Number(premium?.multiplier || snapshot.riskMultiplier || 0.90),
          underwritingAdjAmount: Number(snapshot.underwritingAdjAmount || 240.30),
          recommendedPremium: Number(premium?.recommendedPremium || snapshot.recommendedPremium || 8530),
          pricingModelVersion: snapshot.pricingModelVersion || "v2.0",

          status: (policy.status as UnderwritingStatus) || "UNDER_REVIEW",
          reviewedBy: policy.reviewedBy || snapshot.reviewedBy,
          reviewedAt: policy.reviewedAt?.toISOString() || snapshot.reviewedAt,
          decisionReason: policy.decisionReason || snapshot.decisionReason,
          underwriterNotes: policy.underwriterNotes || snapshot.underwriterNotes,
          informationRequest: policy.informationRequest || snapshot.informationRequest,
          rejectionReason: policy.rejectionReason || snapshot.rejectionReason,

          submittedAt: policy.createdAt ? policy.createdAt.toISOString() : new Date().toISOString(),
          auditTrail: (policy.auditTrail as AuditEvent[]) || snapshot.auditTrail || [],
        };

        _memoryStore.set(id, record);
      });
    }
  } catch {
    // Database connection string not present, fallback to memory file store
  }

  return Array.from(_memoryStore.values());
}

export async function getUnderwritingRecordById(id: string): Promise<UnderwritingRecord | null> {
  const records = await getAllUnderwritingRecords();
  return records.find((r) => r.id === id) || _memoryStore.get(id) || null;
}

export async function saveUnderwritingRecord(record: UnderwritingRecord): Promise<UnderwritingRecord> {
  loadStoreFromFile();

  const now = new Date().toISOString();

  // Create initial audit trail event if missing
  if (!record.auditTrail || record.auditTrail.length === 0) {
    record.auditTrail = [
      {
        id: `aud-${Date.now()}-1`,
        timestamp: now,
        action: "Application Submitted for Underwriting",
        actor: "AgriSurge Workflow System",
        status: record.status || "UNDER_REVIEW",
        notes: `Submitted with risk score ${record.riskScore}% (${record.riskLevel}) and recommended premium ₹${record.recommendedPremium.toLocaleString("en-IN")}.`,
      },
    ];
  }

  _memoryStore.set(record.id, record);
  persistStoreToFile();

  // Try writing to database if available
  try {
    const db = getDb();
    
    // Find or create farmer
    const [farmer] = await db.insert(farmers).values({
      name: record.farmerName || "Demo Farmer",
      phone: "9876543210",
      region: record.region || record.district || "Maharashtra",
    }).returning();

    // Create farm
    const [farm] = await db.insert(farms).values({
      farmCode: record.farmCode || `F-${Math.floor(10000 + Math.random() * 90000)}`,
      farmerId: farmer.id,
      name: record.farmName || "Farm #1",
      region: record.region || record.district || "Maharashtra",
      location: `${record.village || ""}, ${record.district || ""}`,
      crop: record.crop,
      cropVariety: record.cropVariety,
      soilType: record.soilType,
      irrigationType: record.irrigationType,
      areaAcres: record.areaAcres.toString(),
      boundaryGeoJson: record.geoJson || null,
      boundaryImage: record.boundaryImageBase64 || null,
      latitude: record.latitude.toString(),
      longitude: record.longitude.toString(),
    }).returning();

    // Create risk prediction
    const [risk] = await db.insert(riskPredictions).values({
      farmId: farm.id,
      riskScore: (record.riskScore / 100.0).toString(),
      riskLevel: (record.riskLevel.toLowerCase() as any) || "low",
      modelName: "AgriSurge V2 Crop Yield Model",
      modelVersion: "2.0.0",
      factors: record.riskFactors || [],
      isMock: false,
    }).returning();

    // Create premium prediction
    const [premium] = await db.insert(premiumPredictions).values({
      riskPredictionId: risk.id,
      basePremium: record.baseExposure.toString(),
      multiplier: record.riskMultiplier.toString(),
      recommendedPremium: record.recommendedPremium.toString(),
    }).returning();

    // Create policy record
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(startDate.getFullYear() + 1);

    await db.insert(policies).values({
      policyCode: record.id,
      farmId: farm.id,
      premiumPredictionId: premium.id,
      coverageAmount: record.coverageAmount.toString(),
      status: record.status,
      startDate,
      endDate,
      assessmentSnapshot: record as any,
      auditTrail: record.auditTrail as any,
    });
  } catch (err) {
    console.warn("Database save fallback warning (saved to local file store):", err);
  }

  return record;
}

export async function updateUnderwritingDecision(params: {
  id: string;
  status: UnderwritingStatus;
  actor?: string;
  decisionReason?: string;
  underwriterNotes?: string;
  informationRequest?: string;
  rejectionReason?: string;
}): Promise<UnderwritingRecord> {
  const record = await getUnderwritingRecordById(params.id);
  if (!record) {
    throw new Error(`Underwriting application ${params.id} not found.`);
  }

  const now = new Date().toISOString();
  const actor = params.actor || "Senior Underwriter";

  record.status = params.status;
  record.reviewedBy = actor;
  record.reviewedAt = now;

  if (params.decisionReason) record.decisionReason = params.decisionReason;
  if (params.underwriterNotes) record.underwriterNotes = params.underwriterNotes;
  if (params.informationRequest) record.informationRequest = params.informationRequest;
  if (params.rejectionReason) record.rejectionReason = params.rejectionReason;

  // Add event to audit trail
  const actionTitle =
    params.status === "APPROVED"
      ? "Application Approved by Underwriter"
      : params.status === "REJECTED"
      ? "Application Rejected by Underwriter"
      : params.status === "NEEDS_INFORMATION"
      ? "Information Requested from Applicant"
      : "Application Reviewed by Underwriter";

  const eventNotes =
    params.status === "APPROVED"
      ? `Approved with reason: ${params.decisionReason || "Acceptable risk appetite"}. Notes: ${params.underwriterNotes || "None"}`
      : params.status === "REJECTED"
      ? `Rejected with reason: ${params.rejectionReason || params.decisionReason || "Exceeds underwriting appetite"}. Notes: ${params.underwriterNotes || "None"}`
      : params.status === "NEEDS_INFORMATION"
      ? `Information requested: ${params.informationRequest || "Documentation needed"}`
      : `Status updated to ${params.status}. Notes: ${params.underwriterNotes || "None"}`;

  record.auditTrail = [
    ...(record.auditTrail || []),
    {
      id: `aud-${Date.now()}-${record.auditTrail.length + 1}`,
      timestamp: now,
      action: actionTitle,
      actor,
      status: params.status,
      notes: eventNotes,
      reason: params.decisionReason || params.rejectionReason,
    },
  ];

  _memoryStore.set(record.id, record);
  persistStoreToFile();

  // Update in DB if database is connected
  try {
    const db = getDb();
    await db
      .update(policies)
      .set({
        status: params.status,
        reviewedBy: actor,
        reviewedAt: new Date(now),
        decisionReason: params.decisionReason || null,
        underwriterNotes: params.underwriterNotes || null,
        informationRequest: params.informationRequest || null,
        rejectionReason: params.rejectionReason || null,
        assessmentSnapshot: record as any,
        auditTrail: record.auditTrail as any,
      })
      .where(eq(policies.policyCode, record.id));
  } catch {
    // Database connection optional
  }

  return record;
}
