import { useState, useEffect, memo } from 'react';
import { ReactFlow, Handle, Position } from '@xyflow/react';
import { getLayoutedElements } from '../util/newDagre';
import MainNav from '../components/MainNav';
import '@xyflow/react/dist/style.css';

// custom node type
const CustomRoadmapNode = memo(({ data }) => {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
      />
      
      <div className="px-4 py-3 shadow-lg rounded-lg bg-[#111111] border-2 border-purple-400/50 w-[200px]">
        <div className="text-white">
          <div className="font-bold text-sm mb-1 wrap-break-word">{data.label}</div>
          {data.duration && (
            <div className="text-xs text-purple-100 opacity-80">
              {data.duration} months
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
      />
    </div>
  );
});

CustomRoadmapNode.displayName = 'CustomRoadmapNode';

// Define custom node types
const nodeTypes = {
  customRoadmap: CustomRoadmapNode,
};

function Flowmap() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    // Get roadmap from localStorage
    const storedRoadmap = localStorage.getItem("roadmapResult");
    if (storedRoadmap) {
      const data = JSON.parse(storedRoadmap);
      setRoadmapData(data);
      
      // Apply layout to the roadmap steps
      if (data.roadmaps && data.roadmaps.length > 0) {
        const layouted = getLayoutedElements(data.roadmaps[0].steps);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);
      }
    }
  }, []);

  // Handle node click
  const onNodeClick = (event, node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
  };

  // Close popup
  const closePopup = () => {
    setSelectedNode(null);
  };

  // Show loading or no data message
  if (!roadmapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MainNav/>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">
            No Roadmap Found
          </h2>
          <p className="text-gray-400 mb-6">
            Please generate a roadmap first to view it here.
          </p>
          <a
            href="/"
            className="specialBtnGradient rounded-full px-8 py-3 text-white font-semibold shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform inline-block"
          >
            Generate Roadmap
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <MainNav/>

      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="pt-28 pb-6 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-linear-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          {roadmapData.roadmaps[0]?.path_title || "Career Roadmap"}
        </h1>
        <p className="text-gray-400">Interactive career path visualization</p>
        <p className="text-purple-400 mt-2">Career: {roadmapData.chosen_career}</p>
      </div>

      {/* ReactFlow Container */}
      <div className="px-6 pb-6">
        <div
          style={{ height: "calc(100vh - 250px)" }}
          className="mx-auto bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/30 overflow-hidden"
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
          </ReactFlow>
        </div>
      </div>

      {/* Popup/Modal when node is clicked */}
      {selectedNode && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={closePopup}
        >
          <div 
            className="bg-linear-to-br from-purple-900/90 to-black/90 backdrop-blur-md border border-purple-500/50 rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl shadow-purple-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {selectedNode.data.label}
              </h2>
              <button 
                onClick={closePopup}
                className="text-gray-400 hover:text-purple-400 text-3xl transition-colors leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg text-purple-400 mb-2">Objective</h3>
                <p className="text-gray-300">{selectedNode.data.objective}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg text-purple-400 mb-2">Duration</h3>
                <p className="text-gray-300">{selectedNode.data.duration} months</p>
              </div>
              
              {selectedNode.data.prerequisites?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg text-purple-400 mb-2">Prerequisites</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {selectedNode.data.prerequisites.map((prereq, i) => (
                      <li key={i}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedNode.data.milestones?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg text-purple-400 mb-2">Milestones</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {selectedNode.data.milestones.map((milestone, i) => (
                      <li key={i}>{milestone}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedNode.data.tasks?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg text-purple-400 mb-2">Tasks</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {selectedNode.data.tasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedNode.data.resources?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg text-purple-400 mb-2">Resources</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    {selectedNode.data.resources.map((resource, i) => (
                      <li key={i}>{resource}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flowmap;