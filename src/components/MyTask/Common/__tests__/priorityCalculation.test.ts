import {
  calculateTaskPriority,
  EVENT_IMPORTANCE_MAPPING,
  getEventImportanceScore,
  getPriorityLabel,
  getScoreToPriorityLevel,
  isValidActivityType,
} from "../priorityCalculation";

describe("Priority Calculation System", () => {
  describe("getEventImportanceScore", () => {
    it("should return correct importance for known event types", () => {
      expect(getEventImportanceScore("new-job-posting")).toBe(10);
      expect(getEventImportanceScore("open-to-work")).toBe(9);
      expect(getEventImportanceScore("laid-off")).toBe(9);
      expect(getEventImportanceScore("funding-news")).toBe(8);
      expect(getEventImportanceScore("birthday")).toBe(8);
      expect(getEventImportanceScore("m-and-a-activity")).toBe(6);
      expect(getEventImportanceScore("email-reply-received")).toBe(6);
      expect(getEventImportanceScore("holiday")).toBe(4);
      expect(getEventImportanceScore("personal-interest-tag")).toBe(4);
      expect(getEventImportanceScore("dormant-status")).toBe(2);
      expect(getEventImportanceScore("interview")).toBe(9);
      expect(getEventImportanceScore("follow-up")).toBe(6);
      expect(getEventImportanceScore("email")).toBe(4);
    });

    it("should return default score for unknown event types", () => {
      expect(getEventImportanceScore("unknown-event")).toBe(5);
    });
  });

  describe("getScoreToPriorityLevel", () => {
    it("should map scores to correct priority levels", () => {
      expect(getScoreToPriorityLevel(100)).toBe("4"); // Score 100 → Priority 4 (Critical)
      expect(getScoreToPriorityLevel(90)).toBe("4"); // Score 90 → Priority 4 (Critical)
      expect(getScoreToPriorityLevel(80)).toBe("4"); // Score 80 → Priority 4 (Critical)
      expect(getScoreToPriorityLevel(70)).toBe("3"); // Score 70 → Priority 3 (High)
      expect(getScoreToPriorityLevel(60)).toBe("3"); // Score 60 → Priority 3 (High)
      expect(getScoreToPriorityLevel(50)).toBe("2"); // Score 50 → Priority 2 (Medium)
      expect(getScoreToPriorityLevel(40)).toBe("2"); // Score 40 → Priority 2 (Medium)
      expect(getScoreToPriorityLevel(30)).toBe("1"); // Score 30 → Priority 1 (Low)
      expect(getScoreToPriorityLevel(20)).toBe("1"); // Score 20 → Priority 1 (Low)
      expect(getScoreToPriorityLevel(10)).toBe("1"); // Score 10 → Priority 1 (Low)
      expect(getScoreToPriorityLevel(5)).toBe("1"); // Score 5 → Priority 1 (Low)
    });
  });

  describe("getPriorityLabel", () => {
    it("should return correct labels for priority levels", () => {
      expect(getPriorityLabel("4")).toBe("Critical");
      expect(getPriorityLabel("3")).toBe("High");
      expect(getPriorityLabel("2")).toBe("Medium");
      expect(getPriorityLabel("1")).toBe("Low");
    });

    it("should return default label for unknown priority levels", () => {
      expect(getPriorityLabel("5")).toBe("Low");
      expect(getPriorityLabel("0")).toBe("Low");
    });
  });

  describe("calculateTaskPriority", () => {
    it("should calculate priority correctly for high engagement + high importance", () => {
      const result = calculateTaskPriority(8, "new-job-posting");

      expect(result.engagementScore).toBe(8);
      expect(result.eventImportance).toBe(10);
      expect(result.calculatedScore).toBe(80);
      expect(result.priorityLevel).toBe("4");
      expect(result.priorityLabel).toBe("Critical");
      expect(result.calculation).toBe("8 × 10 = 80");
      expect(result.explanation).toBe("Score 80 maps to Priority 4 (Critical)");
    });

    it("should calculate priority correctly for medium engagement + medium importance", () => {
      const result = calculateTaskPriority(6, "follow-up");

      expect(result.engagementScore).toBe(6);
      expect(result.eventImportance).toBe(6);
      expect(result.calculatedScore).toBe(36);
      expect(result.priorityLevel).toBe("1");
      expect(result.priorityLabel).toBe("Low");
      expect(result.calculation).toBe("6 × 6 = 36");
      expect(result.explanation).toBe("Score 36 maps to Priority 1 (Low)");
    });

    it("should calculate priority correctly for low engagement + low importance", () => {
      const result = calculateTaskPriority(3, "email");

      expect(result.engagementScore).toBe(3);
      expect(result.eventImportance).toBe(4);
      expect(result.calculatedScore).toBe(12);
      expect(result.priorityLevel).toBe("1");
      expect(result.priorityLabel).toBe("Low");
      expect(result.calculation).toBe("3 × 4 = 12");
      expect(result.explanation).toBe("Score 12 maps to Priority 1 (Low)");
    });

    it("should handle maximum values correctly", () => {
      const result = calculateTaskPriority(10, "new-job-posting");

      expect(result.engagementScore).toBe(10);
      expect(result.eventImportance).toBe(10);
      expect(result.calculatedScore).toBe(100);
      expect(result.priorityLevel).toBe("4");
      expect(result.priorityLabel).toBe("Critical");
      expect(result.calculation).toBe("10 × 10 = 100");
      expect(result.explanation).toBe(
        "Score 100 maps to Priority 4 (Critical)"
      );
    });

    it("should handle minimum values correctly", () => {
      const result = calculateTaskPriority(1, "dormant-status");

      expect(result.engagementScore).toBe(1);
      expect(result.eventImportance).toBe(2);
      expect(result.calculatedScore).toBe(2);
      expect(result.priorityLevel).toBe("1");
      expect(result.priorityLabel).toBe("Low");
      expect(result.calculation).toBe("1 × 2 = 2");
      expect(result.explanation).toBe("Score 2 maps to Priority 1 (Low)");
    });
  });

  describe("Business Logic Validation", () => {
    it("should demonstrate high priority calculation example", () => {
      const result = calculateTaskPriority(8, "new-job-posting");

      expect(result.calculation).toBe("8 × 10 = 80");
      expect(result.priorityLevel).toBe("4");
      expect(result.priorityLabel).toBe("Critical");
      expect(result.explanation).toBe("Score 80 maps to Priority 4 (Critical)");
    });

    it("should handle GitHub issue #138 event types correctly", () => {
      // Test highest priority: contact laying off with high engagement
      const layoffResult = calculateTaskPriority(9, "laid-off");
      expect(layoffResult.calculatedScore).toBe(81); // 9 × 9
      expect(layoffResult.priorityLevel).toBe("4"); // Critical

      // Test medium priority: funding news with medium engagement
      const fundingResult = calculateTaskPriority(6, "funding-news");
      expect(fundingResult.calculatedScore).toBe(48); // 6 × 8
      expect(fundingResult.priorityLevel).toBe("2"); // Medium

      // Test low priority: dormant contact
      const dormantResult = calculateTaskPriority(3, "dormant-status");
      expect(dormantResult.calculatedScore).toBe(6); // 3 × 2
      expect(dormantResult.priorityLevel).toBe("1"); // Low
    });

    it("should prioritize interviews over follow-ups for same engagement", () => {
      const interviewResult = calculateTaskPriority(5, "interview");
      const followUpResult = calculateTaskPriority(5, "follow-up");

      expect(interviewResult.calculatedScore).toBe(45); // 5 × 9
      expect(followUpResult.calculatedScore).toBe(30); // 5 × 6
      expect(interviewResult.priorityLevel).toBe("2"); // Medium
      expect(followUpResult.priorityLevel).toBe("1"); // Low
    });

    it("should prioritize high engagement contacts over low engagement for same event", () => {
      const highEngagementResult = calculateTaskPriority(9, "follow-up");
      const lowEngagementResult = calculateTaskPriority(3, "follow-up");

      expect(highEngagementResult.calculatedScore).toBe(54); // 9 × 6
      expect(lowEngagementResult.calculatedScore).toBe(18); // 3 × 6
      expect(highEngagementResult.priorityLevel).toBe("2"); // Medium
      expect(lowEngagementResult.priorityLevel).toBe("1"); // Low
    });
  });

  describe("isValidActivityType", () => {
    it("should validate known activity types", () => {
      expect(isValidActivityType("new-job-posting")).toBe(true);
      expect(isValidActivityType("interview")).toBe(true);
      expect(isValidActivityType("email")).toBe(true);
    });

    it("should invalidate unknown activity types", () => {
      expect(isValidActivityType("unknown-type")).toBe(false);
      expect(isValidActivityType("")).toBe(false);
    });
  });

  describe("EVENT_IMPORTANCE_MAPPING", () => {
    it("should have all required event types from GitHub issue #138", () => {
      const requiredEventTypes = [
        "new-job-posting",
        "open-to-work",
        "laid-off",
        "funding-news",
        "company-layoffs",
        "birthday",
        "m-and-a-activity",
        "email-reply-received",
        "holiday",
        "personal-interest-tag",
        "dormant-status",
      ];

      requiredEventTypes.forEach((eventType) => {
        expect(
          EVENT_IMPORTANCE_MAPPING[
            eventType as keyof typeof EVENT_IMPORTANCE_MAPPING
          ]
        ).toBeDefined();
      });
    });

    it("should have importance scores in the correct range (2-10)", () => {
      Object.values(EVENT_IMPORTANCE_MAPPING).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(2);
        expect(score).toBeLessThanOrEqual(10);
      });
    });
  });
});
