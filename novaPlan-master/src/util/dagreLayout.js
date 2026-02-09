import dagre from "@dagrejs/dagre"

const nodeWidth = 200;
const nodeHeight = 60;


// ================

// helper for one block layout


// function layoutSingleBlock(parent, children) {
//   const g = new dagre.graphlib.Graph();

//   g.setDefaultEdgeLabel(() => ({}));
//   g.setGraph({
//     rankdir: "TB",
//     ranksep: 60,
//     nodesep: 40,
//   });

//   // Parent node
//   g.setNode(parent.id, {
//     width: nodeWidth,
//     height: nodeHeight,
//   });

//   // Children
//   children.forEach((child) => {
//     g.setNode(child.id, {
//       width: nodeWidth,
//       height: nodeHeight,
//     });

//     g.setEdge(parent.id, child.id);
//   });

//   dagre.layout(g);

//   return g;
// }


// main layout
// export function getLayoutedElements(steps) {
//   const nodes = [];
//   const edges = [];

//   let yOffset = 0;
//   const blockSpacing = 120;

//   steps.forEach((step) => {
//     const children = step.children ?? [];

//     const graph = layoutSingleBlock(step, children);

//     // Collect nodes
//     graph.nodes().forEach((id) => {
//       const { x, y } = graph.node(id);

//       nodes.push({
//         id,
//         data: {
//           label:
//             id === step.id
//               ? step.title
//               : children.find((c) => c.id === id)?.title,
//         },
//         position: {
//           x: x - nodeWidth / 2,
//           y: y - nodeHeight / 2 + yOffset,
//         },
//       });
//     });

//     // Collect edges
//     children.forEach((child) => {
//       edges.push({
//         id: `${step.id}-${child.id}`,
//         source: step.id,
//         target: child.id,
//         type: "smoothstep",
//       });
//     });

//     // Measure block height
//     const blockHeight =
//       Math.max(
//         ...graph.nodes().map((id) => graph.node(id).y)
//       ) + nodeHeight;

//     yOffset += blockHeight + blockSpacing;
//   });

//   return { nodes, edges };
// }


// ===================



// the default way
export function getLayoutedElements(nodes, edges) {
  // creates a graph
  const dagreGraph = new dagre.graphlib.Graph();

  // if i dont give you metada for an edge use an empty object
  dagreGraph.setDefaultEdgeLabel(() => ({}));



  dagreGraph.setGraph({
    rankdir: "TB", // TB = top → bottom, LR = left → right
    ranksep: 100,
    nodesep: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // assigns every node a center point based on constraints
  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const { x, y } = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

