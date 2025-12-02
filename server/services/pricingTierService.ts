/**
 * Pricing Tier Calculation Service
 * 
 * Handles volume-based pricing tier calculations for resources.
 * Supports tiered pricing where rates change based on quantity consumed.
 * 
 * Example:
 * - First 10 hours: $50/hr
 * - Next 40 hours: $45/hr
 * - After 50 hours: $40/hr
 */

export interface PricingTier {
  fromQuantity: number;      // Start of tier (e.g., 0)
  toQuantity: number | null;  // End of tier (null = unlimited, e.g., 10)
  rate: number;               // Rate for this tier (e.g., 50)
  unitType: string;           // "hr", "ea", "m", etc.
  currency: string;
}

export interface PricingTierResult {
  totalCost: number;
  breakdown: Array<{
    tier: PricingTier;
    quantityInTier: number;
    costInTier: number;
  }>;
  currency: string;
}

/**
 * Calculate cost based on pricing tiers
 * 
 * @param quantity - Total quantity to calculate cost for
 * @param tiers - Array of pricing tiers (must be sorted by fromQuantity)
 * @param defaultRate - Fallback rate if no tiers are defined
 * @param currency - Currency code
 * @returns PricingTierResult with total cost and breakdown
 */
export function calculateTieredCost(
  quantity: number,
  tiers: PricingTier[] | null | undefined,
  defaultRate: number,
  currency: string = "USD"
): PricingTierResult {
  // If no tiers or empty tiers, use flat rate
  if (!tiers || tiers.length === 0) {
    return {
      totalCost: quantity * defaultRate,
      breakdown: [{
        tier: {
          fromQuantity: 0,
          toQuantity: null,
          rate: defaultRate,
          unitType: "hr",
          currency,
        },
        quantityInTier: quantity,
        costInTier: quantity * defaultRate,
      }],
      currency,
    };
  }

  // Sort tiers by fromQuantity to ensure correct order
  const sortedTiers = [...tiers].sort((a, b) => a.fromQuantity - b.fromQuantity);

  const breakdown: PricingTierResult["breakdown"] = [];
  let remainingQuantity = quantity;
  let totalCost = 0;

  for (let i = 0; i < sortedTiers.length && remainingQuantity > 0; i++) {
    const tier = sortedTiers[i];
    const tierStart = tier.fromQuantity;
    const tierEnd = tier.toQuantity ?? Infinity;

    // Calculate how much of remaining quantity falls in this tier
    const quantityInTier = Math.min(
      remainingQuantity,
      Math.max(0, Math.min(tierEnd, quantity) - Math.max(tierStart, quantity - remainingQuantity))
    );

    // If quantity falls within this tier range
    if (quantity > tierStart && quantityInTier > 0) {
      const actualQuantityInTier = Math.min(
        quantityInTier,
        tierEnd === null ? remainingQuantity : tierEnd - Math.max(tierStart, quantity - remainingQuantity)
      );

      const costInTier = actualQuantityInTier * tier.rate;
      totalCost += costInTier;

      breakdown.push({
        tier,
        quantityInTier: actualQuantityInTier,
        costInTier,
      });

      remainingQuantity -= actualQuantityInTier;
    }
  }

  // If there's still remaining quantity and no more tiers, use the last tier's rate
  if (remainingQuantity > 0 && sortedTiers.length > 0) {
    const lastTier = sortedTiers[sortedTiers.length - 1];
    const costInTier = remainingQuantity * lastTier.rate;
    totalCost += costInTier;

    breakdown.push({
      tier: lastTier,
      quantityInTier: remainingQuantity,
      costInTier,
    });
  }

  return {
    totalCost,
    breakdown,
    currency: tiers[0]?.currency || currency,
  };
}

/**
 * Get the effective rate for a given quantity (weighted average)
 * 
 * @param quantity - Total quantity
 * @param tiers - Array of pricing tiers
 * @param defaultRate - Fallback rate if no tiers
 * @returns Effective rate per unit
 */
export function getEffectiveRate(
  quantity: number,
  tiers: PricingTier[] | null | undefined,
  defaultRate: number
): number {
  if (!tiers || tiers.length === 0) {
    return defaultRate;
  }

  const result = calculateTieredCost(quantity, tiers, defaultRate);
  return quantity > 0 ? result.totalCost / quantity : defaultRate;
}

/**
 * Validate pricing tiers structure
 * 
 * @param tiers - Array of pricing tiers to validate
 * @returns Validation result with errors if any
 */
export function validatePricingTiers(tiers: PricingTier[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(tiers)) {
    return { valid: false, errors: ["Tiers must be an array"] };
  }

  if (tiers.length === 0) {
    return { valid: true, errors: [] };
  }

  // Check for gaps or overlaps
  const sortedTiers = [...tiers].sort((a, b) => a.fromQuantity - b.fromQuantity);

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];

    if (tier.fromQuantity < 0) {
      errors.push(`Tier ${i + 1}: fromQuantity cannot be negative`);
    }

    if (tier.toQuantity !== null && tier.toQuantity <= tier.fromQuantity) {
      errors.push(`Tier ${i + 1}: toQuantity must be greater than fromQuantity`);
    }

    if (tier.rate < 0) {
      errors.push(`Tier ${i + 1}: rate cannot be negative`);
    }

    // Check for gaps (except for the last tier)
    if (i < sortedTiers.length - 1) {
      const nextTier = sortedTiers[i + 1];
      if (tier.toQuantity === null) {
        errors.push(`Tier ${i + 1}: Only the last tier can have unlimited toQuantity`);
      } else if (tier.toQuantity !== nextTier.fromQuantity) {
        errors.push(`Tier ${i + 1}: Gap between tiers (ends at ${tier.toQuantity}, next starts at ${nextTier.fromQuantity})`);
      }
    }
  }

  // Ensure first tier starts at 0
  if (sortedTiers.length > 0 && sortedTiers[0].fromQuantity !== 0) {
    errors.push("First tier must start at 0");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

