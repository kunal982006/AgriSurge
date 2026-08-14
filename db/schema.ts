import {
  pgTable,
  serial,
  text,
  varchar,
  numeric,
  timestamp,
  integer,
  jsonb,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";

export const riskLevelEnum = pgEnum("risk_level", ["low", "moderate", "high"]);
export const policyStatusEnum = pgEnum("policy_status", ["active", "pending", "expired", "under_review"]);
export const alertSeverityEnum = pgEnum("alert_severity", ["high", "medium", "info"]);
export const dataSourceStatusEnum = pgEnum("data_source_status", ["connected", "not_configured", "error"]);

export const farmers = pgTable("farmers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  region: varchar("region", { length: 80 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  farmCode: varchar("farm_code", { length: 20 }).notNull().unique(), // e.g. F-10293
  farmerId: integer("farmer_id").references(() => farmers.id).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  region: varchar("region", { length: 80 }).notNull(),
  location: varchar("location", { length: 160 }),
  crop: varchar("crop", { length: 60 }).notNull(),
  cropVariety: varchar("crop_variety", { length: 80 }),
  soilType: varchar("soil_type", { length: 60 }),
  irrigationType: varchar("irrigation_type", { length: 60 }),
  areaAcres: numeric("area_acres", { precision: 8, scale: 2 }).notNull(),
  boundaryGeoJson: jsonb("boundary_geojson"),
  latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").references(() => farms.id).notNull(),
  temperatureC: numeric("temperature_c", { precision: 5, scale: 2 }),
  rainfallMm: numeric("rainfall_mm", { precision: 6, scale: 2 }),
  humidityPct: numeric("humidity_pct", { precision: 5, scale: 2 }),
  windSpeedKph: numeric("wind_speed_kph", { precision: 5, scale: 2 }),
  source: varchar("source", { length: 40 }),
  status: dataSourceStatusEnum("status").default("not_configured"),
  observedAt: timestamp("observed_at").defaultNow().notNull(),
});

export const riskPredictions = pgTable("risk_predictions", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").references(() => farms.id).notNull(),
  riskScore: numeric("risk_score", { precision: 4, scale: 3 }).notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  modelName: varchar("model_name", { length: 80 }).notNull(),
  modelVersion: varchar("model_version", { length: 20 }).notNull(),
  factors: jsonb("factors"), // array of { name, contribution, direction }
  isMock: boolean("is_mock").default(false).notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const premiumPredictions = pgTable("premium_predictions", {
  id: serial("id").primaryKey(),
  riskPredictionId: integer("risk_prediction_id").references(() => riskPredictions.id).notNull(),
  basePremium: numeric("base_premium", { precision: 10, scale: 2 }).notNull(),
  multiplier: numeric("multiplier", { precision: 4, scale: 2 }).notNull(),
  recommendedPremium: numeric("recommended_premium", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  policyCode: varchar("policy_code", { length: 30 }).notNull().unique(), // e.g. UW-2026-84433
  farmId: integer("farm_id").references(() => farms.id).notNull(),
  premiumPredictionId: integer("premium_prediction_id").references(() => premiumPredictions.id),
  coverageAmount: numeric("coverage_amount", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 40 }).default("UNDER_REVIEW").notNull(), // DRAFT | UNDER_REVIEW | NEEDS_INFORMATION | APPROVED | REJECTED
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reviewedBy: varchar("reviewed_by", { length: 120 }),
  reviewedAt: timestamp("reviewed_at"),
  decisionReason: text("decision_reason"),
  underwriterNotes: text("underwriter_notes"),
  informationRequest: text("information_request"),
  rejectionReason: text("rejection_reason"),
  assessmentSnapshot: jsonb("assessment_snapshot"),
  auditTrail: jsonb("audit_trail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").references(() => farms.id),
  severity: alertSeverityEnum("severity").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
