/**
 * JobSeekR Intelligence Framework v2.0
 * Phase 1: Competency Intelligence Graph Engine
 */

import { COMPETENCY_NODES, COMPETENCY_RELATIONSHIPS } from "./taxonomy";
import { CompetencyNode, TransferabilityResult } from "./types";

export class CompetencyGraph {
  private nodes: Record<string, CompetencyNode> = COMPETENCY_NODES;

  /**
   * Find a canonical competency node by ID, alias, or string keyword
   */
  public findCompetency(input: string): CompetencyNode | null {
    if (!input) return null;
    const normalized = input.toLowerCase().trim();

    // Direct ID match
    if (this.nodes[normalized]) return this.nodes[normalized];

    // Alias / Synonym search
    for (const node of Object.values(this.nodes)) {
      if (node.id === normalized || node.name.toLowerCase() === normalized) {
        return node;
      }
      if (node.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
        return node;
      }
    }

    return null;
  }

  /**
   * Calculate transferability & relationship weight between two competencies
   */
  public evaluateTransferability(candidateSkillInput: string, jobRequirementInput: string): TransferabilityResult | null {
    const sourceNode = this.findCompetency(candidateSkillInput);
    const targetNode = this.findCompetency(jobRequirementInput);

    if (!sourceNode || !targetNode) return null;

    // Direct match
    if (sourceNode.id === targetNode.id) {
      return {
        sourceCompetency: sourceNode,
        targetCompetency: targetNode,
        transferWeight: 1.0,
        relationshipType: "DIRECT",
        rationale: `Your verified experience in ${sourceNode.name} directly matches the employer's requirement.`,
      };
    }

    // Direct relationship lookup
    const directRel = COMPETENCY_RELATIONSHIPS.find(
      (r) =>
        (r.sourceId === sourceNode.id && r.targetId === targetNode.id) ||
        (r.sourceId === targetNode.id && r.targetId === sourceNode.id)
    );

    if (directRel) {
      return {
        sourceCompetency: sourceNode,
        targetCompetency: targetNode,
        transferWeight: directRel.weight,
        relationshipType: directRel.relationship,
        rationale: `Your experience in ${sourceNode.name} transfers to ${targetNode.name}: ${directRel.rationale}`,
      };
    }

    // Multi-hop graph traversal (e.g. DMAIC -> Lean Six Sigma -> Continuous Improvement -> Operational Excellence)
    const transitiveResult = this.findTransitivePath(sourceNode.id, targetNode.id);
    if (transitiveResult) {
      return {
        sourceCompetency: sourceNode,
        targetCompetency: targetNode,
        transferWeight: transitiveResult.cumulativeWeight,
        relationshipType: "ENABLES",
        rationale: `Your mastery of ${sourceNode.name} provides transferable foundations for ${targetNode.name} (${transitiveResult.pathNames.join(" → ")}).`,
      };
    }

    // Cross-category base transferability fallback if categories match
    if (sourceNode.category === targetNode.category) {
      return {
        sourceCompetency: sourceNode,
        targetCompetency: targetNode,
        transferWeight: 0.60,
        relationshipType: "ENABLES",
        rationale: `Both ${sourceNode.name} and ${targetNode.name} belong to the ${sourceNode.category.replace(/_/g, " ")} domain.`,
      };
    }

    return null;
  }

  /**
   * Breadth-first search for multi-hop graph path between two nodes
   */
  private findTransitivePath(startId: string, endId: string): { cumulativeWeight: number; pathNames: string[] } | null {
    const visited = new Set<string>();
    const queue: { currentId: string; weight: number; path: string[] }[] = [
      { currentId: startId, weight: 1.0, path: [this.nodes[startId]?.name || startId] },
    ];

    while (queue.length > 0) {
      const { currentId, weight, path } = queue.shift()!;
      if (currentId === endId) {
        return { cumulativeWeight: Math.max(0.40, Number(weight.toFixed(2))), pathNames: path };
      }

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const neighbors = COMPETENCY_RELATIONSHIPS.filter((r) => r.sourceId === currentId);
      for (const edge of neighbors) {
        if (!visited.has(edge.targetId) && this.nodes[edge.targetId]) {
          queue.push({
            currentId: edge.targetId,
            weight: weight * edge.weight,
            path: [...path, this.nodes[edge.targetId].name],
          });
        }
      }
    }

    return null;
  }
}

export const competencyGraph = new CompetencyGraph();
