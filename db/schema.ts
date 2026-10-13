/**
 * ========================================================================================
 * 🌾 AGRISURGE DATABASE SCHEMA DEFINITION (PostgreSQL via Drizzle ORM)
 * ========================================================================================
 * 
 * WHAT IS THIS FILE?
 * This file defines the entire relational database structure (tables, columns, data types,
 * primary keys, foreign keys, and constraints) for AgriSurge using Drizzle ORM.
 * 
 * KEY DBMS CONCEPTS IMPLEMENTED HERE:
 * 1. Entities & Relations: Defines 7 core entities (Farmers, Farms, WeatherData,
 *    RiskPredictions, PremiumPredictions, Policies, Notifications).
 * 2. Primary Keys (PK): Uniquely identifies each record (e.g., `id: serial("id").primaryKey()`).
 * 3. Foreign Keys (FK) & Referential Integrity: Links related entities together (e.g.,
 *    `farmId` referencing `farms.id`, `farmerId` referencing `farmers.id`).
 * 4. Normalization: Structured in 3rd Normal Form (3NF) to minimize redundancy and prevent anomalies.
 * 5. Data Types: Numeric (precise currency/coordinates), VarChar, Text, Timestamp, JSONB, Boolean.
 * 6. Enums (Enumerated Types): Restricts column values to fixed sets (e.g., risk level, policy status).
 * 7. Semi-Structured Data: JSONB columns for flexible data like GeoJSON coordinates & audit logs.
 * ========================================================================================
 */

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

/* ========================================================================================
 * 1. ENUMERATED TYPES (ENUMs)
 * DBMS Concept: Domain integrity - restricting column values to an allowed set of strings.
 * ======================================================================================== */

// Represents the categorized risk assessment computed by the ML / heuristic engine
export const riskLevelEnum = pgEnum("risk_level", ["low", "moderate", "high"]);

// Represents the lifecycle state of an insurance policy in the system
export const policyStatusEnum = pgEnum("policy_status", ["active", "pending", "expired", "under_review"]);

// Represents urgency/priority levels for automated system alerts & notifications
export const alertSeverityEnum = pgEnum("alert_severity", ["high", "medium", "info"]);

// Represents the operational health and connectivity status of external IoT/API data sources
export const dataSourceStatusEnum = pgEnum("data_source_status", ["connected", "not_configured", "error"]);


/* ========================================================================================
 * 2. TABLE DEFINITIONS (Entities & Relationships)
 * ======================================================================================== */

/**
 * 👨‍🌾 ENTITY 1: FARMERS (Master Entity)
 * Stores personal and contact details of registered agricultural owners/farmers.
 * 
 * Relationship: 1 Farmer -> Can own Many Farms (1:M Relationship)
 */
