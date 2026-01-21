import { useState } from 'react';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import Script from 'next/script';

// Register ChartJS components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
	ArcElement
);

export default function Dashboard() {
	const [timeRange, setTimeRange] = useState('week');

	// Sample data for line chart
	const lineChartData = {
		labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
		datasets: [
			{
				label: 'Active Users',
				data: [650, 590, 800, 810, 760, 550, 400],
				borderColor: 'rgb(75, 192, 192)',
				tension: 0.1,
			},
			{
				label: 'New Signups',
				data: [120, 150, 180, 90, 160, 140, 100],
				borderColor: 'rgb(153, 102, 255)',
				tension: 0.1,
			},
		],
	};

	// Sample data for bar chart
	const barChartData = {
		labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
		datasets: [
			{
				label: 'Revenue',
				data: [12000, 19000, 15000, 25000, 22000, 30000],
				backgroundColor: 'rgba(53, 162, 235, 0.5)',
			},
		],
	};

	// Sample data for doughnut chart
	const doughnutChartData = {
		labels: ['Mobile', 'Desktop', 'Tablet'],
		datasets: [
			{
				data: [45, 40, 15],
				backgroundColor: [
					'rgba(255, 99, 132, 0.5)',
					'rgba(54, 162, 235, 0.5)',
					'rgba(255, 206, 86, 0.5)',
				],
			},
		],
	};

	// Sample table data
	const recentActivities = [
		{ user: 'John Doe', action: 'Created new project', time: '2 minutes ago' },
		{ user: 'Jane Smith', action: 'Updated dashboard', time: '5 minutes ago' },
		{ user: 'Mike Johnson', action: 'Added new task', time: '10 minutes ago' },
		{ user: 'Sarah Wilson', action: 'Completed project', time: '15 minutes ago' },
	];

	return (
		<>
			<Script>{`
			(function(window, document) {
				window.ssimple = {};
				var elt = document.createElement('script');
				elt.type = "text/javascript";
				elt.async = true;
				elt.src = "/ssimpleSdk.js";
				var before = document.getElementsByTagName('script')[0];
				before.parentNode.insertBefore(elt, before);
				elt.onload = function() {
					ssimple.init({
						appId: 'dDVtPHqj7Uo3xi2KvKHp',
					});
				}
			})(window, document, undefined);
		`}</Script>
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<header className="bg-white shadow-sm">
					<div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center">
							<div className="flex items-center">
								<span className="text-2xl font-bold text-indigo-600">ACME</span>
							</div>
							<div className="flex items-center space-x-4">
								<span className="text-sm font-bold text-orange-600">Click on Report Bug to view a demo of our bug reporting widget →</span>
								<button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
									data-ssimple-widget>
									Report Bug
								</button>
							</div>
						</div>
					</div>
				</header>

				{/* Main Content */}
				<main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
					{/* Stats Overview */}
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
						{[
							{ label: 'Total Users', value: '24,589', change: '+12%' },
							{ label: 'Active Projects', value: '156', change: '+3%' },
							{ label: 'Completion Rate', value: '92%', change: '+5%' },
							{ label: 'Revenue', value: '$45,233', change: '+8%' },
						].map((stat, index) => (
							<div key={index} className="bg-white overflow-hidden shadow rounded-lg">
								<div className="px-4 py-5 sm:p-6">
									<dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
									<dd className="mt-1 text-3xl font-semibold text-gray-900">{stat.value}</dd>
									<dd className="mt-2 text-sm text-green-600">{stat.change} from last month</dd>
								</div>
							</div>
						))}
					</div>

					{/* Charts Section */}
					<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
						{/* User Activity Chart */}
						<div className="bg-white p-6 rounded-lg shadow">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-lg font-medium text-gray-900">User Activity</h3>
								<select
									value={timeRange}
									onChange={(e) => setTimeRange(e.target.value)}
									className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
								>
									<option value="week">Last 7 days</option>
									<option value="month">Last 30 days</option>
									<option value="year">Last 12 months</option>
								</select>
							</div>
							<div className="h-80">
								<Line data={lineChartData} options={{ maintainAspectRatio: false }} />
							</div>
						</div>

						{/* Revenue Chart */}
						<div className="bg-white p-6 rounded-lg shadow">
							<h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
							<div className="h-80">
								<Bar data={barChartData} options={{ maintainAspectRatio: false }} />
							</div>
						</div>
					</div>

					{/* Bottom Section */}
					<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
						{/* Device Distribution */}
						<div className="bg-white p-6 rounded-lg shadow">
							<h3 className="text-lg font-medium text-gray-900 mb-4">Device Distribution</h3>
							<div className="h-64">
								<Doughnut data={doughnutChartData} options={{ maintainAspectRatio: false }} />
							</div>
						</div>

						{/* Recent Activity */}
						<div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
							<h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
							<div className="flow-root">
								<ul className="-my-5 divide-y divide-gray-200">
									{recentActivities.map((activity, index) => (
										<li key={index} className="py-4">
											<div className="flex items-center space-x-4">
												<div className="flex-shrink-0">
													<div className="h-8 w-8 rounded-full bg-gray-200"></div>
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-gray-900 truncate">
														{activity.user}
													</p>
													<p className="text-sm text-gray-500 truncate">{activity.action}</p>
												</div>
												<div className="flex-shrink-0 text-sm text-gray-500">
													{activity.time}
												</div>
											</div>
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</main>
			</div>
		</>
	);
} 