# Government dataset

The shared registry in `src/data/governmentSeedData.js` currently contains 12 Indian government services and 12 official sources. It supports navigation and recommendation; official portals remain authoritative and scheme details must be periodically re-verified.

Services reference source records through `officialSources`. Before insertion, `governmentSeedValidation.js` checks identifiers, schema-shaped fields, statuses, official HTTPS government URLs, eligibility operators, documents, procedures, dates, and source references. Run validation through `npm run seed`; it occurs before MongoDB is contacted.

`npm run seed` loads the registry, replaces only GovernmentService and GovernmentSource records, and prints counts. `localDbFallback.js` imports the same arrays, so offline fallback cannot diverge from the seeded registry.

To add a source, use an official HTTPS government/authority portal, choose an existing source type, set verification metadata, and run tests. Add a service using that `sourceId`, only include eligibility, document, and procedure information confirmed by the official source, then run:

```
npm test
npm run seed
```

Recommendation keeps the existing weighted relevance, eligibility, jurisdiction, source reliability/freshness, and procedure-completeness model. Gemini may be used for intent extraction; deterministic parsing remains available when AI is unavailable. This is not legal advice and does not guarantee eligibility.
