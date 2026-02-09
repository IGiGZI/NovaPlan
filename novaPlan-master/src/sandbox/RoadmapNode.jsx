
// custom node
function RoadmapNode({ data }) {
  return (
    <div className="px-4 py-2 rounded-lg bg-white shadow text-gray-900">
      {data.label}
    </div>
  );
}
export default RoadmapNode