# Field Assistant by Quantum Edge

## Goal
Create a separate, independent project named **Field Assistant** under **Quantum Edge**, preserving DaBella Close Engine unchanged. Field Assistant will be a configurable field-sales and quoting platform for home remodeling, roofing, windows, siding, coatings, pest and insect control, HVAC, plumbing, electrical, solar, landscaping, and future service industries.

## Product structure
1. **Quantum Edge platform identity**
   - Replace DaBella branding, assets, language, product names, warranties, scripts, and regional assumptions.
   - Add company-controlled branding profiles so each customer can use its own name, logo, colors, terminology, documents, and customer-facing experience.
   - Keep “Field Assistant” as the product name and “Quantum Edge” as the company/rights owner throughout the app and documentation.

2. **Company and user separation**
   - Introduce organizations as strict data boundaries.
   - Scope users, roles, customers, leads, deals, inspections, quotes, reports, catalogs, workflows, and settings to their company.
   - Preserve secure role checks and expand roles for administrators, managers, sales representatives, estimators, inspectors, technicians, and dispatchers.

3. **Industry-pack architecture**
   - Replace fixed DaBella product lists with configurable industry packs.
   - Each pack defines its services, inspection forms, measurements, photo tags, pricing units, scope templates, quote options, warranties, compliance requirements, sales content, and KPIs.
   - Seed initial packs for remodeling/exteriors and pest control, then validate the same model against HVAC and a generic quoting pack.

4. **Universal inspection and quoting engine**
   - Replace fixed roof/window/bath fields with versioned, configurable inspection schemas.
   - Support photos, annotations, severity, measurements, recommendations, materials, labor, recurring services, one-time services, packages, add-ons, discounts, taxes, financing, and good/better/best or custom quote structures.
   - Preserve the existing fast in-home workflow while allowing each company to configure its own stages and terminology.

5. **Intelligence layer**
   - Separate universal signals from industry-specific scoring.
   - Build configurable opportunity scoring, next-best-action, expected value, close probability, affordability, service urgency, asset lifecycle, territory, route-density, and follow-up intelligence.
   - Keep property intelligence optional; support provider adapters and non-property signals for service industries.

6. **Global language packs**
   - Replace the current English/Spanish-only toggle and live per-string translation with versioned language packs.
   - Add locale-aware currency, date, number, timezone, tax, measurement-unit, and address formatting.
   - Support company defaults, user preference, customer document language, translated saved content, PDF parity, and right-to-left layouts.
   - Use human-reviewable translation catalogs; AI may draft translations but will not be the only runtime source.

7. **Configurable proposals, reports, and playbooks**
   - Convert fixed PDF page order into reusable document blocks selected by company and industry.
   - Make branding, disclosures, warranties, scopes, financing, inspection findings, signatures, and attachments configurable.
   - Move battle cards, scripts, objections, coaching, training, and resources into company-managed content rather than compiled DaBella files.

8. **Commercial administration**
   - Add company onboarding, branding, industry-pack installation, catalog import, pricing rules, workflow configuration, language-pack management, permissions, audit history, and feature controls.
   - Generalize commission plans and KPI scorecards so they are configurable by company, role, region, and service line.

## Migration approach
1. Remix the current app into a separate project named **Field Assistant**; leave DaBella Close Engine untouched.
2. Establish Quantum Edge branding and neutral terminology before introducing new customers or industries.
3. Add organization boundaries and security rules before copying live customer data.
4. Convert fixed products, inspections, pricing, workflows, playbooks, and documents into configuration, using current DaBella behavior only as a reference pack—not as the platform default.
5. Replace the language layer and formatting system, then complete every core screen and report in English and Spanish.
6. Add pest control, HVAC, and generic quote packs to prove the platform is genuinely industry-agnostic.
7. Validate mobile/tablet workflows, security, reporting, PDF output, and language switching before launch.

## Intellectual-property deliverables
- Update the architecture and originality records around **FIELD ASSISTANT** and **QUANTUM EDGE**.
- Produce a clean-room inventory separating Quantum Edge platform IP from DaBella-specific content, third-party libraries, manufacturer materials, data providers, and customer-owned assets.
- Prepare trademark-ready specimens and filing worksheets only after the neutral brand is visible in the separate project.
- Keep legal-name, ownership, first-use, signer, and filing-class details as explicit placeholders until confirmed; include legal-review disclaimers and make no registration guarantee.

## Technical notes
- The existing project has no organization boundary and uses fixed product/type unions, compiled sales content, fixed proposal sequencing, and direct DaBella asset imports. These are the primary conversion areas.
- Reusable foundations include the deal pipeline, follow-ups, stage history, role-check pattern, commission/KPI mechanics, UI system, PDF rendering utilities, photo evidence, and current sales workflow concepts.
- The current app manifest was repaired from saved project history and a production build now succeeds. This repair preserves the source project before remixing.

## Launch checkpoints
- No DaBella marks or confidential sales content appear in Field Assistant defaults.
- A new company and industry can be configured without changing source code.
- Every data request is company-scoped and protected.
- All customer-facing screens and reports use the selected locale consistently.
- At least three materially different industries complete lead-to-inspection-to-quote-to-close workflows.
- Quantum Edge’s IP packet distinguishes original platform elements from licensed, open-source, manufacturer, provider, and customer content.