export const farmers = pgTable("farmers", {
  // Primary Key: Auto-incrementing integer (1, 2, 3...)
  id: serial("id").primaryKey(),

  // Farmer's full legal name (Max 120 characters, Mandatory)
  name: varchar("name", { length: 120 }).notNull(),

  // Contact phone number for alerts & verification (Optional)
  phone: varchar("phone", { length: 20 }),

  // Geographic state or district (e.g., "Maharashtra", "Punjab")
  region: varchar("region", { length: 80 }),

  // Timestamp when the farmer record was registered (Defaults to current server time)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


/**
 * 🚜 ENTITY 2: FARMS (Core Entity)
 * Stores land parcels, soil attributes, crop specifications, and geospatial coordinates.
 * 
 * Relationships:
 * - Many Farms -> Belong to 1 Farmer (Foreign Key to `farmers.id`)
 * - 1 Farm -> Has Many Weather Records, Risk Predictions, and Policies (1:M)
 */
export const farms = pgTable("farms", {
  // Primary Key: Unique internal identifier for the farm
  id: serial("id").primaryKey(),

  // Unique Business Key: Human-readable code e.g. "F-10293" (Unique Constraint enforced)
  farmCode: varchar("farm_code", { length: 20 }).notNull().unique(),

  // Foreign Key: Links this farm to its registered owner in the `farmers` table
  farmerId: integer("farmer_id").references(() => farmers.id).notNull(),

  // Name or title of the farm parcel (e.g., "Green Valley Plot A")
  name: varchar("name", { length: 120 }).notNull(),

  // Geographic administrative region / district
  region: varchar("region", { length: 80 }).notNull(),

  // Specific village, taluka, or address description
  location: varchar("location", { length: 160 }),

  // Primary crop type grown on this parcel (e.g., "Cotton", "Wheat", "Sugarcane")
  crop: varchar("crop", { length: 60 }).notNull(),

  // Specific botanical variety / seed type (e.g., "BT Cotton Hybrid 6")
  cropVariety: varchar("crop_variety", { length: 80 }),

  // Soil classification (e.g., "Black Soil (Regur)", "Alluvial", "Red Sandy")
  soilType: varchar("soil_type", { length: 60 }),

  // Irrigation infrastructure (e.g., "Drip Irrigation", "Canal", "Rainfed")
  irrigationType: varchar("irrigation_type", { length: 60 }),

  // Total farm land size in acres (Precision: 8 digits total, 2 decimal places e.g., 1250.50)
  areaAcres: numeric("area_acres", { precision: 8, scale: 2 }).notNull(),

  // Semi-Structured Geospatial Data: Stores polygon coordinates as a JSON GeoJSON object
  boundaryGeoJson: jsonb("boundary_geojson"),

  // Base64 thumbnail or URL image of the satellite boundary plot
  boundaryImage: text("boundary_image"),

  // GPS Latitude coordinate (e.g., 19.751500)
  latitude: numeric("latitude", { precision: 9, scale: 6 }).notNull(),

  // GPS Longitude coordinate (e.g., 75.713900)
  longitude: numeric("longitude", { precision: 9, scale: 6 }).notNull(),

  // Audit timestamp of when this farm record was created
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


/**
 * 🌦️ ENTITY 3: WEATHER DATA (Time-Series Environmental Records)
 * Stores real-time and historical weather observations linked to a specific farm parcel.
 * 
 * Relationship: Many Weather Observations -> Belong to 1 Farm (FK to `farms.id`)
 */
export const weatherData = pgTable("weather_data", {
  // Primary Key
  id: serial("id").primaryKey(),

  // Foreign Key: Identifies which farm parcel these measurements belong to
  farmId: integer("farm_id").references(() => farms.id).notNull(),

  // Observed temperature in Celsius (e.g., 34.50 °C)
  temperatureC: numeric("temperature_c", { precision: 5, scale: 2 }),

  // Observed rainfall in millimeters (e.g., 120.75 mm)
  rainfallMm: numeric("rainfall_mm", { precision: 6, scale: 2 }),

  // Relative humidity percentage (e.g., 65.20 %)
  humidityPct: numeric("humidity_pct", { precision: 5, scale: 2 }),

  // Wind speed in kilometers per hour (e.g., 18.50 km/h)
  windSpeedKph: numeric("wind_speed_kph", { precision: 5, scale: 2 }),

  // Name of the data provider (e.g., "Open-Meteo", "IMD Pune", "IoT Sensor 4")
  source: varchar("source", { length: 40 }),

  // Data pipeline status enum ("connected", "not_configured", "error")
  status: dataSourceStatusEnum("status").default("not_configured"),

  // Timestamp when the weather measurement was recorded in the field
  observedAt: timestamp("observed_at").defaultNow().notNull(),
});


/**
 * 🤖 ENTITY 4: RISK PREDICTIONS (Machine Learning Output)
 * Stores the crop-failure risk probability and contributing factors generated by the ML model.
 * 
 * Relationships:
 * - Many Risk Predictions -> Belong to 1 Farm (FK to `farms.id`)
 * - 1 Risk Prediction -> Triggers 1 Premium Prediction (1:1 Relationship)
 */
export const riskPredictions = pgTable("risk_predictions", {
  // Primary Key
  id: serial("id").primaryKey(),

  // Foreign Key: Farm parcel being evaluated
  farmId: integer("farm_id").references(() => farms.id).notNull(),

  // Calculated risk score from 0.000 to 1.000 (e.g., 0.742 indicates 74.2% crop failure probability)
  riskScore: numeric("risk_score", { precision: 4, scale: 3 }).notNull(),

  // Categorical level ("low" | "moderate" | "high") mapped from riskScore
  riskLevel: riskLevelEnum("risk_level").notNull(),

  // Name of the AI algorithm / model used (e.g., "RandomForestClassifier_V2", "XGBoost")
  modelName: varchar("model_name", { length: 80 }).notNull(),

  // Release version of the ML model artifact (e.g., "v2.1.0")
  modelVersion: varchar("model_version", { length: 20 }).notNull(),

  // Explainable AI Factors (JSON Array containing `{ name, contribution, direction }`)
  factors: jsonb("factors"),

  // Flag indicating if this was produced by mock/heuristic fallback vs live ML inference
  isMock: boolean("is_mock").default(false).notNull(),

  // Timestamp when the assessment was generated
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});


/**
 * 💰 ENTITY 5: PREMIUM PREDICTIONS (Actuarial Pricing Engine Output)
 * Stores calculated insurance premiums derived mathematically from the ML risk score.
 * 
 * Relationship: 1 Premium Prediction -> Derived from 1 Risk Prediction (FK to `riskPredictions.id`)
 */
export const premiumPredictions = pgTable("premium_predictions", {
  // Primary Key
  id: serial("id").primaryKey(),

  // Foreign Key: Links directly to the underlying ML risk assessment that drove this quote
  riskPredictionId: integer("risk_prediction_id").references(() => riskPredictions.id).notNull(),

  // Base actuarial rate for the crop (e.g., ₹2,500.00 per acre)
  basePremium: numeric("base_premium", { precision: 10, scale: 2 }).notNull(),

  // Dynamic risk multiplier calculated by the pricing engine (e.g., 1.45x)
  multiplier: numeric("multiplier", { precision: 4, scale: 2 }).notNull(),

  // Final recommended annual premium payable (e.g., ₹3,625.00)
  recommendedPremium: numeric("recommended_premium", { precision: 10, scale: 2 }).notNull(),

  // Creation timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


/**
 * 📜 ENTITY 6: POLICIES (Underwriting Contracts & Lifecycle)
 * Stores agricultural insurance policy contracts, underwriter review states, and audit trails.
 * 
 * Relationships:
 * - Belongs to 1 Farm (FK to `farms.id`)
 * - Optionally linked to a Premium Prediction quote (FK to `premiumPredictions.id`)
 */
export const policies = pgTable("policies", {
  // Primary Key
  id: serial("id").primaryKey(),

  // Unique Policy Code / Reference Number e.g. "UW-2026-84433" (Unique Constraint)
  policyCode: varchar("policy_code", { length: 30 }).notNull().unique(),

  // Foreign Key: The insured farm parcel
  farmId: integer("farm_id").references(() => farms.id).notNull(),

  // Foreign Key: The pricing quote on which this policy was quoted/issued
  premiumPredictionId: integer("premium_prediction_id").references(() => premiumPredictions.id),

  // Total insurance financial coverage amount (Sum Insured in INR e.g., ₹500,000.00)
  coverageAmount: numeric("coverage_amount", { precision: 12, scale: 2 }).notNull(),

  // Underwriting lifecycle state ("DRAFT", "UNDER_REVIEW", "NEEDS_INFORMATION", "APPROVED", "REJECTED")
  status: varchar("status", { length: 40 }).default("UNDER_REVIEW").notNull(),

  // Policy term start date
  startDate: timestamp("start_date").notNull(),

  // Policy term expiry date
  endDate: timestamp("end_date").notNull(),

  // Officer / Underwriter who reviewed the application (e.g., "Kunal S.")
  reviewedBy: varchar("reviewed_by", { length: 120 }),

  // Timestamp when the underwriter approved/rejected the policy
  reviewedAt: timestamp("reviewed_at"),

  // Justification summary for approval/rejection decision
  decisionReason: text("decision_reason"),

  // Internal underwriter notes and observations
  underwriterNotes: text("underwriter_notes"),

  // Specific clarifications requested from farmer if status is "NEEDS_INFORMATION"
  informationRequest: text("information_request"),

  // Formal reason if the policy was rejected
  rejectionReason: text("rejection_reason"),

  // Snapshot of environmental & risk data at the moment of approval (Historical audit record)
  assessmentSnapshot: jsonb("assessment_snapshot"),

  // Comprehensive audit trail logging every state change, timestamp, and user action
  auditTrail: jsonb("audit_trail"),

  // Path or URL to the generated legal Insurance Policy Certificate PDF
  certificatePdf: text("certificate_pdf"),

  // Creation timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


/**
 * 🔔 ENTITY 7: NOTIFICATIONS (System Alerts & Warnings)
 * Stores critical weather alerts, high-risk farm flags, and policy status update notifications.
 * 
 * Relationship: May be linked to a specific Farm (FK to `farms.id`), or broadcast globally.
 */
export const notifications = pgTable("notifications", {
  // Primary Key
  id: serial("id").primaryKey(),

  // Foreign Key: Farm parcel associated with the alert (Optional for system-wide notices)
  farmId: integer("farm_id").references(() => farms.id),

  // Urgency indicator ("high" | "medium" | "info")
  severity: alertSeverityEnum("severity").notNull(),

  // Alert message body (e.g., "Severe drought risk detected in Jalna district")
  message: text("message").notNull(),

  // Read status boolean flag (true = read, false = unread notification)
  read: boolean("read").default(false).notNull(),

  // Notification generation timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const farmerAssessments = pgTable("farmer_assessments", {
  id: serial("id").primaryKey(),
  assessmentCode: varchar("assessment_code", { length: 40 }).notNull().unique(),
  farmerId: integer("farmer_id").references(() => farmers.id).notNull(),
  farmerName: varchar("farmer_name", { length: 120 }),
  farmerPhone: varchar("farmer_phone", { length: 20 }),
  district: varchar("district", { length: 80 }),
  taluka: varchar("taluka", { length: 80 }),
  village: varchar("village", { length: 80 }),
  locationName: varchar("location_name", { length: 200 }),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  areaAcres: numeric("area_acres", { precision: 8, scale: 2 }).notNull().default("1.0"),
  irrigationType: varchar("irrigation_type", { length: 60 }),
  soilType: varchar("soil_type", { length: 60 }),
  farmImageUrl: text("farm_image_url"),
  soilImageUrl: text("soil_image_url"),
  weatherData: jsonb("weather_data"),
  recommendations: jsonb("recommendations"),
  selectedCrop: varchar("selected_crop", { length: 80 }).notNull(),
  selectedLanguage: varchar("selected_language", { length: 10 }).notNull().default("mr"),
  cropGuidance: jsonb("crop_guidance"),
  premiumEstimate: numeric("premium_estimate", { precision: 12, scale: 2 }).notNull().default("0"),
  pricingDetails: jsonb("pricing_details"),
  modelMetadata: jsonb("model_metadata"),
  status: varchar("status", { length: 40 }).notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 🏢 ENTITY 8: INSURANCE ACCOUNTS (Insurance Carriers & Underwriters)
 * Stores registered insurance company officers and underwriter profiles.
 */
export const insuranceAccounts = pgTable("insurance_accounts", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  role: varchar("role", { length: 80 }).default("Underwriter").notNull(),
  organization: varchar("organization", { length: 160 }).notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * 🛡️ ENTITY 9: ADMINS (Platform Management)
 * Stores internal AgriSurge administrators for dashboard analytics access.
 */
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 120 }),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

