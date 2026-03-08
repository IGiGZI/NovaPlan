import { createBrowserRouter, RouterProvider } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import AuthModal from "./components/AuthModal";
import Landing from "./pages/Landing";
import Fetching from "./pages/Fetching";
import Flowmap from "./pages/Flowmap";
import Search from "./pages/Search";

function App() {
	const router = createBrowserRouter([
		{
			path: "/", 
			element: <Landing/>
		},
		{
			path: "/fetch", 
			element: <Fetching/>
		},
		{
			path: "/flowmap", 
			element: <Flowmap/>
		},
		{
			path: "/search",
			element: <Search/>
		}
	]);

	return (
		<AuthProvider>
			<AuthModal />
			<RouterProvider router={router} />
		</AuthProvider>
	);
}

export default App;