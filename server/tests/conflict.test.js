const { detectAndResolveConflicts, getTrustScore } = require("../src/services/government/conflictDetector");

describe("Source Conflict Detection Unit Tests", () => {
    
    test("Trust Score hierarchy checks", () => {
        expect(getTrustScore("LEGISLATION")).toBe(6);
        expect(getTrustScore("MINISTRY_PORTAL")).toBe(5);
        expect(getTrustScore("SECONDARY_TRUSTED")).toBe(2);
        expect(getTrustScore("SECONDARY_UNTRUSTED")).toBe(1);
    });

    test("No conflict when sources match", () => {
        const service = {
            conflictData: {
                fees: [
                    { sourceId: "src-1", value: "Free" },
                    { sourceId: "src-2", value: "Free" }
                ]
            }
        };
        const sources = [
            { sourceId: "src-1", sourceType: "LEGISLATION" },
            { sourceId: "src-2", sourceType: "STATE_PORTAL" }
        ];

        const result = detectAndResolveConflicts(service, sources);
        expect(result.hasConflict).toBe(false);
        expect(result.conflicts.length).toBe(0);
    });

    test("Conflict resolved by trust hierarchy (Legislation > News Blog)", () => {
        const service = {
            conflictData: {
                fees: [
                    { sourceId: "src-legislation", value: "Free" },
                    { sourceId: "src-blog", value: "₹50 fee" }
                ]
            }
        };
        const sources = [
            { sourceId: "src-legislation", title: "National Act", sourceType: "LEGISLATION" },
            { sourceId: "src-blog", title: "Yojana Blog", sourceType: "SECONDARY_UNTRUSTED" }
        ];

        const result = detectAndResolveConflicts(service, sources);
        expect(result.hasConflict).toBe(true);
        expect(result.conflicts.length).toBe(1);
        expect(result.conflicts[0].field).toBe("fees");
        expect(result.conflicts[0].resolvedValue).toBe("Free");
        expect(result.conflicts[0].resolvedSourceId).toBe("src-legislation");
    });

    test("Conflict resolved by newest publication date when trust tiers match", () => {
        const service = {
            conflictData: {
                deadlines: [
                    { sourceId: "src-old-portal", value: "December 31st" },
                    { sourceId: "src-new-portal", value: "March 31st" }
                ]
            }
        };
        const sources = [
            { 
                sourceId: "src-old-portal", 
                title: "Old Portal Announcement", 
                sourceType: "MINISTRY_PORTAL",
                publicationDate: new Date("2024-01-01") 
            },
            { 
                sourceId: "src-new-portal", 
                title: "New Portal Announcement", 
                sourceType: "MINISTRY_PORTAL",
                publicationDate: new Date("2026-05-15") 
            }
        ];

        const result = detectAndResolveConflicts(service, sources);
        expect(result.hasConflict).toBe(true);
        expect(result.conflicts[0].resolvedValue).toBe("March 31st");
        expect(result.conflicts[0].resolvedSourceId).toBe("src-new-portal");
    });
});
