import { renderCards, renderCardsAsync, summonTemplate } from "../card-reader.js";
import { initDarkmode } from "../theme.js";
import { initNavBars, endLoading, delayHrefs, initNotifications } from "../utils.js";
import { initAuthState } from "../auth-firebase.js";
import { getPosts, auth, updatePostStatus, doesUserExist, getMonthlyCounts, getCategoryCounts } from "../init-firebase.js";
import { POST_TAG_NAME } from "../z_constants.js";


document.addEventListener("DOMContentLoaded", async () => {
	await renderCards();
	await renderCardsAsync(["feed_post"]);
	initDarkmode();
	initAuthState(async () => {
		if (!(await doesUserExist(auth.currentUser.uid))) {
			window.location.href = "signin";
			return;
		}
		initNotifications();
		endLoading();
	}, () => {
		window.location.href = "signin";
	})
	initNavBars();
	setTimeout(setupAdminBar, 500);
	getPostCards();
	renderLineChart()
	setTimeout(() => delayHrefs(), 500);
})

async function getPostCards() {
	const posts = await getPosts();
	const tbody = document.querySelector(".analytics_table_body");
	for (let i = 0; i < posts.length; i++) {
		const post = posts[i]
		const tr = document.createElement("tr");
		tr.innerHTML = `
            <td class="table_index">${i + 1}</td>
            <td class="table_author">${post.display_name}</td>
            <td class="table_category">${POST_TAG_NAME[post.category]}</td>
            <td class="table_location">${post.address_name}</td>
            <td class="table_status">${post.status}</td>
            <td class="table_description">${post.description}</td>
            <td class="table_datetime">${formatToCustomDate(post.created_at.toDate())}</td>
        `;
		tbody.appendChild(tr);
	}
}

function setupAdminBar() {
	document.querySelector(".anagraphs").href = "#analytics_graphs";
	document.querySelector(".anatables").href = "#analytics_tables";
	const params = new URLSearchParams(window.location.search);
	if (params.get("goto") === "graphs") {
		document.querySelector("#analytics_graphs").scrollIntoView();
	} else if (params.get("goto") === "tables") {
		document.querySelector("#analytics_tables").scrollIntoView();
	}
}

export function logout() {
	auth.signOut();
}


function formatToCustomDate(unixTimestamp) {
	if (!unixTimestamp) return "Invalid timestamp";

	// Convert to number (in case it's passed as a string)
	const tsNum = Number(unixTimestamp);

	// Detect seconds (10 digits) vs milliseconds (13 digits)
	const ts = tsNum < 1e12 ? tsNum * 1000 : tsNum;

	const date = new Date(ts);
	if (isNaN(date.getTime())) return "Invalid timestamp";

	const year = String(date.getFullYear()).slice(-2);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	let hours = date.getHours();
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const period = hours >= 12 ? "PM" : "AM";
	hours = hours % 12 || 12;
	const hourStr = String(hours).padStart(2, "0");

	return `${year}/${month}/${day} ${hourStr}:${minutes}${period}`;
}


function sortTable(colIndex) {
	const table = document.querySelector(".analytics_table");
	const tbody = table.tBodies[0];
	const rows = Array.from(tbody.querySelectorAll("tr"));

	const isAsc = table.getAttribute("data-sort-col") == colIndex &&
		table.getAttribute("data-sort-order") == "asc";

	// --- text cleaner (fixes spaces and nbsp)
	const clean = (text) =>
		(text || "")
			.replace(/\s+/g, " ")
			.replace(/\u00A0/g, " ")
			.trim();

	const sortedRows = rows.sort((a, b) => {
		const aText = clean(a.children[colIndex]?.innerText);
		const bText = clean(b.children[colIndex]?.innerText);

		// --- numeric sort
		const aNum = parseFloat(aText.replace(/[^\d.-]/g, ""));
		const bNum = parseFloat(bText.replace(/[^\d.-]/g, ""));
		if (!isNaN(aNum) && !isNaN(bNum)) {
			return isAsc ? bNum - aNum : aNum - bNum;
		}

		// --- date sort (safe)
		const parseCustomDate = (str) => {
			if (!str || !str.includes("/")) return null;
			const [datePart, timePart] = str.split(" ");
			if (!timePart || !timePart.includes(":")) return null;

			const [yy, mm, dd] = datePart.split("/").map(Number);
			if (!yy || !mm || !dd) return null;

			const [hh, minPeriodRaw] = timePart.split(":");
			if (!minPeriodRaw) return null;

			const min = minPeriodRaw.slice(0, 2);
			const period = minPeriodRaw.slice(2).toUpperCase();
			if (!period || (period !== "AM" && period !== "PM")) return null;

			let hour = parseInt(hh);
			if (period === "PM" && hour !== 12) hour += 12;
			if (period === "AM" && hour === 12) hour = 0;

			const date = new Date(2000 + yy, mm - 1, dd, hour, parseInt(min));
			return isNaN(date.getTime()) ? null : date;
		};

		const aDate = parseCustomDate(aText);
		const bDate = parseCustomDate(bText);
		if (aDate && bDate) {
			return isAsc ? bDate - aDate : aDate - bDate;
		}

		// --- alphabetical fallback
		return isAsc
			? bText.localeCompare(aText)
			: aText.localeCompare(bText);
	});

	tbody.innerHTML = "";
	sortedRows.forEach(r => tbody.appendChild(r));

	table.setAttribute("data-sort-col", colIndex);
	table.setAttribute("data-sort-order", isAsc ? "desc" : "asc");
}

async function renderLineChart() {
	const ctx = document.getElementById('posts_chart');
	const ctp = document.getElementById('posts_pie_chart');
	// eslint-disable-next-line no-undef
	const lineChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
			datasets: [{
				label: 'Number of posts.',
				data: await getMonthlyCounts(2025),
				fill: true,
				borderColor: resolveCSSVar('--color-secondary'),
				backgroundColor: resolveCSSVar('--color-secondary'),
				tension: 0.4,

			}]
		}, options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				x: {
					grid: { display: false }
				},
				y: {
					grid: { display: false },
					ticks: { display: false }
				}
			}
		}
	});
	const pieChart = new Chart(ctp, {
		type: 'pie',
		data: {
			labels: Object.values(POST_TAG_NAME),
			datasets: [{
				data: await getCategoryCounts(),
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
		}
	});
}

function resolveCSSVar(name) {
	return getComputedStyle(document.documentElement)
		.getPropertyValue(name)
		.trim();
}

window.sortTable = sortTable;