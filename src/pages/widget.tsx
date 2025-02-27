import React, { useState, useEffect, useRef } from "react";
import { uid } from "uid";
import { firestore } from "@/config/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, uploadBytesResumable, deleteObject, uploadString, uploadBytes } from "firebase/storage";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginImageExifOrientation from "filepond-plugin-image-exif-orientation";
// @ts-ignore
import FilePondPluginMediaPreview from 'filepond-plugin-media-preview';
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFileValidateSize from "filepond-plugin-file-validate-size";
import rrwebPlayer from 'rrweb-player';

import "filepond/dist/filepond.min.css";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
import 'filepond-plugin-media-preview/dist/filepond-plugin-media-preview.min.css';

import type { AccountSettings, File, IssueReport } from "@/utils/types";
import type { ProcessServerConfigFunction, RevertServerConfigFunction } from "filepond";

import Loading from "@/components/Loading";

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginMediaPreview, FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

const storage = getStorage();

export default function Widget() {
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitActive, setIsSubmitActive] = useState(true);
	const [isThankYou, setIsThankYou] = useState(false);
	const [isBug, setIsBug] = useState(false);

	const [accountId, setAccountId] = useState('');
	const [userEmail, setUserEmail] = useState('');
	const [adminEmail, setAdminEmail] = useState('');
	const [brandUrl, setBrandUrl] = useState('');
	const [submitDesc, setSubmitDesc] = useState('');
	const [files, setFiles] = useState<File[]>([]);
	const [bugVisualType, setBugVisualType] = useState('');
	const [bugScreenshot, setBugScreenshot] = useState('');
	const [bugVideo, setBugVideo] = useState('');
	const [consoleLogs, setConsoleLogs] = useState('');
	const [networkRequests, setNetworkRequests] = useState('');

	const rrwebPlayerRef = useRef(null);
	const server: { process: ProcessServerConfigFunction, revert: RevertServerConfigFunction } = {
		process: (fieldName, file, metadata, load, error, progress, abort) => {
			const id = uid(20);
			const storageRef = ref(storage, 'uploads/support_files/' + id);
			const uploadTask = uploadBytesResumable(storageRef, file);
			const fileType = file.type.split('/')[0];

			uploadTask.on('state_changed',
				snapshot => {
					progress(true, snapshot.bytesTransferred, snapshot.totalBytes);
				},
				err => {
					error(err.message);
				},
				() => {
					load(id);
					getDownloadURL(storageRef).then(url => {
						const newUploadObj = {
							_id: id,
							account_id: accountId,
							type: fileType,
							parent_type: 'issue_report',
							parent_id: '',
							status: 'pending',
							download_url: url,
							created_at: Date.now()
						}
						setDoc(doc(firestore, 'uploads', id), newUploadObj).then(() => {
							const newFiles = files;
							newFiles.push(newUploadObj);
							setFiles(newFiles);
							setIsSubmitActive(true);
						}).catch(err => error(err));
					});
				}
			);

			return {
				abort: () => {
					uploadTask.cancel();
					deleteDoc(doc(firestore, 'uploads', id)).then(() => {
						const newFiles = files;
						newFiles.pop();
						setFiles(newFiles);
						abort();
					}).catch(err => error(err));
				}
			}
		},
		revert: (uniqueFileId, load, error) => {
			const currentFiles = files;
			const newFiles = currentFiles.filter(({ _id }) => _id !== uniqueFileId);
			setFiles(newFiles);
			const storageRef = ref(storage, 'uploads/support_files/' + uniqueFileId);
			deleteObject(storageRef).then(() => {
				deleteDoc(doc(firestore, 'uploads', uniqueFileId)).then(() => {
					load();
				}).catch(err => error(err));
			}).catch(err => {
				error(err.message);
			});
		}
	}

	const sendEmail = async (type: string, email: string, topicId: string) => {
		if (type === 'notifyUser') {
			const response = await fetch('api/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					subject: "Thank you for sharing your feedback",
					html: "<p>Link to your feedback post: <a href='https://report.ssimple.co/?topic=" + topicId + "' target='_blank'>https://report.ssimple.co/?topic=" + topicId + "</a></p>"
				})
			});
			return response.json();
		} else if (type === 'notifyAdmin') {
			const response = await fetch('api/send-email', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email,
					subject: "New Issue Report Received",
					html: "<p>You received an issue report. Please view it in your <a href='https://report.ssimple.co/admin/issues' target='_blank'>admin dashboard</a>.</p>"
				})
			});
			return response.json();
		}
	}

	const getData = async (appId: string) => {
		try {
			const querySnapshot = await getDoc(doc(firestore, 'accounts', appId));
			if (querySnapshot.exists()) {
				const data = querySnapshot.data() as AccountSettings;
				setAdminEmail(data.admin_email);
				setAccountId(data.account_id);
				setBrandUrl(data.brand_url);
				setIsLoading(false);
			}
		} catch (error: any) {
			console.error('Error getting account data: ' + error.message);
		}
	}

	const handleChange = (field: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (field === 'email') setUserEmail(e.target.value);
		if (field === 'desc') setSubmitDesc(e.target.value);
	}

	const handleAddFileStart = () => {
		setIsSubmitActive(false);
	}

	const onRecordVideoClick = () => {
		window.parent.postMessage('startRecord', '*');
	}

	const onCaptureScreenshotClick = () => {
		window.parent.postMessage('captureScreenshot', '*');
	}

	const handleSubmit = async (e: React.SyntheticEvent) => {
		e.preventDefault();

		const reportId = uid(20);
		let downloadUrl = '';
		if (bugVisualType === 'screenshot') {
			try {
				const storageRef = ref(storage, 'uploads/issue_reports/' + reportId);
				await uploadString(storageRef, bugScreenshot, 'data_url', { contentType: 'image/png' });
				downloadUrl = await getDownloadURL(storageRef);
			} catch (err: any) {
				throw new Error('Error uploading screenshot: ' + err.message);
			}
		} else if (bugVisualType === 'recording') {
			try {
				const storageRef = ref(storage, 'uploads/issue_reports/' + reportId);
				const blob = new Blob([bugVideo], { type: 'application/json' });
				await uploadBytes(storageRef, blob);
				downloadUrl = await getDownloadURL(storageRef);
			} catch (err: any) {
				throw new Error('Error uploading recording: ' + err.message);
			}
		}

		try {
			const publishedFiles = await Promise.all(files.map(async file => {
				file.status = 'published';
				file.parent_id = reportId;
				await setDoc(doc(firestore, 'uploads', file._id), file);
				return file;
			}));

			const newData = {
				_id: reportId,
				account_id: accountId,
				email: userEmail,
				title: 'Issue Report – ' + reportId,
				desc: submitDesc,
				console_logs: consoleLogs,
				network_requests: networkRequests,
				device_info: window.navigator.userAgent,
				bug_screenshot: bugVisualType === 'screenshot' ? downloadUrl : '',
				bug_video: bugVisualType === 'recording' ? downloadUrl : '',
				support_files: publishedFiles,
				created_at: Date.now(),
			} as IssueReport;

			await setDoc(doc(firestore, 'issue_reports', reportId), newData);
			sendEmail('notifyAdmin', adminEmail, reportId);
			setFiles([]);
			setSubmitDesc('');
			setBugScreenshot('');
			setIsThankYou(true);
		} catch (error: any) {
			throw new Error('Error reporting: ' + error.message);
		}
	}

	useEffect(() => {
		window.addEventListener('message', async (e) => {
			if (e.data.type === 'init') {
				const appId = e.data.payload.appId;
				getData(appId);
			} else if (e.data.type === 'cancelReport') {
				setSubmitDesc('');
				setUserEmail('');
				setBugScreenshot('');
				setBugVideo('');
				setConsoleLogs('');
				setNetworkRequests('');
				rrwebPlayerRef.current = null;
				setIsBug(false);
				setIsThankYou(false);
			} else if (e.data.type === 'screenshot') {
				setConsoleLogs(e.data.payload.consoleLogs);
				setNetworkRequests(e.data.payload.networkRequests);
				setBugScreenshot(e.data.payload.screenshot);
				setBugVisualType('screenshot')
				setIsBug(true);
			} else if (e.data.type === 'stopRecord') {
				setConsoleLogs(e.data.payload.consoleLogs);
				setNetworkRequests(e.data.payload.networkRequests);
				setBugVideo(e.data.payload.events);
				setBugVisualType('recording');
				setIsBug(true);
			}
		});
	}, []);

	useEffect(() => {
		if (rrwebPlayerRef.current && bugVideo) {
			new rrwebPlayer({
				target: rrwebPlayerRef.current,
				props: {
					events: JSON.parse(bugVideo),
					width: 736,
					speedOption: [1, 2, 4],
					mouseTail: false,
				},
			});
		}
	}, [bugVideo]);

	return (
		isLoading ? <Loading /> :
			<div className="space-y-10">
				<div className="p-8 rounded-lg pb-14 min-h-screen font-medium">
					{!isThankYou && <div className="space-y-2">
						<div>
							<h1 className="font-bold text-xl">Report an Issue</h1>
						</div>
						<div>
							<p>Include some visuals to help us better understand the issue:</p>
						</div>
						{!isBug && <div className="space-y-2">
							<div>
								<button
									type="button"
									className="w-full text-left px-4 py-4 flex justify-between border rounded-lg bg-white hover:bg-zinc-100 transition-colors"
									onClick={() => onCaptureScreenshotClick()}
								>
									<span className="text-gray-600"><i className="fas fa-desktop"></i> Capture Current Screenshot</span>
								</button>
							</div>
							<div>
								<button
									type="button"
									className="w-full text-left px-4 py-4 flex justify-between border rounded-lg bg-white hover:bg-zinc-100 transition-colors"
									onClick={() => onRecordVideoClick()}
								>
									<span className="text-gray-600"><i className="fas fa-video"></i> Record Current Screen</span>
								</button>
							</div>
						</div>}
						{isBug && <div>
							<div className="mb-4">
								{bugScreenshot && <div className="w-full">
									<img className="border rounded-lg" src={bugScreenshot} />
								</div>}
								{/* rrweb player */}
								{bugVideo && <div>
									<div className="w-full h-[656px] mb-4" ref={rrwebPlayerRef}></div>
								</div>}
							</div>
							<form className="space-y-4" onSubmit={e => handleSubmit(e)}>
								<div className="space-y-2">
									<div className="space-y-6 mb-6">
										<div className="space-y-2">
											<div>
												<textarea
													className="font-normal border rounded-lg w-full p-2"
													rows={5}
													placeholder="What was the issue? What were you trying to do? Please give as much detail as you can."
													value={submitDesc}
													onChange={e => handleChange('desc', e)}
													onKeyDown={e => { e.key === 'Enter' && e.preventDefault() }}
													maxLength={10000}
													required
												/>
											</div>
										</div>
										<div>
											<p>Have other images or videos related to this issue?</p>
											<small className="text-xs font-medium text-gray-400">Supported file types: PNG, JPEG, JPG, WEBP, GIF, MP4, WEBM. Max 5 files (10MB each)</small>
											<FilePond
												acceptedFileTypes={[
													'image/png',
													'image/gif',
													'image/jpeg',
													'image/jpg',
													'image/webp',
													'video/mp4',
													'video/webm',
												]}
												labelFileTypeNotAllowed="Format not allowed"
												maxFileSize="10MB"
												allowMultiple={true}
												maxFiles={5}
												server={server}
												onaddfilestart={() => handleAddFileStart()}
												onprocessfilerevert={() => setIsSubmitActive(false)}
												onremovefile={() => setIsSubmitActive(true)}
												labelIdle='Drop your file(s) here or <span class="filepond--label-action">Browse</span>'
												credits={false}
											/>
										</div>
									</div>
								</div>
								<div>
									<input
										type="email"
										name="email"
										className="font-normal border rounded-lg w-full p-2"
										placeholder="Your email"
										onChange={e => handleChange('email', e)}
										onKeyDown={e => { e.key === 'Enter' && e.preventDefault() }}
										maxLength={320}
										required
									/>
								</div>
								<div className="space-x-2">
									<input type="checkbox" id="agreeCollectInfo" required />
									<label htmlFor="agreeCollectInfo" className="font-medium text-gray-400 text-sm">We collect your device info, console logs, and network requests on this site to help us better understand and fix this issue</label>
								</div>
								<div>
									<button
										type="submit"
										className="w-full md:w-auto px-4 py-2 bg-zinc-600 hover:bg-zinc-700 text-white font-bold rounded-lg transition-colors"
										style={isSubmitActive ? { opacity: 1 } : { opacity: 0.3 }}
										disabled={isSubmitActive ? false : true}
									>Report Issue</button>
								</div>
							</form>
						</div>}
					</div>}
					{isThankYou && <div className="pt-[180px] flex flex-col justify-center text-center space-y-4">
						<div>
							<h1 className="font-bold text-xl">Thanks for letting us know</h1>
						</div>
						<div>
							We will investigate this issue and get back to you as soon as possible.
						</div>
					</div>}
				</div>
				<div className="fixed bottom-0 text-center bg-zinc-100 w-full py-1 rounded-b-lg">
					<span className="text-sm font-bold text-gray-500 hover:text-gray-500 transition-colors"><a href="https://ssimple.co" target="_blank">Powered by  ssimple</a></span>
				</div>
			</div>
	);
}