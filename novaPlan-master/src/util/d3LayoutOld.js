import { hierarchy, tree } from "d3";

export function getD3Layout(data) {
  // in case of no root node in JSON
  // const root = hierarchy({
  //   title: data.path_title,
  //   children: data.steps,
  // });

  //in case of a root node in JSON
  const root = hierarchy(data);

  const layout = tree().nodeSize([200, 120]);
  layout(root);

  const nodes = [];
  const edges = [];

  root.descendants().forEach((node) => {
    nodes.push({
      id: node.data.id,
      position: { x: node.x, y: node.y },
      data: { label: node.data.title },
      type: "default",
    });

    if (node.parent) {
      edges.push({
        id: `${node.parent.data.id}-${node.data.id}`,
        source: node.parent.data.id,
        target: node.data.id,
        type: "smoothstep",
      });
    }
  });

  return { nodes, edges };
}






