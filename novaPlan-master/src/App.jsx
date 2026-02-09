
import { createBrowserRouter, RouterProvider } from "react-router"
import Landing from "./components/Landing";
import Fetching from "./sandbox/Fetching";
import FlowT1 from "./sandbox/FlowT1";
import FlowT2 from "./sandbox/FlowT2";



function App() {

	const router = createBrowserRouter([
		{
			path: "/", element: <Landing/>
		},
		{
			path: "/fetch", element: <Fetching/>
		},
		{
			path: "/flowt1", element: <FlowT1/>
		},
		{
			path: "/flowt2", element: <FlowT2/>
		}
	])

	return (
	
		<RouterProvider router={router}/>
	);
}

export default App;
