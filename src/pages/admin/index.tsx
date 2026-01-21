import { useState, useEffect, useRef } from "react";
import { firestore } from "@/config/firebase";
import { doc, setDoc, collection, getDoc, getDocs, orderBy, query, and, where, deleteDoc } from "firebase/firestore";
import { getStorage, ref, deleteObject, getBlob } from "firebase/storage";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";

import Head from "next/head";
import Sidebar from "@/components/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import Loading from "@/components/Loading";
import Link from "next/link";
import rrwebPlayer from "rrweb-player";

import type { IssueReport } from "@/utils/types";

const storage = getStorage();

const showDate = (timestamp: number) => {
	const time = new Date(timestamp);
	return time.toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Report() {
	const [isLoading, setIsLoading] = useState(false);
	const [isModal, setIsModal] = useState(false);
	const [isModalLoading, setIsModalLoading] = useState(true);

	const [reportData, setReportData] = useState<IssueReport>();
	const [showLogsType, setShowLogsType] = useState('console');
	const [width, setWidth] = useState(window.innerWidth);
	const [bugScreenshot, setBugScreenshot] = useState('');

	const router = useRouter();
	const rrwebPlayerRef = useRef(null);

	const getReportData = async () => {
		try {
			// const id = router.asPath.split('/issues/')[1];
			const id = '843e8f100a3dcaa54ed8';
			const querySnapshot = await getDoc(doc(firestore, 'issue_reports', id));
			if (querySnapshot.exists()) {
				const data = querySnapshot.data() as IssueReport;
				setReportData(data);
				setIsLoading(false);
			}
		} catch (error: any) {
			console.error('Error getting report data: ' + error.message);
		}
	}

	const readBlob = (blob: Blob) => {
		const reader = new FileReader();
		return new Promise((resolve, reject) => {
			reader.onerror = () => {
				reader.abort();
				reject(new Error('Error reading blob'));
			}
			reader.onload = () => {
				resolve(reader.result);
			}
			reader.readAsText(blob);
		});
	}

	const getVideoEvents = async () => {
		try {
			const storageRef = ref(storage, 'uploads/issue_reports/' + reportData?._id);
			const blob = await getBlob(storageRef);
			const jsonEvents = await readBlob(blob);
			const events = JSON.parse(jsonEvents as string);
			return events;
		} catch (error: any) {
			console.error('Error getting video: ' + error.message);
		}
	}

	const handleModalOpen = async (request: {}) => {
		setIsModal(true);
	}

	const handleModalClose = () => {
		setIsModal(false);
	}

	useEffect(() => {
		getReportData();
	}, []);

	useEffect(() => {
		if (reportData?.bug_video) {
			const rrplayer = document.querySelector('.rr-player');
			if (rrplayer) rrplayer.remove();
			const target = rrwebPlayerRef.current;
			getVideoEvents().then(events => {
				if (target) new rrwebPlayer({
					target,
					props: {
						events,
						width: target.clientWidth,
						speedOption: [1, 2, 4],
						mouseTail: false,
						autoPlay: false,
						UNSAFE_replayCanvas: true,
					},
				});
			});
		}
	}, [reportData]);

	return (
		<ProtectedRoute>
			<Head>
				<title>Issue Reports</title>
			</Head>
			{isLoading ? <Loading /> : <div className="px-4 pt-24 pb-8 md:p-16 md:pt-12 gap-4 font-medium">
				<div className="mb-8">
					<Link href={'/'} className="font-bold text-gray-400 hover:text-gray-500 transition-colors"><i className="fas fa-arrow-left"></i> Back to Demo Page</Link>
				</div>
				<div className="flex gap-4">
					<div className="w-2/3">
						{reportData?.bug_screenshot && <div>
							<img src={reportData?.bug_screenshot} alt="Issue Screenshot" />
						</div>}
						{reportData?.bug_video && <div ref={rrwebPlayerRef}></div>}
						<div>
							<h1 className="text-2xl">{reportData?.title}</h1>
						</div>
						<div className="mb-4">
							<span className="text-gray-400">Received at: {showDate(Date.now())}</span>
						</div>
						<div className="mb-4">
							<h2 className="text-gray-400">Description</h2>
							<p>{reportData?.desc}</p>
						</div>
						<div>
							<h2 className="text-gray-400">User Device</h2>
							<div className="rounded-lg border p-4">{window.navigator.userAgent}</div>
						</div>
					</div>
					<div className="w-1/3 bg-white rounded-lg p-4 border">
						<div className="flex gap-2 mb-2">
							<button type="button" className={showLogsType === 'console' ? '' : 'text-gray-400'} onClick={() => setShowLogsType('console')}>Console Logs</button>
							<button type="button" className={showLogsType === 'network' ? '' : 'text-gray-400'} onClick={() => setShowLogsType('network')}>Network Requests</button>
						</div>
						<hr className="mb-4" />
						<div>
							{showLogsType === 'console' && <ul>
								{reportData?.console_logs && JSON.parse(reportData?.console_logs).map((log: { time_stamp: number, value: string }, i: number) => {
									const initialTime = JSON.parse(reportData?.console_logs)[0].time_stamp;
									const duration = (log.time_stamp - initialTime) / 1000;
									return (
										<li key={i} className="flex justify-between">
											<div>{duration}s</div>
											<div>{log.value}</div>
										</li>
									)
								})}
							</ul>}
							{showLogsType === 'network' && <ul className="overflow-x-scroll space-y-2">
								<div className="flex gap-2 text-xs text-gray-400">
									<div>Type</div>
									<div>Name</div>
									<div>Status</div>
								</div>
								{reportData?.network_requests && JSON.parse(reportData?.network_requests).map((request: { initiatorType: string, name: string, responseStatus: string }, i: number) => {
									return (
										<li key={i} className="flex gap-2">
											<div>{request.initiatorType}</div>
											<div className="truncate">{request.name}</div>
											<div>{request.responseStatus}</div>
										</li>
									);
								})}
							</ul>}
						</div>
					</div>
				</div>
			</div>}
			{isModal && <div className="fixed top-0 w-full h-full z-20">
				{/* modal overlay */}
				<div className="fixed inset-0 bg-zinc-300 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full" onClick={() => handleModalClose()}></div>
				{/* modal content */}
				<div className="relative m-4 md:mx-auto p-6 sm:px-12 sm:py-8 border md:w-[960px] max-h-[calc(100%-4rem)] overflow-y-scroll shadow-lg rounded-lg bg-zinc-50">
					{isModalLoading ? <Loading /> : <>
						<button type="button" className="absolute right-4 top-4 opacity-50 hover:opacity-100" onClick={() => handleModalClose()}><i className="fas fa-times"></i></button>
					</>}
				</div>
			</div>}
		</ProtectedRoute>
	);
}