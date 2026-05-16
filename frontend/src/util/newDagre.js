// Convert hierarchical roadmap JSON to flat nodes and edges (roadmap.sh style)
export const convertRoadmapToFlow = (steps) => {
  const nodes = [];
  const edges = [];
  let nodeId = 0;

  // Configuration
  const VERTICAL_SPACING = 150;  // Space between main steps
  const HORIZONTAL_SPACING = 300; // Space for child branches
  const NODE_WIDTH = 250;
  const NODE_HEIGHT = 80;
  const CENTER_X = 400; // Center column X position

  const processStep = (step, parentId = null, parentX = CENTER_X, parentY = 0, isMainPath = true) => {
    const currentNodeId = `node-${nodeId++}`;

    // Position logic
    let x, y;
    if (isMainPath) {
      // Main path nodes go straight down the center
      x = CENTER_X;
      y = parentY;
    } else {
      // Child nodes are positioned around their parent
      x = parentX;
      y = parentY;
    }

    // Create node
    // Derive label from first milestone title if available
    const label = step.milestones?.[0]?.title || step.title || 'Step';

    nodes.push({
      id: currentNodeId,
      type: 'customRoadmap',
      data: {
        label: label,
        milestones: step.milestones,
        resources: step.resources,
      },
      position: { x, y },
    });

    // Create edge from parent to current node
    if (parentId !== null) {
      edges.push({
        id: `edge-${parentId}-${currentNodeId}`,
        source: parentId,
        target: currentNodeId,
        type: 'smoothstep',
      });
    }

    // Process children - spread them horizontally around the parent
    if (step.children && step.children.length > 0) {
      const numChildren = step.children.length;
      const childY = y + VERTICAL_SPACING; // Children go below parent

      step.children.forEach((child, index) => {
        // Spread children horizontally around center
        let childX;
        if (numChildren === 1) {
          childX = CENTER_X; // Single child stays centered
        } else {
          // Multiple children spread left and right
          const totalWidth = (numChildren - 1) * HORIZONTAL_SPACING;
          const startX = CENTER_X - (totalWidth / 2);
          childX = startX + (index * HORIZONTAL_SPACING);
        }

        processStep(child, currentNodeId, childX, childY, false);
      });
    }

    return currentNodeId;
  };

  // Process all top-level steps in a straight vertical line
  let currentY = 0;
  let previousMainNodeId = null;

  steps.forEach((step) => {
    const mainNodeId = processStep(step, previousMainNodeId, CENTER_X, currentY, true);
    previousMainNodeId = mainNodeId;

    // Calculate next Y position based on whether this step has children
    const hasChildren = step.children && step.children.length > 0;
    if (hasChildren) {
      // If step has children, add extra space for them
      currentY += VERTICAL_SPACING * 2;
    } else {
      currentY += VERTICAL_SPACING;
    }
  });

  return { nodes, edges };
};

// Simplified layout function - no Dagre needed for this approach
export const getLayoutedElements = (steps) => {
  return convertRoadmapToFlow(steps);
};







