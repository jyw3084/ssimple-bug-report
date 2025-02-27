import { useState, useEffect } from "react";
import { firestore } from "@/config/firebase";
import { doc, setDoc, collection, getDoc, getDocs, orderBy, query, and, where, deleteDoc } from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { useAuth } from "@/context/AuthContext";

import Link from "next/link";
import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";

import type { IssueReport } from "@/utils/types";

export default function Issues() {
	// @ts-ignore
	const { user } = useAuth();

	const [isLoading, setIsLoading] = useState(true);

	const [reports, setReports] = useState<IssueReport[]>([]);

	const getReports = async () => {
		try {
			const querySnapshot = await getDocs(query(collection(firestore, "issue_reports"), where('account_id', '==', user.uid), orderBy('created_at', 'desc')));
			const foundData = querySnapshot.docs.map(doc => ({ ...doc.data() }));
			setReports(foundData);
			setIsLoading(false);
		} catch (error: any) {
			console.error('Error getting issue reports: ' + error.message);
		}
	}

	useEffect(() => {
		getReports();
	}, []);

	return (
		<ProtectedRoute>
			<Head>
				<title>Issue Reports</title>
			</Head>
			<Sidebar />
			<div className="md:ml-60 px-4 pt-24 pb-8 md:p-16 md:pt-24 space-y-4 font-medium">
				<div className="overflow-x-scroll border rounded-lg">
					<table className="w-full table-fixed">
						<thead className="text-xs text-gray-400 bg-zinc-100">
							<tr>
								<th className="w-32 p-4 text-left">Time Received</th>
								<th className="w-96 p-4 text-left">Title (click to view details)</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y">
							{isLoading ? (
								<tr>
									<td><div className="m-4 h-4 bg-zinc-200 animate-pulse rounded"></div></td>
									<td><div className="m-4 h-4 bg-zinc-200 animate-pulse rounded"></div></td>
								</tr>
							) : (
								<>
									{reports.map(report => {
										const time = new Date(report.created_at);
										return (
											<tr key={report._id}>
												<td>
													<div className="p-4">{time.toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
												</td>
												<td>
													<Link href={'/admin/issues/' + report._id} className="p-4 my-2 w-full text-left text-gray-400 hover:text-gray-500 transition-colors">{report.title}</Link>
												</td>
											</tr>
										);
									})}
								</>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</ProtectedRoute>
	);
}