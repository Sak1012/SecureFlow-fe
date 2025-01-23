"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import {
	ChevronDown,
	ChevronUp,
	ChevronRight,
	ChevronLeft,
} from "lucide-react";

interface LogEntry {
	timeGenerated: string;
	clientIpAddress: string;
	caller: string;
	properties: {
		eventCategory?: string;
		message?: string;
		activityStatusValue?: string;
		resource?: string;
		statusCode?: string;
		httpRequest?: string;
		hierarchy?: string;
		eventDataId?: string;
		subscriptionId?: string;
		resourceProviderValue?: string;
		eventSubmissionTimestamp?: string;
	};
}

interface GroupedLogs {
	[category: string]: {
		[subcategory: string]: LogEntry[];
	};
}

export default function Main() {
	const [data, setData] = useState<LogEntry[]>([]);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(),
	);
	const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
	const [loading, setLoading] = useState(true);
	const URL = "http://localhost:5071";

	useEffect(() => {
		axios
			.get<LogEntry[]>(`${URL}/activity-logs`)
			.then((response) => {
				setData(response.data);
				setLoading(false);
			})
			.catch((error) => {
				console.error(error);
				setLoading(false);
			});
	}, []);
	console.log(data);
	const toggleSection = (path: string) => {
		setExpandedSections((prev) => {
			const newSet = new Set(prev);
			newSet.has(path) ? newSet.delete(path) : newSet.add(path);
			return newSet;
		});
	};

	const toggleLog = (logId: string) => {
		setExpandedLogs((prev) => {
			const newSet = new Set(prev);
			newSet.has(logId) ? newSet.delete(logId) : newSet.add(logId);
			return newSet;
		});
	};

	const groupedData = data.reduce<GroupedLogs>((acc, log) => {
		const category = log.properties?.eventCategory || "Uncategorized";
		const messageParts = log.properties?.message?.split("/") || [];
		const action = messageParts[messageParts.length - 1] || "other";

		if (!acc[category]) acc[category] = {};
		if (!acc[category][action]) acc[category][action] = [];

		acc[category][action].push(log);
		return acc;
	}, {});

	return (
		<main className="p-4 max-w-6xl mx-auto">
			<h1 className="text-2xl font-bold mb-6">Activity Logs</h1>
			{loading && <div className="text-center p-4">Loading logs...</div>}

			{Object.entries(groupedData).map(([category, subcategories]) => {
				const categoryPath = `category:${category}`;
				const isCategoryExpanded = expandedSections.has(categoryPath);

				return (
					<section
						key={categoryPath}
						className="mb-4 border rounded-lg overflow-hidden"
					>
						<button
							onClick={() => toggleSection(categoryPath)}
							className="w-full p-4 bg-gray-100 hover:bg-gray-200 flex justify-between items-center"
						>
							<div className="flex items-center gap-4">
								{isCategoryExpanded ? (
									<ChevronDown size={20} />
								) : (
									<ChevronRight size={20} />
								)}
								<span className="text-lg font-semibold">{category}</span>
								<span className="text-sm text-gray-500">
									({Object.values(subcategories).flat().length} events)
								</span>
							</div>
						</button>
						{isCategoryExpanded && (
							<section className="bg-gray-50 p-4 space-y-4">
								{Object.entries(subcategories).map(([action, logs]) => {
									const actionPath = `${categoryPath}|action:${action}`;
									const isActionExpanded = expandedSections.has(actionPath);

									return (
										<section
											key={actionPath}
											className="border rounded-lg overflow-hidden"
										>
											<button
												onClick={() => toggleSection(actionPath)}
												className="w-full p-4 bg-white hover:bg-gray-50 flex justify-between items-center"
											>
												<div className="flex items-center gap-4 ml-4">
													{isActionExpanded ? (
														<ChevronDown size={18} />
													) : (
														<ChevronRight size={18} />
													)}
													<span className="font-medium capitalize">
														{action}
													</span>
													<span className="text-sm text-gray-500">
														({logs.length} events)
													</span>
												</div>
											</button>

											{isActionExpanded && (
												<section className="bg-white p-4 space-y-4">
													{logs.map((log, index) => {
														const logId = `${categoryPath}|${actionPath}|${index}`;
														const isLogExpanded = expandedLogs.has(logId);

														return (
															<section
																key={logId}
																className="p-4 border rounded shadow-sm hover:shadow-md transition-shadow bg-white"
															>
																{/* MAIN CONTENT - ALWAYS VISIBLE */}
																<section className="grid grid-cols-1 md:grid-cols-4 gap-4">
																	<section>
																		<p className="text-sm font-medium text-gray-500">
																			Time
																		</p>
																		<p className="text-sm">
																			{new Date(
																				log.timeGenerated,
																			).toLocaleString()}
																		</p>
																	</section>

																	<section>
																		<p className="text-sm font-medium text-gray-500">
																			Status
																		</p>
																		<section className="flex items-center gap-2">
																			<span className="text-sm">
																				{log.properties?.activityStatusValue ||
																					"N/A"}
																			</span>
																			{log.properties?.statusCode && (
																				<span
																					className={`px-2 py-1 rounded-full text-xs ${log.properties.statusCode ===
																							"OK" ||
																							log.properties.statusCode ===
																							"Created"
																							? "bg-green-100 text-green-800"
																							: "bg-yellow-100 text-yellow-800"
																						}`}
																				>
																					{log.properties.statusCode}
																				</span>
																			)}
																		</section>
																	</section>

																	<section>
																		<p className="text-sm font-medium text-gray-500">
																			IP Address
																		</p>
																		<p className="text-sm">
																			{log.clientIpAddress}
																		</p>
																	</section>

																	<section className="md:col-span-2">
																		<p className="text-sm font-medium text-gray-500">
																			Message
																		</p>
																		<p className="text-sm break-words">
																			{log.properties?.message || "No message"}
																		</p>
																	</section>

																	<section className="md:col-span-2">
																		<p className="text-sm font-medium text-gray-500">
																			Resource
																		</p>
																		<p className="text-sm break-words">
																			{log.properties?.resource || "N/A"}
																		</p>
																	</section>
																</section>

																{/* EXPANDABLE CONTENT */}
																{isLogExpanded && (
																	<section className="mt-4 pt-4 border-t space-y-2">
																		<section className="grid grid-cols-1 md:grid-cols-2 gap-4">
																			<section>
																				<p className="text-sm font-medium text-gray-500">
																					Caller
																				</p>
																				<p className="text-sm break-words">
																					{log.caller}
																				</p>
																			</section>

																			<section>
																				<p className="text-sm font-medium text-gray-500">
																					Event ID
																				</p>
																				<p className="text-sm break-words">
																					{log.properties?.eventDataId || "N/A"}
																				</p>
																			</section>

																			<section>
																				<p className="text-sm font-medium text-gray-500">
																					Hierarchy
																				</p>
																				<p className="text-sm break-words">
																					{log.properties?.hierarchy || "N/A"}
																				</p>
																			</section>

																			<section>
																				<p className="text-sm font-medium text-gray-500">
																					Subscription ID
																				</p>
																				<p className="text-sm break-words">
																					{log.properties?.subscriptionId ||
																						"N/A"}
																				</p>
																			</section>

																			<section className="md:col-span-2">
																				<p className="text-sm font-medium text-gray-500">
																					HTTP Request
																				</p>
																				<pre className="text-sm break-words whitespace-pre-wrap">
																					{log.properties?.httpRequest || "N/A"}
																				</pre>
																			</section>
																		</section>
																	</section>
																)}

																{/* VIEW MORE BUTTON */}
																<button
																	onClick={() => toggleLog(logId)}
																	className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
																>
																	{isLogExpanded ? (
																		<>
																			<ChevronUp size={16} />
																			View Less
																		</>
																	) : (
																		<>
																			<ChevronDown size={16} />
																			View More
																		</>
																	)}
																</button>
															</section>
														);
													})}
												</section>
											)}
										</section>
									);
								})}
							</section>
						)}
					</section>
				);
			})}
		</main>
	);
}
