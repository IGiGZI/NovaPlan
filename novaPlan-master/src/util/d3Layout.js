import { hierarchy, tree } from "d3";

export function getD3Layout(data) {
  // chaining the sibling steps together cus d3 sees siblings of same level as equals (solving node connection)
  function chainStepsPreserveChildren(steps) {
  return steps.map((step, index) => {
    if (index < steps.length - 1) {
      return {
        ...step,
        children: [steps[index + 1]],
      };
    }
    return step; // last step keeps its original children
  })[0];
}





  //this is in case the JSON structure doesnt have a "root" node
  const root = hierarchy({
  id: "__root__", // special id
  title: "hidden",
  children: [chainStepsPreserveChildren(data.steps)],
});



  // alternative if JSON has a root node
  // const root = hierarchy(data)

  const layout = tree().nodeSize([200, 120]);
  layout(root);

  const nodes = [];
  const edges = [];

  root.descendants().forEach((node) => {
  if (node.data.id === "__root__") return; // ⛔ skip root

  nodes.push({
    id: node.data.id,
    position: { x: node.x, y: node.y },
    data: { label: node.data.title },
    type: "default",
  });

  if (node.parent && node.parent.data.id !== "__root__") {
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






