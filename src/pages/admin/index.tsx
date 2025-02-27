import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
	// @ts-ignore
	const { user } = useAuth();
	const router = useRouter();

	useEffect(() => {
		router.push('/admin/issues');
	}, []);

	return (
		<ProtectedRoute>
			<></>
		</ProtectedRoute>
	);
}